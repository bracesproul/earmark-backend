/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();
const moment = require('moment');
const express = require('express');
const router = express.Router();

const { Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  TransactionsGetRequest 
} = require('plaid');

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

// TODO: Make a call to institutions/search with the ids of institutions the client 
// has access tokens for.
//
// Use the response to get the institutions' ids to then filter for access tokens 
// where institution_id<in firebase> === institution_id<returned>.

router.get('/', async (req:any, res:any, next:any) => {
  const user_id = req.query.user_id;
  const access_token = req.query.access_token;
  let investmentsGet = new Object();
  let requestId = new String();
  let finalResponse;
  let finalStatus;

  /* @ts-ignore */
  const request: InvestmentsHoldingsGetRequest = {
      access_token: access_token,
  };
  try {
    const response = await client.investmentsHoldingsGet(request);
    investmentsGet = response.data;
    requestId = response.data.request_id;
    finalResponse = {
      investments: investmentsGet,
      statusCode: 200,
      statusMessage: "Success",
      metaData: {
          user_id: user_id,
          requestTime: new Date().toLocaleString(),
          requestIds: requestId,
          nextApiUrl: "/api/plaid/investments/holdings/get",
          backendApiUrl: "/api/investmentsHoldingsGet",
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
          nextApiUrl: "/api/plaid/investments/holdings/get",
          required_method: "GET",
          method_used: req.method,
      }
    };
  finalStatus = 400;
  console.error('INSIDE CATCH');
  };
  await res.status(finalStatus);
  await res.send(finalResponse);
  await res.end();
});

module.exports = router;