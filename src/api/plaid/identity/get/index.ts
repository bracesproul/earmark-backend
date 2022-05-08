/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

const { Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  IdentityGetRequest 
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
    let request_ids = new Array();

    let accounts = new Array();
    let accountIdentities = new Array();

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc: any) => {
        access_tokens.push(doc.data().access_token);
    });

    for (let i = 0; i < access_tokens.length; i++) {
        /* @ts-ignore */
        const request: IdentityGetRequest = {
            access_token: access_tokens[i],
        };
        try {
            const response = await client.identityGet(request);
            const identities = response.data.accounts.flatMap(
                (account:any) => account.owners,
            );
            accountIdentities.push(await identities);
            const accountsResponse = response.data.accounts;
            const accountData = accountsResponse.map((acc:any) => {
                return {
                    account_id: acc.account_id,
                    name: acc.name,
                    official_name: acc.official_name,
                    subtype: acc.subtype,
                    type: acc.type,
                    balances: acc.balances
                }
            });
            accounts.push(accountData);
            request_ids.push(response.data.request_id);
        } catch (error) {
            await res.status(400);
            await res.send(error);
            await res.end();
        }
    };

    const finalResponse = {
        accounts: accounts,
        accountIdentities: accountIdentities,
        statusCode: 200,
        statusMessage: "Success",
        metaData: {
            totalAccounts: accounts.length,
            user_id: user_id,
            requestTime: new Date().toLocaleString(),
            requestIds: request_ids,
            nextApiUrl: "/api/plaid/identity/get",
            backendApiUrl: "/api/identityGet",
            method: "GET",
        },
    };

    await res.status(200);
    await res.send(finalResponse);
    await res.end();
})

module.exports = router;