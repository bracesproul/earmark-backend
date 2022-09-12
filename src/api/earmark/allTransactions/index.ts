/* eslint-disable */
export {};
import dotenv from 'dotenv';
import moment from 'moment';

dotenv.config();
const globalVars = require('../../../lib/globalVars');
const { getAccessTokens, getAccessTokensTransactions } = require('../../../lib/firebase/firestore/');
const express = require('express');
const router = express.Router();

const {
    Configuration,
    PlaidApi,
    PlaidEnvironments,
    AccountsGetRequest
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

const API_URL = globalVars().API_URL;

/*
            "id": "vd3rMJGPDNTwnNeBERX3CLNL76a19WCXgmmaW",
            "col1": "SparkFun",
            "col2": "2021-12-31",
            "col3": 89.4,
            "col4": "Food and Drink"
*/

const formatCategoryName = (categoryName:string) => {
    let string  = categoryName.split('_').join(' ')
    string = string.toLowerCase()
    return string.charAt(0).toLowerCase().toUpperCase() + string.slice(1);
}

const getCategories = (accounts:any, transactionList:any) => {
    let categoryList:any = [];
    accounts.forEach((account:any) => {
        categoryList.push({
            account_id: account.account_id,
            categories: []
        })
    })
    transactionList.forEach((transaction:any) => {
        transaction.transactions.forEach((txn:any) => {
            categoryList.forEach((category:any) => {
                if (category.account_id === transaction.account_id) {
                    category.categories.push(txn.category)
                }
            })
        })
    })
    return categoryList.map((category:any) => {
        return {
            account_id: category.account_id,
            categories: [...new Set(category.categories)]
        }
    })
}

function addDollarSignToAmount(num:number | string) {
    let newNumber;
    if (typeof num === 'number') {
        newNumber = num.toString();
    }
    if (newNumber === '0') {
        newNumber = parseInt(newNumber);
        return '$' + newNumber.toFixed(2);
    }
    if (newNumber.includes('-')) {
        newNumber = newNumber.replace('-', '');
        newNumber = parseInt(newNumber);
        return '-$' + newNumber.toFixed(2);
    }
    newNumber = parseInt(newNumber);
    return '$' + newNumber.toFixed(2);
}

const getTransactions = async (transactions:any, accounts:any) => {
    let transactionList:any = [];
    let categories:any = [];
    if (transactions.length === 0) {
        return {
            transactions: null as null,
            categories: null as null,
            no_transactions: true,
        }
    }
    accounts.forEach((account:any) => {
        transactionList.push({
            account_id: account.account_id,
            account_name: account.name,
            account_official_name: account.official_name,
            subtype: account.subtype,
            transactions: []
        })
        categories.push({
            account_id: account.account_id,
            categories: []
        })
        transactions.forEach((transaction:any) => {
            if (transaction.account_id === account.account_id) {
                transactionList.forEach((txn:any) => {
                    if (txn.account_id === transaction.account_id) {
                        txn.transactions.push({
                            id: transaction.transaction_id,
                            name: transaction.name,
                            date: moment(transaction.date).format('MM/DD/YYYY'),
                            amount: addDollarSignToAmount(transaction.amount),
                            category: formatCategoryName(transaction.personal_finance_category.primary)
                        })
                    }
                })
            }
        });
    });
    // console.log(transactionList);

    // console.log(getCategories(accounts, transactionList));
    return {
        transactions: await transactionList,
        categories: await getCategories(accounts, transactionList),
        no_transactions: false,
    }
}

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const queryType = req.query.queryType;
    const test = req.query.test;
    let finalResponse:any = [];
    let finalStatus;

    if (queryType === 'datagrid') {
        console.log('queryType is datagrid');
        let full_response;
        let dataGridTransactions = new Array;
        let transactionMetadata = new Array;
        let categoriesAvail = new Array;
        const accessTokens = await getAccessTokens(user_id);
        for (let i = 0; i < accessTokens.length; i++) {
            try {
                // @ts-ignore
                const request: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: startDate,
                    end_date: endDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const { data } = await client.transactionsGet(request);

                await getTransactions(data.transactions, data.accounts);

                full_response = data;

                data.transactions.forEach((transaction:any) => {
                    categoriesAvail.push(transaction.personal_finance_category.primary);
                    dataGridTransactions.push({
                        id: transaction.transaction_id, 
                        col1: transaction.name, 
                        col2: transaction.authorized_date, 
                        col3: addDollarSignToAmount(transaction.amount),
                        col4: transaction.category[0]
                    });
    
                    transactionMetadata.push({
                        [transaction.account_id]: {
                            account_id: transaction.account_id,
                            fullCategory: transaction.category,
                            iso_currency_code: transaction.iso_currency_code,
                            pending: transaction.pending,
                            transaction_id: transaction.transaction_id,
                        }
                    });
                });
                const uniqueChars = [...new Set(categoriesAvail)];

                finalResponse.push({
                    institution: data.item.institution_id,
                    data: {
                        transactions: (await getTransactions(data.transactions, data.accounts)).transactions,
                        categories: (await getTransactions(data.transactions, data.accounts)).categories,
                    }
                })
                finalStatus = 200;
            } catch (error) {
                console.error(error);
                finalStatus = 400;
                finalResponse = error;
            };
        };
    } else if (queryType === 'lineChart') {
        let full_response;
        let categoryList = new Array;
        let accountMetadata = new Array;
        let accounts = new Array;
        const accessTokens = await getAccessTokensTransactions(user_id);
    
        for (let i = 0; i < accessTokens.length; i++) {
            try {
                // @ts-ignore
                const request: TransactionsGetRequest = {
                    access_token: accessTokens[i],
                    start_date: startDate,
                    end_date: endDate,
                    options: {
                        include_personal_finance_category: true,
                    },
                };
                const { data } = await client.transactionsGet(request);
                full_response = data;
                
                full_response.accounts.forEach((account:any) => {
                    accounts.push({[account.account_id]: []});
                    categoryList.push({[account.account_id]: []});
                });
                full_response.transactions.forEach((transaction:any) => {
                    const cat1 = transaction.category[0].split(' ').join('_').toLowerCase();
                    const cat2 = transaction.category[1].split(' ').join('_').toLowerCase();
                    const both = cat1 + '-' + cat2;
                    categoryList.push({[both]: {
                        amount: transaction.amount,
                        date: transaction.authorized_date,
                        name: transaction.name,
                    }});
                });


    
                accounts.map(async (account:any) => {
                    data.transactions.map((transaction:any) => {
                        if (transaction.account_id in account) {
                            account[transaction.account_id].push({
                                id: transaction.transaction_id, 
                                col1: transaction.name, 
                                col2: transaction.authorized_date, 
                                col3: transaction.amount,
                                col4: transaction.category[0],
                            });
                        }
                    });
                });
    
                data.accounts.forEach((account:any) => {
                    accountMetadata.push({
                        account: {
                            account_id: account.account_id,
                            name: account.name,
                            official_name: account.official_name,
                            subtype: account.subtype,
                            type: account.type,
                        }
                    });
                });
                    
                finalResponse = {
                    accounts: accounts,
                    transactionMetadata: accountMetadata,
                    categoryList: categoryList,
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        requestTime: new Date().toLocaleString(),
                        nextApiUrl: "/api/earmark/allTransactions",
                        backendApiUrl: "/api/allTransactions",
                        method: "GET",
                        responses: full_response
                    },
                };
                finalStatus = 200;
            } catch (error) {
                console.error(error);
                finalStatus = 400;
                finalResponse = error;
            };
        };
    }


    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;