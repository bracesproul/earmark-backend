/* eslint-disable */
// TODO: add check for if no transactions are returned for given time period, if so noTxns: true
// ^to prevent frontend from thinking error occured and no txns were found

// TODO: connect and integrate total spending with frontend

/* eslint-disable */
export {};
const dotenv = require('dotenv');
dotenv.config();
// @ts-ignore
const parseNumbers = require('../../../lib/parseNumbers');
const { getAccessTokens } = require('../../../services/db');
const express = require('express');
const moment = require('moment');
const router = express.Router();
const { 
    Configuration, 
    PlaidApi, 
    PlaidEnvironments, 
} = require("plaid");

const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.CLIENT_ID,
            'PLAID-SECRET': process.env.SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
});
const client = new PlaidApi(configuration);

const deleteByValue = (array: Array<any>, value: Number) => {
    const index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index, 1);
    }
};

const makeFirstLetterUpperCase = (string: String) => {
    string = string.split('_').join(' ');
    string = string.toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
    return string;
};

const getDatesArray = (range: number) => {
    let datesArray = new Array();
    for (let i = 0; i < range; i++) {
        let startDate = moment();
        startDate = startDate.subtract(i, "days");
        startDate = startDate.format("YYYY-MM-DD");
        datesArray.push(startDate);
    }
    return datesArray;
};

const getPrevDatesArray = (startRange: number, endRange: number) => {
    let datesArray = new Array();
    for (let i = startRange; i < endRange; i++) {
        let startDate = moment();
        startDate = startDate.subtract(i, "days");
        startDate = startDate.format("YYYY-MM-DD");
        datesArray.push(startDate);
    }
    return datesArray;
};

// spending overview function
const spendingOverviewFunction = async (transactionsResponse: any) => {
    let finalSpendingOverview = new Array();
    if (transactionsResponse.length == 0) {
        finalSpendingOverview.push({
            name: null,
            date: null,
            amount: null,
            category: null,
            id: null,
            account_id: null,
            no_transactions: true,
        });
        return finalSpendingOverview;
    }
    transactionsResponse.forEach((transaction: any) => {
        const amount = parseNumbers(transaction.amount);
        let name = transaction.merchant_name
        if (!transaction.merchant_name) name = transaction.name;
        finalSpendingOverview.push({
            name: name,
            date: transaction.date,
            amount: amount,
            category: makeFirstLetterUpperCase(transaction.personal_finance_category.primary),
            id: transaction.transaction_id,
            account_id: transaction.account_id,
            no_transactions: false,
        })
    });
    return finalSpendingOverview;
}

