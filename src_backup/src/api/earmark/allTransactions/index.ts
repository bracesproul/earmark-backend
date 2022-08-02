/* eslint-disable */
export {};
const fs = require('fs');
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const globalVars = require('../../../lib/globalVars');
const updateFirestore = require('../../../lib/firebase/firestore/');
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

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const queryType = req.query.queryType;
    const test = req.query.test;
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

                data.transactions.forEach((transaction:any) => {
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
        let categoryList = new Array;
        let accountMetadata = new Array;
        let accounts = new Array;
        const accessTokens = await updateFirestore.getAccessTokensTransactions(user_id);
    
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