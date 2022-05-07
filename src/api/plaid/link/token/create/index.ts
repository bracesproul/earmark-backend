/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();
const express = require('express');
const router = express.Router();

import { Configuration, PlaidApi, PlaidEnvironments, LinkTokenCreateRequest } from "plaid";

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

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

router.post('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;

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
        res.status(200).send(linkToken);
    } catch (error) {
        res.status(400).send(error)
    }
});


module.exports = router;