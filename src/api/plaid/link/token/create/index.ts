/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

import { paramErrorHandling } from '../../../../../lib/Errors/paramErrorHandling'

const express = require('express');
const router = express.Router();

import { Configuration, PlaidApi, PlaidEnvironments, LinkTokenCreateRequest } from "plaid";
console.log(process.env);
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

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

router.post('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    
    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id'];
    const params = {
        user_id: user_id,
    };
    const nextApiUrl = '/api/plaid/link/token/create';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        res.status(400);
        res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE

    let finalResponse;
    let finalStatus;
    try {
        const request: LinkTokenCreateRequest = {
            user: {
                client_user_id: user_id
            },
            client_name: 'Earmark Testing',
            /* @ts-ignore */
            products: PLAID_PRODUCTS,
            /* @ts-ignore */
            country_codes: PLAID_COUNTRY_CODES,
            language: 'en',
        };
        const response = await client.linkTokenCreate(request);
        const linkToken = response.data.link_token;
        finalResponse = linkToken;
        finalStatus = response.status;
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
                nextApiUrl: "/api/plaid/link/token/create",
                required_method: "POST",
                method_used: req.method,
            }
        };
        finalStatus = 400;
        console.error(error);
    }
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});


module.exports = router;