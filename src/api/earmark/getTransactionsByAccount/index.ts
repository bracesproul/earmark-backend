/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const globalVars = require('../../../lib/globalVars');
const { getAccessTokensTransactions } = require('../../../lib/firebase/firestore');
const express = require('express');
const router = express.Router();

const { Configuration,
    PlaidApi,
    PlaidEnvironments,
    TransactionsGetRequest
} = require('plaid');

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
    let full_response;
    let accountMetadata = new Array;
    const accessToken = await getAccessTokensTransactions(user_id);

    let finalResponse;
    let finalStatus = 400;
    for (let i = 0; i < accessToken.length; i++) {
        try {
            // @ts-ignore
            const request: TransactionsGetRequest = {
                access_token: accessToken[i],
                start_date: startDate,
                end_date: endDate,
                options: {
                    include_personal_finance_category: true
                }
            };
            const { data } = await client.transactionsGet(request);
            let accounts = new Array;

            data.accounts.forEach((account:any, index:number) => {
                accounts.push({[account.account_id]: []});
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
        }
    }

    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;