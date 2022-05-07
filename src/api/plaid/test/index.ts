/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

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

router.get('/', async (req: any, res: any, next: any) => {

    const user_id = req.query.user_id;

    console.log("REQUEST", req.query)

    try {

        res.status(200).json({
          message: "successful request",
          user_id: user_id
        })
    } catch (error) {
        res.status(400).send(error)
    }
});


module.exports = router;