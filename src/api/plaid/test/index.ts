/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

const masterPlaidApiRouteList = [
    {
        for: 'home', method: 'GET', route: '/'
    },
    {
        for: 'create a plaid link token', method: 'POST', route: '/api/plaid/link/token/create'
    },
    {
        for: 'exchange public token for access token', method: 'POST', route: '/api/plaid/item/public_token/exchange'
    },
    {
        for: 'get transaction list for all a users accounts', method: 'GET', route: '/api/plaid/transactions/get'
    },
    {
        for: 'get all transaction categories', method: 'GET', route: '/api/plaid/transactions/categories/get'
    },
    {
        for: 'get all accounts linked to a user id', method: 'GET', route: '/api/plaid/accounts/get'
    },
    {
        for: 'get auth info from access_token', method: 'GET', route: '/api/plaid/auth/get'
    },
    {
        for: 'get user identity from banks', method: 'GET', route: '/api/plaid/identity/get'
    },
    {
        for: 'get account balance data', method: 'GET', route: '/api/plaid/balance/get'
    },
    {
        for: '***BROKEN***', method: 'GET', route: '/api/plaid/investments/holdings/get'
    },
    {
        for: '***BROKEN***', method: 'GET', route: '/api/plaid/liabilities/get'
    },
    {
        for: 'get list of supported institutions', method: 'GET', route: '/api/plaid/institutions/get'
    },
    {
        for: 'get institution info from id', method: 'GET', route: '/api/plaid/institutions/get_by_id'
    },
    {
        for: '***BROKEN***', method: 'GET', route: '/api/plaid/institutions/search'
    },
    {
        for: 'get data from an item_id', method: 'GET', route: '/api/plaid/item/get'
    },
];

const masterEarmarkApiRouteList = [
    {
        for: 'get linked accounts info', method: 'GET', route: '/api/earmark/accountInfo'
    },
    {
        for: 'get all transactions from all access_tokens associated with a users account', method: 'GET', route: '/api/earmark/allTransactions'
    },
    {
        for: 'get account balance data', method: 'GET', route: '/api/earmark/balance'
    },
    {
        for: 'exchange public_token for access_token, update firebase with info from access_token', method: 'POST', route: '/api/earmark/public_token/exchange'
    },
];

router.get('/', async (req: any, res: any, next: any) => {
    try {
        res.status(200);
        res.json({
            message: 'welcome to the earmark api',
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                masterPlaidApiRouteList: masterPlaidApiRouteList,
                masterEarmarkApiRouteList: masterEarmarkApiRouteList,
                requestTime: new Date().toLocaleString(),
                nextApiUrl: "/",
                backendApiUrl: null,
                method: "GET",
            },
        });
    } catch (error) {
        res.status(400);
        res.send(error);
        res.end();
    }
});


module.exports = router;