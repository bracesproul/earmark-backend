/* eslint-disable */
/* @ts-ignore */
const express = require('express');
const router = express.Router();

import { paramErrorHandling } from '../../../../lib/Errors/paramErrorHandling'

const { 
    Configuration, 
    PlaidApi, 
    PlaidEnvironments, 
    AccountsGetRequest 
} = require("plaid");

const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.ENV],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.CLIENT_ID,
            'PLAID-SECRET': process.env.SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
});

const client = new PlaidApi(configuration);

router.get('/', async (req: any, res: any, next: any) => {

    const user_id = req.query.user_id;
    const accessToken = req.query.access_token;
    
    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id', 'accessToken'];
    const params = {
        user_id: user_id,
        accessToken: accessToken
    };
    const nextApiUrl = '/api/plaid/accounts/get';

    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        res.status(400);
        res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE

    let finalResponse;
    let finalStatus;
    let accountsGet;
    let requestId;
    /* @ts-ignore */
    const request: AccountsGetRequest = {
        access_token: accessToken,
    };
    try {
        console.log('INSIDE TRY');
        const response = await client.accountsGet(request);
        accountsGet = response.data;
        requestId = response.data.request_id;
        finalResponse = {
            accounts: accountsGet,
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                user_id: user_id,
                requestTime: new Date().toLocaleString(),
                requestIds: requestId,
                nextApiUrl: "/api/plaid/accounts/get",
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
                {id: "access_token", type: "string", description: "plaid access token"},
            ],
            metaData: {
                error: error,
                requestTime: new Date().toLocaleString(),
                nextApiUrl: "/api/plaid/accounts/get",
                required_method: "GET",
                method_used: req.method,
            }
        };
        console.log('INSIDE CATCH');
        finalStatus = 400;
    }
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});


module.exports = router;