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
  const count = parseInt(req.query.count, 10);
  const offset = parseInt(req.query.offset, 10);
  let finalResponse;
  let finalStatus;

  const institutionsArr = new Array();
  let requestIds = new String();
  let totalInstitutions = new Number();
    /* @ts-ignore */
    const request: InstitutionsGetRequest = {
        count: count,
        offset: offset,
        country_codes: ['US'],
        options: {
          include_optional_metadata: true
        }
    };
    try {
        const response = await client.institutionsGet(request);
        institutionsArr.push(response.data.institutions);
        requestIds = response.request_id;
        totalInstitutions = response.data.total;
        finalResponse = {
          institutions: institutionsArr,
          statusCode: 200,
          statusMessage: "Success",
          metaData: {
              totalInstitutions: totalInstitutions,
              count: count,
              offset: offset,
              requestTime: new Date().toLocaleString(),
              requestIds: requestIds,
              nextApiUrl: "/api/plaid/institutions/get",
              backendApiUrl: "/api/institutionsGet",
              method: "GET",
          },
      };
    } catch (error) {
      finalResponse = {
        stack: error.stack,
        headers: error.headers,
        statusCode: error.statusCode,
        message: "error, try again",
        required_params: [
          {id: "count", type: "int", description: "number of institutions to return"},
          {id: "offset", type: "int", description: "offset to return"},
        ],
        metaData: {
            error: error,
            requestTime: new Date().toLocaleString(),
            nextApiUrl: "/api/plaid/institutions/get",
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