// top merchants function
const topMerchantsFunction = async (transactionsResponse: any) => {
    let transactionNameCountObject: any = new Object();
    let topTxnArray: any = new Array();
    let alreadyCounted: any = new Array();
    let frequentMerchants: any = new Array();

    if (transactionsResponse.length == 0) {
        frequentMerchants.push({
            totalTransactions: 0,
            startDate: null,
            endDate: null,
            category: null,
            totalSpent: null,
            allAmounts: null,
            name: null,
            id: null,
            no_transactions: true,
        });
        return frequentMerchants;
    }

    transactionsResponse.forEach((transaction: any) => {
        const amount = transaction.amount;
        const rawAmount = transaction.amount.toFixed(2);
        if (!transaction.merchant_name) return;
        let merchantName: string = transaction.merchant_name.replaceAll(/\W/g, '_');
        if (!transactionNameCountObject[merchantName]) {
            transactionNameCountObject[merchantName] = {
                count: 1,
                endDate: transaction.date,
                amount: amount,
                allAmounts: [rawAmount],
            }
        }
        transactionNameCountObject[merchantName] = {
            count: transactionNameCountObject[merchantName].count + 1,
            endDate: transactionNameCountObject[merchantName].endDate,
            startDate: transaction.date,
            category: transaction.personal_finance_category.primary,
            amount: transactionNameCountObject[merchantName].amount + amount,
            allAmounts: transactionNameCountObject[merchantName].allAmounts.concat(transaction.amount),
            normalMerchantName: transaction.merchant_name,
            id: transaction.transaction_id
        }
    });

    transactionsResponse.forEach((transaction: any) => {
        if (!transaction.merchant_name) return;
        let merchantName: string = transaction.merchant_name.replaceAll(/\W/g, '_');
        if (alreadyCounted.includes(merchantName)) return;
        topTxnArray.push(transactionNameCountObject[merchantName].count);
        alreadyCounted.push(merchantName);
    });
    let topValues = topTxnArray.sort((a: number, b: number) => b - a).slice(0, 5);
    let transactionKeys = Object.keys(transactionNameCountObject);

    for (let i = 0; i < transactionKeys.length; i++) {
        let currentCount = transactionNameCountObject[transactionKeys[i]].count;
        if (topValues.includes(currentCount)) {
            deleteByValue(topValues, currentCount)
            frequentMerchants.push({
                totalTransactions: currentCount,
                startDate: transactionNameCountObject[transactionKeys[i]].startDate,
                endDate: transactionNameCountObject[transactionKeys[i]].endDate,
                category: makeFirstLetterUpperCase(transactionNameCountObject[transactionKeys[i]].category),
                totalSpent: parseNumbers(transactionNameCountObject[transactionKeys[i]].amount),
                allAmounts: transactionNameCountObject[transactionKeys[i]].allAmounts,
                name: transactionNameCountObject[transactionKeys[i]].normalMerchantName,
                id: transactionNameCountObject[transactionKeys[i]].id,
                no_transactions: false,
            });
        };
    };
    return frequentMerchants;
}

// helper functions for totalSpending
function breakupAccounts(accounts:any) {
    return accounts.map((account:any) => {
        return {
            account_id: account.account_id,
            total_spending: {
                totalSpent24Hours: 0,
                totalSpent2Days: 0,
                totalSpent7Days: 0,
                totalSpent14Days: 0,
                totalSpent30Days: 0,
                totalSpent60Days: 0,
            }
        };
    })
}
async function newTotalSpending(transactionsResponse:any, accounts:any) {
    let accountsSorted = breakupAccounts(accounts);

    for (let i = 0; i < transactionsResponse.length; i++) {
        const transactionDate = moment(transactionsResponse[i].date, 'YYYY-MM-DD');
        const currentDate = moment();

        const oneDayAgo = moment([]).subtract(1, 'days');
        const twoDaysAgo = moment([]).subtract(2, 'days');
        const sevenDaysAgo = moment([]).subtract(7, 'days');
        const eightDaysAgo = moment([]).subtract(8, 'days');
        const fifteenDaysAgo = moment([]).subtract(15, 'days');
        const thirtyDaysAgo = moment([]).subtract(30, 'days');
        const thirtyOneDaysAgo = moment([]).subtract(31, 'days');
        const sixtyOneDaysAgo = moment([]).subtract(61, 'days');

        if (transactionDate == currentDate) {
            accountsSorted.forEach((account:any) => {
                if (account.account_id == transactionsResponse[i].account_id) {
                    account.total_spending.totalSpent24Hours += transactionsResponse[i].amount;
                }
            })
        }
        if (moment(transactionDate).isBetween(twoDaysAgo, oneDayAgo)) {
            accountsSorted.forEach((account:any) => {
                if (account.account_id == transactionsResponse[i].account_id) {
                    account.total_spending.totalSpent2Days += transactionsResponse[i].amount;
                }
            })
        }

        if (moment(transactionDate).isBetween(sevenDaysAgo, currentDate)) {
            accountsSorted.forEach((account:any) => {
                if (account.account_id == transactionsResponse[i].account_id) {
                    account.total_spending.totalSpent7Days += transactionsResponse[i].amount;
                }
            })
        }
        if (moment(transactionDate).isBetween(fifteenDaysAgo, eightDaysAgo)) {
            accountsSorted.forEach((account:any) => {
                if (account.account_id == transactionsResponse[i].account_id) {
                    account.total_spending.totalSpent14Days += transactionsResponse[i].amount;
                }
            })
        }

        if (moment(transactionDate).isBetween(thirtyDaysAgo, currentDate)) {
            accountsSorted.forEach((account:any) => {
                if (account.account_id == transactionsResponse[i].account_id) {
                    account.total_spending.totalSpent30Days += transactionsResponse[i].amount;
                }
            })
        }
        if (moment(transactionDate).isBetween(sixtyOneDaysAgo, thirtyOneDaysAgo)) {
            accountsSorted.forEach((account:any) => {
                if (account.account_id == transactionsResponse[i].account_id) {
                    account.total_spending.totalSpent60Days += transactionsResponse[i].amount;
                }
            })
        }
    }
    console.log(accountsSorted);
    return accountsSorted;
}

