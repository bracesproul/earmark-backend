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
    res.status(200).send(categories);
  } catch (error) {
    res.status(error.status).send(error)
  }
});


module.exports = router;