/* eslint-disable */
/*
  function createData(
    name: string,
    date: string,
    amount: number,
    category: string,
  ) 
*/

/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const globalvars = require('../../../lib/globalvars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const updateFirestore = require('../../../lib/firebase/firestore/');
const express = require('express');
const moment = require('moment');
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

const deleteByValue = (array: Array<any>, value: Number) => {
    const index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

const makeFirstLetterUpperCase = (string: String) => {
    string = string.split('_').join(' ');
    string = string.toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
    return string;
}

const roundUnevenNumbers = (number: number) => {
    if (number === 0) return 0;
    const numString = number.toString();
    if (numString.includes('.')) {
        numString.split('.')[1].length > 2 ? number = parseFloat(numString.split('.')[0] + '.' + numString.split('.')[1].slice(0, 2)) : number = parseFloat(numString);
        return number;
    }
    return parseInt(numString);
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
}

const getPrevDatesArray = (startRange: number, endRange: number) => {
    let datesArray = new Array();
    for (let i = startRange; i < endRange; i++) {
        let startDate = moment();
        startDate = startDate.subtract(i, "days");
        startDate = startDate.format("YYYY-MM-DD");
        datesArray.push(startDate);
    }
    return datesArray;
}
// spending overview function
const spendingOverviewFunction = async (transactionsResponse: any) => {
    let finalSpendingOverview = new Array();
    transactionsResponse.forEach((transaction: any) => {
        if (!transaction.merchant_name) return;
        finalSpendingOverview.push({
            name: transaction.merchant_name,
            date: transaction.date,
            amount: transaction.amount,
            category: makeFirstLetterUpperCase(transaction.personal_finance_category.primary),
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

    transactionsResponse.forEach((transaction: any) => {
        if (!transaction.merchant_name) return;
        let merchantName: string = transaction.merchant_name.replaceAll(/\W/g, '_');
        if (!transactionNameCountObject[merchantName]) {
            transactionNameCountObject[merchantName] = {
                count: 1,
                endDate: transaction.date,
                amount: transaction.amount,
                allAmounts: [transaction.amount],
            }
        }
        transactionNameCountObject[merchantName] = {
            count: transactionNameCountObject[merchantName].count + 1,
            endDate: transactionNameCountObject[merchantName].endDate,
            startDate: transaction.date,
            category: transaction.personal_finance_category.primary,
            amount: transactionNameCountObject[merchantName].amount + transaction.amount,
            allAmounts: transactionNameCountObject[merchantName].allAmounts.concat(transaction.amount),
            normalMerchantName: transaction.merchant_name,
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
                totalSpent: roundUnevenNumbers(transactionNameCountObject[transactionKeys[i]].amount),
                allAmounts: transactionNameCountObject[transactionKeys[i]].allAmounts,
                name: transactionNameCountObject[transactionKeys[i]].normalMerchantName,
            });
        };
    };
    return frequentMerchants;
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
    const yesterday = momentDate.subtract(1, 'days');
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
            amount: roundUnevenNumbers(totalSpentToday),
            text: 'Total spent today',
        },
        {
            timeFrame: '7 Days',
            change: weeklyChange,
            amount: roundUnevenNumbers(totalSpentWeek),
            text: 'Total spent in the last 7 days',
        },
        {
            timeFrame: '30 Days',
            change: monthlyChange,
            amount: roundUnevenNumbers(totalSpentMonth),
            text: 'Total spent in the last 30 days',
        }
    ]
};

const client = new PlaidApi(configuration);

const API_URL = globalvars().API_URL;

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const queryType = req.query.queryType;


    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id', 'startDate', 'endDate'];
    const params = {
        user_id: user_id,
        startDate: startDate,
        endDate: endDate,
    };
    const nextApiUrl = '/api/earmark/dashboard';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        await res.status(400);
        await res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE

    const accessTokens = await updateFirestore.getAccessTokensTransactions(user_id);

    let finalResponse;
    let finalStatus = 400;
    let requestIds = new Array();
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
            const response = await client.transactionsGet(request);
            const transactionsResponse = response.data.transactions;
            requestIds.push(response.data.request_id);

            if (queryType === 'spendingOverview') {
                finalResponse = {
                    spendingOverview: await spendingOverviewFunction(transactionsResponse),
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
            } else if (queryType === 'topMerchants') {
                finalResponse = {
                    topMerchants: await topMerchantsFunction(transactionsResponse),
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
            }
            else if (queryType === 'totalSpending') {
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
            }
            finalResponse = finalResponse;
            finalStatus = 200;
        } catch (error) {
            finalStatus = 400;
            finalResponse = error;
        };
    }

    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;