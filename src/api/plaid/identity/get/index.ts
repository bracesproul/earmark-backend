/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

const { Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  IdentityGetRequest 
} = require('plaid');

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

router.get('/', async (req:any, res:any, next:any) => {
    const user_id = req.query.user_id;
    const accessToken = req.query.access_token;

    let identity = new Object();
    let requestId = new String();

    /* @ts-ignore */
    const request: IdentityGetRequest = {
        access_token: accessToken,
    };
    try {
        const response = await client.identityGet(request);
        identity = response.data;
        requestId = response.data.request_id;
        const finalResponse = {
            identity: identity,
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                user_id: user_id,
                requestTime: new Date().toLocaleString(),
                requestIds: requestId,
                nextApiUrl: "/api/plaid/identity/get",
                backendApiUrl: "/api/identityGet",
                method: "GET",
            },
        };
        await res.status(200);
        await res.send(finalResponse);
        await res.end();
    } catch (error) {
        await res.status(400);
        await res.send(error);
        await res.end();
    };
});

module.exports = router;