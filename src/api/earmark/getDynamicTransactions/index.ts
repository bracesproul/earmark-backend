/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const parseNumbers = require('../../../lib/parseNumbers');
const globalVars = require('../../../lib/globalVars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
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

const makeFirstLetterUpperCase = (string: String) => {
    string = string.split('_').join(' ');
    string = string.toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
    return string;
}

const client = new PlaidApi(configuration);

const API_URL = globalVars().API_URL;

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const page_id = req.query.page_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id', 'page_id'];
    const params = {
        user_id: user_id,
        page_id: page_id,
    };
    const nextApiUrl = '/api/earmark/getDynamicTransactions';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        await res.status(400);
        await res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };

    // END ERROR HANDLING CODE
    let finalResponse;
    let finalStatus = 400;
    try {
        console.log('inside getdynamictransactions');

        /*
        const columns = [
  { field: 'col1', headerName: 'Name', width: 150 },
  { field: 'col2', headerName: 'Date', width: 150 },
  { field: 'col3', headerName: 'Amount', width: 150 },
  { field: 'col4', headerName: 'Category', width: 150 },
];
        */
        let accounts: any = new Array();

        const firebaseResponse = await updateFirestore.getDynamicTransactions(user_id, page_id);
        firebaseResponse.accountInfo.account_data.forEach((account: any) => {
            const accObj: any = {account: {
                account_id: account.account_id,
                account_name: account.name,
                subtype: account.subtype,
                institution_name: account.institution_name,
                transactions: [],
            }
            }
            accounts.push(accObj);
        });
        // @ts-ignore
        const request: TransactionsGetRequest = {
            access_token: firebaseResponse.accessTokens,
            start_date: startDate,
            end_date: endDate,
            options: {
                include_personal_finance_category: true,
            },
        };

        console.log(accounts);

        const { data } = await client.transactionsGet(request);
        data.transactions.forEach((transaction: any) => {
            accounts.forEach((account: any) => {
                let name = transaction.merchant_name;
                const category = makeFirstLetterUpperCase(transaction.personal_finance_category.primary);
                if (!transaction.merchant_name) name = transaction.name;
                if (account.account.account_id === transaction.account_id) {
                    account.account.transactions.push({
                        id: transaction.transaction_id,
                        col1: name,
                        col2: transaction.date,
                        col3: parseNumbers(transaction.amount),
                        col4: category,
                    });
                }
            });
        });

        finalResponse = accounts;
        finalStatus = 200;
    } catch (error) {
        finalStatus = 400;
        finalResponse = error;
    };
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;