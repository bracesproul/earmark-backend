/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

const { Configuration, PlaidApi, PlaidEnvironments, ItemPublicTokenExchangeRequest } = require("plaid");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");


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
    /* @ts-ignore */
  const request: ItemPublicTokenExchangeRequest = {
    public_token: publicToken,
  };

  try {
    console.log('exchange token called');
    const response = await client.itemPublicTokenExchange(request);
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    console.log('exchange token success', accessToken, itemId);

    await updateFirestore(userId, accessToken, itemId);
    res.status(200).send("Successfully generated access token and updated firestore");
  } catch (error) {
    res.status(400).send(error);
  }

});

const updateFirestore = async (user_id: string, access_token: string, item_id: string) => {
  const docRef = doc(db, "users", user_id, "access_tokens", item_id);
  const docData = {
    access_token: access_token,
    item_id: item_id,
    user_id: user_id,
  }
  await setDoc(docRef, docData);
  console.log("updated firestore");
}

module.exports = router;