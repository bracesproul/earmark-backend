/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const moment = require('moment');

import { paramErrorHandling } from '../../../../lib/Errors/paramErrorHandling'

const express = require('express');
const router = express.Router();

const { Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  AuthGetRequest 
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
  const user_id = req.query.user_id;
  const accessToken = req.query.access_token;

  // ERROR HANDLING, CHECKS FOR MISSING PARAMS
  const requiredParams = ['user_id', 'accessToken'];
  const params = {
    user_id: user_id,
    accessToken: accessToken
  };
  const nextApiUrl = '/api/plaid/auth/get';
  if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
      console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
      res.status(400);
      res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
      return;
  };
  // END ERROR HANDLING CODE
  let finalResponse;
  let finalStatus;

  let auth = new Object();
  let requestId = new String();

  /* @ts-ignore */
  const request: AuthGetRequest = {
      access_token: accessToken,
  };
  try {
      const response = await client.authGet(request);
      auth = response.data;
      requestId = response.data.request_id;
      finalResponse = {
        auth: auth,
        statusCode: 200,
        statusMessage: "Success",
        metaData: {
            user_id: user_id,
            requestTime: new Date().toLocaleString(),
            requestIds: requestId,
            nextApiUrl: "/api/plaid/auth/get",
            backendApiUrl: "/api/authGet",
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
          nextApiUrl: "/api/plaid/auth/get",
          required_method: "GET",
          method_used: req.method,
      }
  };
  console.error('INSIDE CATCH');
  finalStatus = 400;
  };
  await res.status(finalStatus);
  await res.send(finalResponse);
  await res.end();
})

module.exports = router;