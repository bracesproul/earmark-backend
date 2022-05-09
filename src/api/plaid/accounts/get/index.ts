/* eslint-disable */
/* @ts-ignore */
const express = require('express');
const router = express.Router();

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
    console.log("req.query: ", req.query);
    const user_id = req.query.user_id;
    const accessToken = req.query.access_token;
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
        const finalResponse = {
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
        await res.status(200);
        await res.send(finalResponse);
        await res.end();
    } catch (error) {
        console.log('INSIDE CATCH');
        res.sendStatus(error.status).send(error);
        res.end();
    }
});


module.exports = router;