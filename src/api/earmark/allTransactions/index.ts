/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const globalVars = require('../../../lib/globalVars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const updateFirestore = require('../../../lib/firebase/firestore/');
const express = require('express');
const router = express.Router();

const API_URL = globalVars().API_URL;

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
    const nextApiUrl = '/api/earmark/allTransactions';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        await res.status(400);
        await res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE
    let finalResponse;
    let finalStatus = 400;

    if (queryType === 'datagrid') {
        let full_response;
        let dataGridTransactions = new Array;
        let transactionMetadata = new Array;
        let categoriesAvail = new Array;
        const accessTokens = await updateFirestore.getAccessTokensTransactions(user_id);
        for (let i = 0; i < accessTokens.length; i++) {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'earmark-api-key': process.env.EARMARK_API_KEY,
                    },
                    url: API_URL + "/api/plaid/transactions/get",
                    params: {
                        user_id: user_id,
                        access_token: accessTokens[i],
                        startDate: startDate,
                        endDate: endDate,
                    },
                    method: "GET"
                }
                const response = await axios(config);
                full_response = response.data;
    
                response.data.transactions.transactions.forEach((transaction:any) => {
                    categoriesAvail.push(transaction.personal_finance_category.primary);
                    dataGridTransactions.push({
                        id: transaction.transaction_id, 
                        col1: transaction.name, 
                        col2: transaction.authorized_date, 
                        col3: transaction.amount, 
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
                console.log(uniqueChars);
                finalResponse = {
                    dataGridTransactions: dataGridTransactions,
                    transactionMetadata: transactionMetadata,
                    categoriesAvail: uniqueChars,
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
                finalStatus = 400;
                finalResponse = error;
            };
        };
    } else if (queryType === 'lineChart') {
        let full_response;
        let dataGridTransactions = new Array;
        let transactionMetadata = new Array;
        let categoryList = new Array;
        let accountMetadata = new Array;
        let accounts = new Array;
        const accessTokens = await updateFirestore.getAccessTokensTransactions(user_id);
    
        for (let i = 0; i < accessTokens.length; i++) {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'earmark-api-key': process.env.EARMARK_API_KEY,
                    },
                    url: API_URL + "/api/plaid/transactions/get",
                    params: {
                        user_id: user_id,
                        access_token: accessTokens[i],
                        startDate: startDate,
                        endDate: endDate,
                    },
                    method: "GET"
                }
                const response = await axios(config);
                full_response = response.data;
                
                await full_response.transactions.accounts.forEach((account:any) => {
                    accounts.push({[account.account_id]: []});
                    categoryList.push({[account.account_id]: []});
                });
                await full_response.transactions.transactions.forEach((transaction:any) => {
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
                    await response.data.transactions.transactions.map((transaction:any) => {
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
    
                await response.data.transactions.accounts.forEach((account:any) => {
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
    
                console.log(accountMetadata);
                
                finalResponse = {
                    // accounts: accounts,
                    // transactionMetadata: accountMetadata,
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