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

    const userId = req.query.user_id;
    const access_token = req.query.access_token;
    const itemId = req.query.itemId;
    let finalResponse;
    let finalStatus;
    let requestId = new String();
    let institution_id = new String();
    let available_products;
    let item = new Object();

    /* @ts-ignore */
    const request: ItemGetRequest = {
        access_token: access_token,
    };
    try {
        const response = await client.itemGet(request);
        available_products = response.data.item.available_products;
        available_products.push("transactions");
        institution_id = response.data.item.institution_id;
        item = response.data.item;
        requestId = response.data.request_id;
        const docRef = doc(db, "users", userId, "access_tokens", access_token);
        const docData = {
            institution_Id: institution_id,
            available_products: available_products,
        }
        setDoc(
            docRef, 
            docData, 
            { merge: true }
        )
        .then(() => {
            console.log("Document successfully written! - /api/plaid/item/get");
        })
        .catch((error:any) => {
            console.error("Error writing document - /api/plaid/item/get");
            console.error("Error writing document: ", error);
            res.status(400);
            res.json({
                error: error,
                message: "Error writing document - /api/plaid/item/get"
            });
            res.end();
        })

        finalResponse = {
            available_products: available_products,
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                item: item,
                user_id: userId,
                requestTime: new Date().toLocaleString(),
                requestIds: requestId,
                nextApiUrl: "/api/plaid/item/get",
                backendApiUrl: "/api/itemGet",
                method: "GET",
            },
        };
        finalStatus = 200;
    } catch (error) {
        finalResponse = {
            stack: error.stack,
            headers: error.headers,
            statusCode: error.statusCode,
            message: "error, try again",
            required_params: [
                {id: "user_id", type: "string", description: "users unique id"},
                {id: "access_token", type: "string", description: "plaid access token"},
                {id: "itemId", type: "string", description: "plaid item id"},
            ],
            metaData: {
                error: error,
                requestTime: new Date().toLocaleString(),
                nextApiUrl: "/api/plaid/item/get",
                required_method: "GET",
                method_used: req.method,
            }
        };
        finalStatus = 400;
        console.error(error);
    }
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});


module.exports = router;