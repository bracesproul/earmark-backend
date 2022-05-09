/* eslint-disable */
const express_server = require('express');
const app = express_server();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;



// add routes
const test = require('./test');
const link_token_create = require('./link/token/create');
const exchange_public_token = require('./item/public_token/exchange');
const transactions_get = require('./transactions/get');
const categories_get = require('./transactions/categories');
const accounts_get = require('./accounts/get');
const auth_get = require('./auth/get');
const identity_get = require('./identity/get');
const balance_get = require('./balance/get');
const investments_holdings_get = require('./investments/holdings/get');
const liabilities_get = require('./liabilities/get');
const institutions_get = require('./institutions/get');
const institutions_get_by_id = require('./institutions/get_by_id');
const institutions_search = require('./institutions/search');

app.use('/', test);
app.use('/api/plaid/link/token/create', link_token_create);
app.use('/api/plaid/item/public_token/exchange', exchange_public_token);
app.use('/api/plaid/transactions/get', transactions_get);
app.use('/api/plaid/transactions/categories/get', categories_get);
app.use('/api/plaid/accounts/get', accounts_get);
app.use('/api/plaid/auth/get', auth_get);
app.use('/api/plaid/identity/get', identity_get);
app.use('/api/plaid/balance/get', balance_get);
// TODO: ADD LOGIC, NOT WORKING
app.use('/api/plaid/investments/holdings/get', investments_holdings_get);
// TODO: ADD LOGIC, NOT WORKING
app.use('/api/plaid/liabilities/get', liabilities_get);
app.use('/api/plaid/institutions/get', institutions_get);
app.use('/api/plaid/institutions/get_by_id', institutions_get_by_id);
// TODO: FIX, BROKEN, UNSURE WHY
app.use('/api/plaid/institutions/search', institutions_search);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

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
        }
    });
});

app.listen(PORT, () => console.log(`server started at localhost:${PORT}`));