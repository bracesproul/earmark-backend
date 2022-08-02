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

router.get('/', async (req:any, res:any, next:any) => {
  const institutionID = req.query.institutionID;
  const requestedProducts = req.query.requestedProducts;
  let requestIds = new String();
  let requestedInstitutions = new Array();
  let finalResponse;
  let finalStatus;

    /* @ts-ignore */
    const request: InstitutionsSearchRequest = {
        query: institutionID,
        products: requestedProducts,
        country_codes: ['US'],
      };
    try {
        const response = await client.institutionsSearch(request);
        requestedInstitutions.push(response.data.institutions);
        requestIds = response.request_id;
        finalResponse = {
          institutions: requestedInstitutions,
          statusCode: 200,
          statusMessage: "Success",
          metaData: {
              requestTime: new Date().toLocaleString(),
              requestIds: requestIds,
              nextApiUrl: "/api/plaid/institutions/search",
              backendApiUrl: "/api/institutionsSearch",
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
          {id: "requestedProducts", type: "array", description: "products to search for"},
        ],
        metaData: {
            error: error,
            requestTime: new Date().toLocaleString(),
            nextApiUrl: "/api/plaid/institutions/search",
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
})
//src\api\plaid\
module.exports = router;