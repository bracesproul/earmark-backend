/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

import { paramErrorHandling } from '../../../../lib/Errors/paramErrorHandling'

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
  const institutionID = req.query.institutionID;
  // ERROR HANDLING, CHECKS FOR MISSING PARAMS
  const requiredParams = ['institutionID'];
  const params = {
    institutionID: institutionID,
  };
  const nextApiUrl = '/api/plaid/institutions/get_by_id';
  if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
      console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
      res.status(400);
      res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
      return;
  };
  // END ERROR HANDLING CODE
  let requestIds = new String();
  let requestedInstitution = new Object();
  let finalResponse;
  let finalStatus;

    /* @ts-ignore */
    const request: InstitutionsGetByIdRequest = {
        institution_id: institutionID,
        country_codes: ['US'],
    };
    try {
        const response = await client.institutionsGetById(request);
        requestedInstitution = response.data.institution;
        requestIds = response.request_id;
        finalResponse = {
          institution: requestedInstitution,
          statusCode: 200,
          statusMessage: "Success",
          metaData: {
              requestTime: new Date().toLocaleString(),
              requestIds: requestIds,
              nextApiUrl: "/api/plaid/institutions/get_by_id",
              backendApiUrl: "/api/institutionsGetById",
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
          {id: "institutionID", type: "string", description: "institution ID to search for"},
        ],
        metaData: {
            error: error,
            requestTime: new Date().toLocaleString(),
            nextApiUrl: "/api/plaid/institution/get_by_id",
            required_method: "GET",
            method_used: req.method,
        }
    };
    finalStatus = 400;
    console.error('INSIDE CATCH');
    }
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
})
//src\api\plaid\
module.exports = router;