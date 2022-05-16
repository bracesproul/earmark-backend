/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

import { paramErrorHandling } from '../../../../../lib/Errors/paramErrorHandling';

const express = require('express');
const router = express.Router();
const axios = require('axios');

const { Configuration, PlaidApi, PlaidEnvironments, ItemPublicTokenExchangeRequest } = require("plaid");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");


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

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

const firebaseConfig = {
  apiKey: "AIzaSyCOnXDWQ369OM1lW0VC5FdYE19q1ug0_dc",
  authDomain: "earmark-8d1d3.firebaseapp.com",
  projectId: "earmark-8d1d3",
  storageBucket: "earmark-8d1d3.appspot.com",
  messagingSenderId: "46302537330",
  appId: "1:46302537330:web:403eac7f28d2a4868944eb",
  measurementId: "G-5474KY2MRV"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);


router.post('/', async (req: any, res: any, next: any) => {
  const publicToken = req.query.publicToken;
  const userId = req.query.user_id;
  
  // ERROR HANDLING, CHECKS FOR MISSING PARAMS
  const requiredParams = ['publicToken', 'user_id'];
  const params = {
    publicToken: publicToken,
    user_id: userId
  };
  const nextApiUrl = '/api/plaid/item/public_token/exchange';
  if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
      console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
      res.status(400);
      res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
      return;
  };
  // END ERROR HANDLING CODE

  let finalResponse;
  let finalStatus;

    /* @ts-ignore */
  const request: ItemPublicTokenExchangeRequest = {
    public_token: publicToken,
  };

  try {
    console.log('exchange token called');
    const response = await client.itemPublicTokenExchange(request);
    const accessToken = response.data.access_token;
    console.log(response.data);
    const itemId = response.data.item_id;
    
    await updateFirestore(userId, accessToken, itemId)
    .then(() => {
      console.log('updated firestore - api/plaid/item/public_token/exchange');
    })
    .catch((error:any) => {
      console.error("Error writing document - api/plaid/item/public_token/exchange");
      console.error("Error writing document: ", error);
      finalStatus = 400;
      finalResponse = {
          error: error,
          message: "Error writing document - api/plaid/item/public_token/exchange"
      };
    })

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: "GET",
      url: `http://localhost:5000/api/plaid/item/public_token/exchange`,
      params: {
        userId: userId,
        accessToken: accessToken,
        itemId: itemId,
      }
    }
    const axiosResponse = await axios(config);
    console.log(axiosResponse.data);
    finalResponse = "Successfully generated access token"

  } catch (error) {
    finalResponse = {
      stack: error.stack,
      headers: error.headers,
      statusCode: error.statusCode,
      message: "error, try again",
      required_params: [
        {id: "user_id", type: "string", description: "users unique id"},
        {id: "publicToken", type: "string", description: "plaid public token"},
      ],
      metaData: {
          error: error,
          requestTime: new Date().toLocaleString(),
          nextApiUrl: "/api/plaid/item/public_token/exchange",
          required_method: "POST",
          method_used: req.method,
      }
    };
    finalStatus = 400;
    console.log('INSIDE CATCH');
  }

  await res.status(finalStatus);
  await res.send(finalResponse);
  await res.end();

});

const updateFirestore = async (user_id: string, access_token: string, item_id: string) => {
  let docRef;
  if (user_id && item_id) {
      docRef = doc(db, "users", user_id, "access_tokens", item_id);
  } else if (user_id && !item_id) {
      console.error("Error: item_id is required, user_id provided");
  } else if (!user_id && item_id) {
      console.error('user_id is required, item_id provided');
  } else {
      console.error("Error: No user_id or item_id provided");
  }
  const docData = {
    access_token: access_token,
    item_id: item_id,
    user_id: user_id,
  }
  await setDoc(docRef, docData)
  .then(() => {
      console.log("Document successfully written! - api/plaid/public_token/exchange");
  })
  .catch((error:any) => {
      console.error("Error writing document - api/plaid/public_token/exchange");
      console.error("Error writing document: ", error);
  })
  console.log("updated firestore");
}

module.exports = router;