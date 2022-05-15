/* eslint-disable */

const express = require('express');
const router = express.Router();

import { Configuration, PlaidApi, PlaidEnvironments, LinkTokenCreateRequest } from "plaid";

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

router.post('/', async (req: any, res: any, next: any) => {

  try {
    const response = await client.categoriesGet({});
    const categories = response.data.categories;
    res.status(200);
    res.send(categories);
    res.end();
  } catch (error) {
    const error_message = {
      stack: error.stack,
      headers: error.headers,
      statusCode: error.statusCode,
      message: "error, try again",
      /* @ts-ignore */
      required_params: [],
      metaData: {
          error: error,
          requestTime: new Date().toLocaleString(),
          nextApiUrl: "/api/plaid/transactions/categories",
          required_method: "POST",
          method_used: req.method,
      }
  };
  console.log('INSIDE CATCH');
  res.status(400);
  res.send(error_message);
  res.end();
  }
});


module.exports = router;