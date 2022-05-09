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

const { collection, 
  query, 
  getDocs, 
  getFirestore, 
  where 
} = require("firebase/firestore"); 

const { initializeApp } = require("firebase/app");

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

const firebaseConfig = {
  apiKey: "AIzaSyCOnXDWQ369OM1lW0VC5FdYE19q1ug0_dc",
  authDomain: "earmark-8d1d3.firebaseapp.com",
  projectId: "earmark-8d1d3",
  storageBucket: "earmark-8d1d3.appspot.com",
  messagingSenderId: "46302537330",
  appId: "1:46302537330:web:403eac7f28d2a4868944eb",
  measurementId: "G-5474KY2MRV"
};
const transactions_get_app = initializeApp(firebaseConfig);
const db = getFirestore(transactions_get_app);

router.get('/', async (req:any, res:any, next:any) => {
  const user_id = req.query.user_id;

  const q = query(collection(db, "users", user_id, "access_tokens"), where("user_id", "==", user_id));
  let access_tokens = new Array();
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc: any) => {
      access_tokens.push(doc.data().access_token);
  });

  const accountsArr = new Array();
  const requestIds = new Array();
  for (let i = 0; i < access_tokens.length; i++) {
    /* @ts-ignore */
    const request: AccountsGetRequest = {
        access_token: access_tokens[i],
    };
    try {
        const response = await client.accountsBalanceGet(request);
        console.log(response);
        accountsArr.push(response.data.accounts);
        requestIds.push(response.data.request_id);
  } catch (error) {
    console.log(error)
    res.status(400).send(error);
    res.end();
  }
  }
    const finalResponse = {
        accounts: accountsArr,
        statusCode: 200,
        statusMessage: "Success",
        metaData: {
            totalAccounts: accountsArr.length,
            user_id: user_id,
            requestTime: new Date().toLocaleString(),
            requestIds: requestIds,
            nextApiUrl: "/api/plaid/balance/get",
            backendApiUrl: "/api/balanceGet",
            method: "GET",
        },
    };
    await res.status(200);
    await res.send(finalResponse);
    await res.end();
})

module.exports = router;