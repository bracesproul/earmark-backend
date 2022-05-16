/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

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
    let docRef;
    if (userId) {
        docRef = collection(db, "users", userId, "access_tokens");
    } else if (!userId) {
        console.error("Error: userId required");
        res.status(400);
        res.json({
            message: "Error: userId required"
        });
        res.end();
    }

    let accessTokens = new Array;
    const q = query(docRef, where("available_products", "array-contains", "transactions"));
    const querySnapshot = await getDocs(q)
    .then(() => {
        console.log("Document successfully written! - api/earmark/allTransactions");
    })
    .catch((error:any) => {
        console.error("Error writing document - api/earmark/allTransactions");
        console.error("Error writing document: ", error);
        res.status(400);
        res.json({
            error: error,
            message: "Error writing document - api/earmark/allTransactions"
        });
        res.end();
    })
    querySnapshot.forEach((doc:any) => {
    // doc.data() is never undefined for query doc snapshots
    accessTokens.push(doc.data().access_token);
    });
    let accounts = new Array;
    let transactions = new Array;
    let total_transactions = new Array;
    let full_responses = new Array;
    for (let i = 0; accessTokens.length > i; i++) {
        try {
            console.log(accessTokens[i])
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                url: "http://localhost:5000/api/plaid/transactions/get",
                params: {
                    user_id: userId,
                    access_token: accessTokens[i],
                    startDate: "2021-05-01",
                    endDate: "2022-05-01"
                },
                method: "GET"
            }
            const response = await axios(config);
            const transactions_res = response.data.transactions.transactions;
            const accounts_res = response.data.transactions.accounts;
            const total_transactions_res = response.data.transactions.total_transactions;
            const full_transaction_res = response.data.transactions;
            full_responses.push(full_transaction_res)
            accounts.push(accounts_res);
            transactions.push(transactions_res);
            total_transactions.push({
                request_id: response.data.transactions.request_id, 
                total_transactions: total_transactions_res
            })
        } catch (error) {
            res.status(400);
            res.send(error);
            res.end();
        };
    }
    const success_message = {
        message: 'successful request',
        accounts: accounts,
        transactions: transactions,
        total_transactions: total_transactions,
        statusCode: 200,
        statusMessage: "Success",
        metaData: {
            requestTime: new Date().toLocaleString(),
            nextApiUrl: "/api/earmark/allTransactions",
            backendApiUrl: "/api/allTransactions",
            method: "GET",
            responses: full_responses
        },
    };
    await res.status(200);
    await res.send(success_message);
    await res.end();
});

module.exports = router;