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
  const institutionID = req.query.institutionID;

  let requestIds = new String();
  let requestedInstitution = new Object();

    /* @ts-ignore */
    const request: InstitutionsGetByIdRequest = {
        institution_id: institutionID,
        country_codes: ['US'],
    };
    try {
        const response = await client.institutionsGetById(request);
        requestedInstitution = response.data.institution;
        requestIds = response.request_id;
    } catch (error) {
      const error_message = {
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
    console.log('INSIDE CATCH');
    res.status(400);
    res.send(error_message);
    res.end();
    }
    const finalResponse = {
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
    await res.status(200);
    await res.send(finalResponse);
    await res.end();
})
//src\api\plaid\
module.exports = router;