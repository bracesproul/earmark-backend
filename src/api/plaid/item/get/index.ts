/* eslint-disable */
/* @ts-ignore */
const express = require('express');
const router = express.Router();

const { 
    Configuration, 
    PlaidApi, 
    PlaidEnvironments, 
    AccountsGetRequest 
} = require("plaid");

const { 
    collection, 
    query, 
    doc,
    getDocs, 
    setDoc,
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

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const accessToken = req.query.access_token;
    const itemId = req.query.itemId;

    let requestId = new String();
    let institution_id = new String();
    let available_products = new Array();
    let item = new Object();

    const docRef = doc(db, "users", user_id, "access_tokens", itemId);

    /* @ts-ignore */
    const request: ItemGetRequest = {
        access_token: accessToken,
    };
    try {
        const response = await client.itemGet(request);

        available_products.push(response.data.item.available_products);
        institution_id = response.data.item.institution_id;
        item = response.data.item;
        requestId = response.data.request_id;

        const docData = {
            institution_id: institution_id,
            available_products: available_products,
        }
        setDoc(
            docRef, 
            docData, 
            { merge: true }
        ).then(() => {
            console.log("Successfully set doc");
        });

        const finalResponse = {
            available_products: available_products,
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                item: item,
                user_id: user_id,
                requestTime: new Date().toLocaleString(),
                requestIds: requestId,
                nextApiUrl: "/api/plaid/item/get",
                backendApiUrl: "/api/itemGet",
                method: "GET",
            },
        };
        console.log("finalResponse: ", finalResponse);
        await res.status(200);
        await res.send(finalResponse);
        await res.end();
    } catch (error) {
        console.log('INSIDE CATCH');
        res.status(400);
        res.send(error);
        res.end();
    }
});


module.exports = router;