/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

import { paramErrorHandling } from '../../../../lib/Errors/paramErrorHandling';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const updateFirestoreE = require('../../../../lib/firebase/firestore');
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
  let institution_id;
  let available_products;
  let account_data = new Array;
  let account_types = new Array;
  let account_ids = new Array;

    /* @ts-ignore */
  const request: ItemPublicTokenExchangeRequest = {
    public_token: publicToken,
  };

  try {
    const response = await client.itemPublicTokenExchange(request);
    const accessToken = response.data.access_token;
    /* @ts-ignore */
    const itemGetRequest: ItemGetRequest = {
      access_token: accessToken,
    };
    /* @ts-ignore */
    const authRequest: AuthGetRequest = {
      access_token: accessToken,
    };

    const itemGetResponse = await client.itemGet(itemGetRequest);
    const authResponse = await client.authGet(authRequest);
    institution_id = itemGetResponse.data.item.institution_id;
    // @ts-ignore
    const insRequest: InstitutionsGetByIdRequest = {
      institution_id: institution_id,
      country_codes: ['US'],
    };
    const insResponse = await client.institutionsGetById(insRequest);
    const institution_name = insResponse.data.institution.name;
    authResponse.data.accounts.forEach((account: any) => {
      account_data.push({
        subtype: account.subtype,
        name: account.name,
        account_id: account.account_id,
        institution_name: institution_name,
      });
      account_types.push(account.subtype);
      account_ids.push(account.account_id);
    });
    available_products = itemGetResponse.data.item.available_products;
    itemGetResponse.data.item.billed_products.forEach((product:any) => {
      available_products.push(product);
    });

    const itemId = response.data.item_id;
    const params = {
      user_id: userId,
      access_token: accessToken,
      item_id: itemId,
      institution_id: institution_id,
      available_products: available_products,
      account_data: account_data,
      account_types: account_types,
      account_ids: account_ids,
      institution_name: institution_name,
    }

    await updateFirestoreE.addAccessTokens(userId, params);

    finalResponse = "Successfully generated access token";
    finalStatus = 200;
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
          nextApiUrl: "/api/earmark/public_token/exchange",
          required_method: "POST",
          method_used: req.method,
      }
    };
    finalStatus = 400;
    console.error('INSIDE CATCH ptoken exchange');
    console.error(error);
  }

  await res.status(finalStatus);
  await res.send(finalResponse);
  await res.end();

});

const updateFirestore = async (user_id: string, access_token: string, item_id: string, institution_Id: string, available_products: any) => {
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
    institution_id: institution_Id,
    available_products: available_products,
  }
  await setDoc(docRef, docData)
  .then(() => {
      console.log("Document successfully written! - /api/earmark/public_token/exchange");
  })
  .catch((error:any) => {
      console.error("Error writing document - /api/earmark/public_token/exchange");
      console.error("Error writing document: ", error);
  })
  console.log("updated firestore");
}

module.exports = router;