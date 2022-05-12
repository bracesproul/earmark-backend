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

const { collection, 
  query, 
  getDocs, 
  getFirestore, 
  where 
} = require("firebase/firestore"); 

const { initializeApp } = require("firebase/app");

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

const firebaseConfig = {
  apiKey: "AIzaSyCOnXDWQ369OM1lW0VC5FdYE19q1ug0_dc",
  authDomain: "earmark-8d1d3.firebaseapp.com",
  projectId: "earmark-8d1d3",
  storageBucket: "earmark-8d1d3.appspot.com",
  messagingSenderId: "46302537330",
  appId: "1:46302537330:web:403eac7f28d2a4868944eb",
  measurementId: "G-5474KY2MRV"
};
const transactions_get_app = initializeApp(firebaseConfig);
const db = getFirestore(transactions_get_app);

router.get('/', async (req:any, res:any, next:any) => {
  const user_id = req.query.user_id;
  const accessToken = req.query.access_token;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate
  
  let transactionsGet;
  let requestId = new String();
  let totalTxns = new Number();

  /* @ts-ignore */
  const request: TransactionsGetRequest = {
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  };

  try {
  const response = await client.transactionsGet(request);
  transactionsGet = response.data;
  response.data.transactions.map((txns:any) => {
    totalTxns += txns.length;
  })
  requestId = response.data.request_id;
  const finalResponse = {
    transactions: transactionsGet,
    statusCode: 200,
    statusMessage: "Success",
    metaData: {
        totalTransactions: totalTxns,
        user_id: user_id,
        requestTime: new Date().toLocaleString(),
        requestIds: requestId,
        nextApiUrl: "/api/plaid/transactions/get",
        backendApiUrl: "/api/transactionsGet",
        method: "GET",
    },
  };
  await res.status(200);
  await res.send(finalResponse);
  await res.end();

  } catch (error) {
    const error_message = {
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
          nextApiUrl: "/api/plaid/accounts/get",
          required_method: "GET",
          method_used: req.method,
      }
  };
  console.log('INSIDE CATCH');
  res.statusCode(error.status);
  res.send(error_message);
  res.end();
  };
  
});

module.exports = router;