/* eslint-disable */
/* @ts-ignore */
const express = require('express');
const router = express.Router();
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const globalVars = require('../../../lib/globalVars');
const updateFirestore = require('../../../lib/firebase/firestore/index');
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

router.get('/', async (req: any, res: any) => {
    const user_id = req.query.user_id;
    
    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id'];
    const params = {
        user_id: user_id,
    };
    const nextApiUrl = '/api/earmark/allAccountInfo';

    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        res.status(400);
        res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE

    let finalResponse;
    let finalStatus;
    let requestId;
    // let accessTokens = new Array();

    // firebase query code
    const accessTokens = await updateFirestore.getAccessTokens(user_id);
    // end firebase query code

    for (let i = 0; i < accessTokens.length; i++) {
        /* @ts-ignore */
        const request: AccountsGetRequest = {
            access_token: accessTokens[i],
        };
        try {
            const response = await client.accountsGet(request);
            const accounts = response.data.accounts;
            const item = response.data.item
            requestId = response.data.request_id;
            finalResponse = {
                accounts: accounts,
                item: item,
                statusCode: 200,
                statusMessage: "Success",
                metaData: {
                    user_id: user_id,
                    requestTime: new Date().toLocaleString(),
                    requestIds: requestId,
                    nextApiUrl: "/api/earmark/allAccountInfo",
                    backendApiUrl: "/api/accountsGet",
                    method: "GET",
                },
            };
            finalStatus = 200;
        } catch (error) {
            finalResponse = {
                stack: error.stack,
                headers: error.headers,
                statusCode: error.statusCode,
                message: "error, try again",
                required_params: [
                    {id: "user_id", type: "string", description: "users unique id"},
                ],
                metaData: {
                    error: error,
                    requestTime: new Date().toLocaleString(),
                    nextApiUrl: "/api/earmark/allAccountInfo",
                    required_method: "GET",
                    method_used: req.method,
                }
            };
            console.log('INSIDE CATCH');
            finalStatus = 400;
        }
    };
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;