// total spending function
const totalSpendingFunction = async (transactionsResponse: any) => {
    let totalSpentToday: number = 0;
    let totalSpentYesterday: number = 0;
    let totalSpentWeek: number = 0;
    let totalSpentLastWeek: number = 0;
    let totalSpentMonth: number = 0;
    let totalSpentLastMonth: number = 0;
    const date = new Date();
    const today = date.toISOString().split('T')[0] 
    const momentDate = moment();
    const yesterday = momentDate.subtract(1, 'days').format('YYYY-MM-DD');
    const week = getDatesArray(7);
    const lastWeek = getPrevDatesArray(7, 14);
    const month = getDatesArray(30);
    const lastMonth = getPrevDatesArray(30, 60);
    let dailyChange = 'less';
    let weeklyChange = 'less';
    let monthlyChange = 'less';
    
    transactionsResponse.forEach((transaction: any) => {
        const amount = Math.abs(transaction.amount);
        if (transaction.date === today) totalSpentToday += amount;
        if (transaction.date === yesterday) totalSpentYesterday += amount;

        if (week.includes(transaction.date)) totalSpentWeek += amount;
        if (lastWeek.includes(transaction.date)) totalSpentLastWeek += amount;

        if (month.includes(transaction.date)) totalSpentMonth += amount;
        if (lastMonth.includes(transaction.date)) totalSpentLastMonth += amount;
    });
    if (totalSpentToday == undefined) totalSpentToday = 0;
    if (totalSpentYesterday == undefined) totalSpentYesterday = 0;
    if (totalSpentWeek == undefined) totalSpentWeek = 0;

    if (totalSpentToday > totalSpentYesterday) dailyChange = 'more';
    if (totalSpentWeek > totalSpentLastWeek) weeklyChange = 'more';
    if (totalSpentMonth > totalSpentLastMonth) monthlyChange = 'more';

    if (totalSpentToday === 0) dailyChange = 'zero_spending';
    if (totalSpentWeek === 0) weeklyChange = 'zero_spending';
    if (totalSpentMonth === 0) monthlyChange = 'zero_spending';

    return [
        {
            timeFrame: 'Today',
            change: dailyChange,
            amount: parseNumbers(totalSpentToday),
            text: 'Total spent today',
        },
        {
            timeFrame: '7 Days',
            change: weeklyChange,
            amount: parseNumbers(totalSpentWeek),
            text: 'Total spent in the last 7 days',
        },
        {
            timeFrame: '30 Days',
            change: monthlyChange,
            amount: parseNumbers(totalSpentMonth),
            text: 'Total spent in the last 30 days',
        }
    ]
};

const parseIndividualAccounts = (institution_name: string, account: any, ins_id: string, accountDetails: any) => {
    if (accountDetails.length === 0) {
        accountDetails.push({
            institution: institution_name,
            ins_id: ins_id,
            accounts: [{
                accountId: account.account_id,
                balance: parseNumbers(account.balances.available),
                name: account.name,
                subtype: account.subtype,
                ins_id: ins_id,
                institution_name_normal: institution_name,
                accountNumber: 0,
                institutionName: institution_name.split(' ').join('_'),
            }]
        });
    };
    return { accountDetails: accountDetails };
};

