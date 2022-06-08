/* eslint-disable */
const express_server = require('express');
const app = express_server();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const validateApiKey = require('../middlewear/validateApiKey');

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 8080;
const URL = process.env.URL || 'http://localhost:';
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

// add plaid api routes
const test = require('./plaid/test');
const link_token_create = require('./plaid/link/token/create');
const exchange_public_token = require('./plaid/item/public_token/exchange');
const transactions_get = require('./plaid/transactions/get');
const categories_get = require('./plaid/transactions/categories');
const accounts_get = require('./plaid/accounts/get');
const auth_get = require('./plaid/auth/get');
const identity_get = require('./plaid/identity/get');
const balance_get = require('./plaid/balance/get');
const investments_holdings_get = require('./plaid/investments/holdings/get');
const liabilities_get = require('./plaid/liabilities/get');
const institutions_get = require('./plaid/institutions/get');
const institutions_get_by_id = require('./plaid/institutions/get_by_id');
const institutions_search = require('./plaid/institutions/search');
const item_get = require('./plaid/item/get');

app.use('/', test);
app.use('/api/plaid/link/token/create', validateApiKey, link_token_create);
app.use('/api/plaid/item/public_token/exchange', validateApiKey, exchange_public_token);
app.use('/api/plaid/transactions/get', validateApiKey, transactions_get);
app.use('/api/plaid/transactions/categories', validateApiKey, categories_get);
app.use('/api/plaid/accounts/get', validateApiKey, accounts_get);
app.use('/api/plaid/auth/get', validateApiKey, auth_get);
app.use('/api/plaid/identity/get', validateApiKey, identity_get);
app.use('/api/plaid/balance/get', validateApiKey, balance_get);
// TODO: ADD LOGIC, NOT WORKING
app.use('/api/plaid/investments/holdings/get', validateApiKey, investments_holdings_get);
// TODO: ADD LOGIC, NOT WORKING
app.use('/api/plaid/liabilities/get', validateApiKey, liabilities_get);
app.use('/api/plaid/institutions/get', validateApiKey, institutions_get);
app.use('/api/plaid/institutions/get_by_id', validateApiKey, institutions_get_by_id);
// TODO: FIX, BROKEN, UNSURE WHY
app.use('/api/plaid/institutions/search', validateApiKey, institutions_search);
app.use('/api/plaid/item/get', validateApiKey, item_get);

// all earmark api routes
//src\api\earmark\dashboard
const earmark_allAccountInfo = require('./earmark/allAccountInfo');
const earmark_allTransactions = require('./earmark/allTransactions');
const earmark_balance = require('./earmark/balance');
const earmarkPublic_tokenExchange = require('./earmark/public_token/exchange');
const getTransactionsByAccount = require('./earmark/getTransactionsByAccount')
const allTransactionsByCategory = require('./earmark/allTransactionsByCategory');
const recurring = require('./earmark/recurring');
const earmark_dashboard = require('./earmark/dashboard');
const earmark_visuals = require('./earmark/visuals');
const earmark_getDynamicTransactions = require('./earmark/getDynamicTransactions');

app.use('/api/earmark/allAccountInfo', validateApiKey, earmark_allAccountInfo);
app.use('/api/earmark/allTransactions', validateApiKey, earmark_allTransactions);
app.use('/api/earmark/balance', validateApiKey, earmark_balance);
app.use('/api/earmark/public_token/exchange', validateApiKey, earmarkPublic_tokenExchange);
app.use('/api/earmark/getTransactionsByAccount', validateApiKey, getTransactionsByAccount);
app.use('/api/earmark/allTransactionsByCategory', validateApiKey, allTransactionsByCategory);
app.use('/api/earmark/recurring', validateApiKey, recurring);
app.use('/api/earmark/dashboard', validateApiKey, earmark_dashboard);
app.use('/api/earmark/visuals', validateApiKey, earmark_visuals);
app.use('/api/earmark/getDynamicTransactions', validateApiKey, earmark_getDynamicTransactions);
// firebase routes
const firestore = require('./firebase/firestore');

app.use('/api/firebase/firestore', validateApiKey, firestore);

// test routes
//src\api\testRoutes
const test_route = require('./testRoutes');
app.use('/api/testRoutes', test_route);

// Config so api doesn't return 500 when requesting favicon.ico
app.get('/favicon.ico', (req:any, res:any) => {
    res.status(204);
    res.end();
});


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// app.use(validateApiKey());

app.use((req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    };
    next();
});

app.use((req: any, res: any, next: any) => {
  const error = new Error("Not found");
    next(error);
});

app.use((error: any, req: any, res: any, next: any) => {
  res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        },
        masterPlaidApiRouteList: masterPlaidApiRouteList,
        masterEarmarkApiRouteList: masterEarmarkApiRouteList
    });
});

app.listen(PORT, () => console.log(`server started at ${URL}${PORT}`));
