/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

const masterApiRouteList = [
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
    
]

router.get('/', async (req: any, res: any, next: any) => {
    try {
        res.status(200);
        res.json({
            message: 'welcome to the earmark api',
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                masterApiRouteList: masterApiRouteList,
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