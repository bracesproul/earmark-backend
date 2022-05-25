/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const globalVars = require('../../../lib/globalVars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'

const express = require('express');
const router = express.Router();

import { getFirestore, 
    collection, 
    query, 
    where,
    getDocs,
} from "firebase/firestore";

const { initializeApp } = require("firebase/app");

const firebaseConfig = {
    apiKey: "AIzaSyCOnXDWQ369OM1lW0VC5FdYE19q1ug0_dc",
    authDomain: "earmark-8d1d3.firebaseapp.com",
    projectId: "earmark-8d1d3",
    storageBucket: "earmark-8d1d3.appspot.com",
    messagingSenderId: "46302537330",
    appId: "1:46302537330:web:403eac7f28d2a4868944eb",
    measurementId: "G-5474KY2MRV"
};
const transactions_get_app = initializeApp(firebaseConfig);
const db = getFirestore(transactions_get_app);
const API_URL = globalVars().API_URL;

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const institution_id = req.query.institution_id;

    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id', 'startDate', 'endDate'];
    const params = {
        user_id: user_id,
        startDate: startDate,
        endDate: endDate,
        institution_id: institution_id,
    };
    const nextApiUrl = '/api/earmark/getTransactionsByAccount';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        await res.status(400);
        await res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE

    let accessToken = new String;
    let full_response;
    let accountMetadata = new Array;

    // firebase query code
    const q = query(collection(db, "users", user_id, "access_tokens"), where("institution_id", "==", institution_id));
    await getDocs(q).then((responseDB:any) => {
        responseDB.forEach((doc:any) => {
            // doc.data() is never undefined for query doc snapshots
            accessToken = doc.data().access_token;
          });
    });

    // end firebase query code
    console.log('inside getTransactionsByAccount');
    let finalResponse;
    let finalStatus = 400;
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'earmark-api-key': process.env.EARMARK_API_KEY,
                },
                url: API_URL + "/api/plaid/transactions/get",
                params: {
                    user_id: user_id,
                    access_token: accessToken,
                    startDate: startDate,
                    endDate: endDate,
                },
                method: "GET"
            }
            const response = await axios(config);
            full_response = response.data;
            let accounts = new Array;
            
            await full_response.transactions.accounts.forEach((account:any) => {
                accounts.push({[account.account_id]: []});
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
        };
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;