const findAccountsWithinBanksAndStore = (ins_id: string, account: any, institution_name: string, accountDetails: any) => {
    accountDetails.forEach((accountDetail: any) => {
        if (accountDetail.ins_id === ins_id) {
            accountDetail.accounts.push({
                accountId: account.account_id,
                balance: parseNumbers(account.balances.available),
                name: account.name,
                subtype: account.subtype,
                ins_id: ins_id,
                institution_name_normal: institution_name,
                accountNumber: 0,
                institutionName: institution_name.split(' ').join('_'),
            });
        }
    });
    return { accountDetails: accountDetails };
};

const accountDetails = async (insSearchResponse: any, data: any, ins_id: string) => {
    const institution_name = insSearchResponse.data.institution.name;
    let accountDetails: any = new Array();
    /*
    const account = data.accounts


    data.accounts.forEach((account: any) => {
        const parseAccounts = () => {
            if (accountDetails.length === 0) {
                accountDetails.push({
                    institution: institution_name,
                    ins_id: ins_id,
                    accounts: [{
                        accountId: account.account_id,
                        balance: parseNumbers(account.balances.available),
                        name: account.name,
                        subtype: account.subtype,
                        ins_id: ins_id,
                        institution_name_normal: institution_name,
                        accountNumber: 0,
                        institutionName: institution_name.split(' ').join('_'),
                    }]
                });
                return;
            };
        };
        const matchAccountsToBanksAndStore = () => {
            accountDetails.forEach((accountDetail: any) => {
                if (accountDetail.ins_id === ins_id) {
                    accountDetail.accounts.push({
                        accountId: account.account_id,
                        balance: parseNumbers(account.balances.available),
                        name: account.name,
                        subtype: account.subtype,
                        ins_id: ins_id,
                        institution_name_normal: institution_name,
                        accountNumber: 0,
                        institutionName: institution_name.split(' ').join('_'),
                    });
                }
            });
        };
        parseAccounts();
        matchAccountsToBanksAndStore();
    });


    */
    data.accounts.forEach((account: any) => {
        if (accountDetails.length === 0) {
            accountDetails.push({
                institution: institution_name,
                ins_id: ins_id,
                accounts: [{
                    accountId: account.account_id,
                    balance: parseNumbers(account.balances.available),
                    name: account.name,
                    subtype: account.subtype,
                    ins_id: ins_id,
                    institution_name_normal: institution_name,
                    accountNumber: 0,
                    institutionName: institution_name.split(' ').join('_'),
                }]
            });
            return;
        };

        accountDetails.forEach((accountDetail: any) => {
            if (accountDetail.ins_id === ins_id) {
                accountDetail.accounts.push({
                    accountId: account.account_id,
                    balance: parseNumbers(account.balances.available),
                    name: account.name,
                    subtype: account.subtype,
                    ins_id: ins_id,
                    institution_name_normal: institution_name,
                    accountNumber: 0,
                    institutionName: institution_name.split(' ').join('_'),
                });
            }
        });
    });

    data.numbers.ach.forEach((number: any) => {
        accountDetails.forEach((account: any) => {
            account.accounts.forEach((accountDetail: any) => {
                if (accountDetail.accountId === number.account_id) {
                    accountDetail.accountNumber = number.account;
                }
            });
        });
    });
    return accountDetails;
};

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const queryType = req.query.queryType;
    const spendingStartDate = req.query.spendingStartDate;
    const spendingEndDate = req.query.spendingEndDate;
    const merchantsStartDate = req.query.merchantsStartDate;
    const merchantsEndDate = req.query.merchantsEndDate;
    const accessTokens = await getAccessTokens(user_id);

    let finalResponse;
    let finalStatus;
    let requestIds = new Array();
    for (let i = 0; i < accessTokens.length; i++) {
        try {
            if (queryType === 'spendingOverview') {
                // @ts-ignore
                const spendingRequest: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: spendingStartDate,
                    end_date: spendingEndDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const spendingResponse = await client.transactionsGet(spendingRequest);
                const spendingTransactions = spendingResponse.data.transactions;
                finalResponse = {
                    spendingOverview: await spendingOverviewFunction(spendingTransactions),
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        spendingOverviewDates: [spendingStartDate, spendingEndDate],
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/dashboard",
                        backendApiUrl: "/api/transactionsGet",
                        method: "GET",
                    },
                };
                finalStatus = 200;
            }
            else if (queryType === 'topMerchants') {
                // @ts-ignore
                const merchantsRequest: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: merchantsStartDate,
                    end_date: merchantsEndDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const merchantsResponse = await client.transactionsGet(merchantsRequest);
                const merchantsTransactions = merchantsResponse.data.transactions;
                finalResponse = {
                    topMerchants: await topMerchantsFunction(merchantsTransactions),
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        spendingOverviewDates: [merchantsStartDate, merchantsEndDate],
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/dashboard",
                        backendApiUrl: "/api/transactionsGet",
                        method: "GET",
                    },
                };
                finalStatus = 200;
            }
            else if (queryType === 'totalSpending') {
                // @ts-ignore
                const request: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: startDate,
                    end_date: endDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const response = await client.transactionsGet(request);
                const transactionsResponse = response.data.transactions;

                await newTotalSpending(transactionsResponse, response.data.accounts);

                finalResponse = {
                    totalSpending: await totalSpendingFunction(transactionsResponse),
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        spendingOverviewDates: [startDate, endDate],
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/dashboard",
                        backendApiUrl: "/api/transactionsGet",
                        method: "GET",
                    },
                };
                finalStatus = 200;
            }
            else if (queryType === 'accountDetails') {
                // @ts-ignore
                const authRequest: AuthGetRequest = {
                    access_token: accessTokens[i],
                };
                const { data } = await client.authGet(authRequest);
                const ins_id = data.item.institution_id;
                // @ts-ignore
                const request: InstitutionsGetByIdRequest = {
                    institution_id: ins_id,
                    country_codes: ['US'],
                };
                const insSearchResponse = await client.institutionsGetById(request);
                finalResponse = {
                    accountDetails: await accountDetails(insSearchResponse, data, ins_id),
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/dashboard",
                        backendApiUrl: "/api/transactionsGet",
                        method: "GET",
                    },
                };
                finalStatus = 200;
            }
            else if (queryType === "all") {
                // @ts-ignore
                const authRequest: AuthGetRequest = {
                    access_token: accessTokens[i],
                };
                const authResponse = await client.authGet(authRequest);

                // @ts-ignore
                const institutionRequest: InstitutionsGetByIdRequest = {
                    institution_id: authResponse.data.item.institution_id,
                    country_codes: ['US'],
                };
                const insSearchResponse = await client.institutionsGetById(institutionRequest);

                // @ts-ignore
                const merchantsRequest: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: merchantsStartDate,
                    end_date: merchantsEndDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const merchantsResponse = await client.transactionsGet(merchantsRequest);

                // @ts-ignore
                const spendingRequest: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: spendingStartDate,
                    end_date: spendingEndDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const spendingResponse = await client.transactionsGet(spendingRequest);

                // @ts-ignore
                const request: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: startDate,
                    end_date: endDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const response = await client.transactionsGet(request);
                const transactionsResponse = response.data.transactions;

                finalResponse = {
                    accountDetails: await accountDetails(insSearchResponse, authResponse.data, authResponse.data.item.institution_id),
                    totalSpending: await totalSpendingFunction(transactionsResponse),
                    topMerchants: await topMerchantsFunction(merchantsResponse.data.transactions),
                    spendingOverview: await spendingOverviewFunction(spendingResponse.data.transactions),
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/dashboard",
                        backendApiUrl: "/api/transactionsGet",
                        method: "GET",
                    },
                };
            }
            // finalResponse = finalResponse;
            finalStatus = 200;
        } catch (error) {
            console.error(error)
            finalStatus = 400;
            finalResponse = error;
        };
    }

    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;