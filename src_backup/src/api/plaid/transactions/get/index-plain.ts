/* eslint-disable */
import dotenv from 'dotenv';
const fs = require('fs');
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

router.get('/', async (req:any, res:any, next:any) => {
  const access_token = req.query.access_token;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate
  let finalResponse;
  let finalStatus;



  try {
    /* @ts-ignore */
    const request: TransactionsGetRequest = {
      access_token: access_token,
      start_date: startDate,
      end_date: endDate,
      options: {
        include_personal_finance_category: true
      }
    };
    const { data } = await client.transactionsGet(request);
    finalResponse = { transactions: data };
    finalStatus = 200;
  } catch (error) {
    finalResponse = {
      stack: error.stack,
      headers: error.headers,
      statusCode: error.statusCode,
      message: "error, try again",
      required_params: [
        {id: "startDate", type: "string", description: "start date of transactions"},
        {id: "endDate", type: "string", description: "end date of transactions"},
        {id: "user_id", type: "string", description: "users unique id"},
        {id: "access_token", type: "string", description: "plaid access token"},
      ],
      metaData: {
          error: error,
          requestTime: new Date().toLocaleString(),
          nextApiUrl: "/api/plaid/transactions/get",
          required_method: "GET",
          method_used: req.method,
      }
  };
  console.error('INSIDE CATCH');
  finalStatus = 400;
  }
  await res.status(finalStatus);
  await res.send(finalResponse);
  await res.end();
});

module.exports = router;