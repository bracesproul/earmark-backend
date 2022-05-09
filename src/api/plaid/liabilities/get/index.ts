/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const moment = require('moment');

const express = require('express');
const router = express.Router();

const { Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  LiabilitiesGetRequest 
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

// TODO: Make a call to institutions/search with the ids of institutions the client 
// has access tokens for.
//
// Use the response to get the institutions' ids to then filter for access tokens 
// where institution_id<in firebase> === institution_id<returned>.

router.get('/', async (req:any, res:any, next:any) => {
  const user_id = req.query.user_id;
  const accessToken = req.query.access_token;

  let liabilities = new Object();
  let requestId = new String();

  /* @ts-ignore */
  const request: LiabilitiesGetRequest = {
      access_token: accessToken,
  };
  try {
    const response = await client.liabilitiesGet(request);
    liabilities = response.data;
    requestId = response.data.request_id;

    const finalResponse = {
      liabilities: liabilities,
      statusCode: 200,
      statusMessage: "Success",
      metaData: {
          user_id: user_id,
          requestTime: new Date().toLocaleString(),
          requestIds: requestId,
          nextApiUrl: "/api/plaid/liabilities/get",
          backendApiUrl: "/api/liabilitiesGet",
          method: "GET",
      },
    };
    await res.status(200);
    await res.send(finalResponse);
    await res.end();
  } catch (error) {
      console.log(error)
      res.status(400).send(error);
      res.end();
  }

})

module.exports = router;