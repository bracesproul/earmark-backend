/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const parseNumbers = require('../../../lib/parseNumbers');
const globalVars = require('../../../lib/globalVars');
const { getAccessTokensInstitution } = require('../../../lib/firebase/firestore');
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
    console.log('running')
    const user_id = req.query.user_id;
    const page_id = req.query.page_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    let finalResponse;
    let finalStatus;
    try {
        let accounts: any = new Array();
        const firebaseResponse = await getAccessTokensInstitution(user_id, page_id);
        firebaseResponse[0].accountInfo.account_data.forEach((account: any) => {
            const accObj: any = {
                account: {
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
            access_token: firebaseResponse[0].accessToken,
            start_date: startDate,
            end_date: endDate,
            options: {
                include_personal_finance_category: true,
            },
        };

        const { data } = await client.transactionsGet(request);

        data.transactions.forEach((transaction: any) => {
            accounts.forEach((account: any) => {
                let name = transaction.merchant_name;
                let amount;
                let fontWeight = 'normal';
                if (Math.sign(transaction.amount) === -1) {
                    amount = parseNumbers(transaction.amount);
                    amount = `-$${amount.split('-')[1]}`;
                    fontWeight = 'bold';
                } else amount = `$${parseNumbers(transaction.amount)}`;
                const category = makeFirstLetterUpperCase(transaction.personal_finance_category.primary);
                if (!transaction.merchant_name) name = transaction.name;
                if (account.account.account_id === transaction.account_id) {
                    account.account.transactions.push({
                        id: transaction.transaction_id,
                        col1: name,
                        col2: transaction.date,
                        col3: amount,
                        col4: category,
                        fontWeight: fontWeight,
                    });
                }
            });
        });

        finalResponse = accounts;
        finalStatus = 200;
    } catch (error) {
        console.error(error);
        finalStatus = 400;
        finalResponse = error;
    };
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;