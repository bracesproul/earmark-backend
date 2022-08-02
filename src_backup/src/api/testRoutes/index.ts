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
    basePath: PlaidEnvironments[process.env.PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.CLIENT_ID,
        'PLAID-SECRET': process.env.SECRET,
        'Plaid-Version': '2020-09-14',
      },
    },
});


const INCOME = {
  category: 'INCOME', 
  transactions: new Array,
  frontendName: "Income",
}
const TRANSFER_IN = {
  category: 'TRANSFER_IN', 
  transactions: new Array,
  frontendName: "Transfer In",
}
const TRANSFER_OUT = {
  category: 'TRANSFER_OUT', 
  transactions: new Array,
  frontendName: "Transfer Out",
}
const LOAN_PAYMENTS = {
  category: 'LOAN_PAYMENTS', 
  transactions: new Array,
  frontendName: "Loan Payments",
}
const BANK_FEES = {
  category: 'BANK_FEES', 
  transactions: new Array,
  frontendName: "Bank Fees",
}
const ENTERTAINMENT = {
  category: 'ENTERTAINMENT', 
  transactions: new Array,
  frontendName: "Entertainment",
}
const FOOD_AND_DRINK = {
  category: 'FOOD_AND_DRINK', 
  transactions: new Array,
  frontendName: "Food and Drink",
}
const GENERAL_MERCHANDISE = {
  category: 'GENERAL_MERCHANDISE', 
  transactions: new Array,
  frontendName: "General Merchandise",
}
const HOME_IMPROVEMENT = {
  category: 'HOME_IMPROVEMENT', 
  transactions: new Array,
  frontendName: "Home Improvement",
}
const MEDICAL = {
  category: 'MEDICAL', 
  transactions: new Array,
  frontendName: "Medical",
}
const PERSONAL_CARE = {
  category: 'PERSONAL_CARE', 
  transactions: new Array,
  frontendName: "Personal Care",
}
const GENERAL_SERVICES = {
  category: 'GENERAL_SERVICES', 
  transactions: new Array,
  frontendName: "General Services",
}
const GOVERNMENT_AND_NON_PROFIT = {
  category: 'GOVERNMENT_AND_NON_PROFIT', 
  transactions: new Array,
  frontendName: "Government and Non-Profit",
}
const TRANSPORTATION = {
  category: 'TRANSPORTATION', 
  transactions: new Array,
  frontendName: "Transportation",
}
const TRAVEL = {
  category: 'TRAVEL', 
  transactions: new Array,
  frontendName: "Travel",
}
const RENT_AND_UTILITIES = {
  category: 'RENT_AND_UTILITIES', 
  transactions: new Array,
  frontendName: "Rent and Utilities",
}


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
  const access_token = req.query.access_token;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate
  let transactionsGet;
  let requestId = new String();
  let totalTxns = new Number();
  let finalResponse;
  let finalStatus;

  /* @ts-ignore */
  const request: TransactionsGetRequest = {
    access_token: access_token,
    start_date: startDate,
    end_date: endDate,
    options: {
        include_personal_finance_category: true,
    }
  };

  try {
  const response = await client.transactionsGet(request);
  transactionsGet = response.data;
  requestId = response.data.request_id;

  response.data.transactions.map( async (transaction:any) => {
    const primaryV = transaction.personal_finance_category.primary;
    const transactionSchema = {
      id: transaction.transaction_id,
      col1: transaction.name,
      col2: transaction.authorized_date,
      col3: transaction.amount,
      col4: primaryV
    }
    switch (primaryV) {
      case 'INCOME':
        INCOME.transactions.push(transactionSchema);
        break;
      case 'TRANSFER_IN':
        TRANSFER_IN.transactions.push(transactionSchema);
        break;
      case 'TRANSFER_OUT':
        TRANSFER_OUT.transactions.push(transactionSchema);
        break;
      case 'LOAN_PAYMENTS':
        LOAN_PAYMENTS.transactions.push(transactionSchema);
        break;
      case 'BANK_FEES':
        BANK_FEES.transactions.push(transactionSchema);
        break;
      case 'ENTERTAINMENT':
        ENTERTAINMENT.transactions.push(transactionSchema);
        break;
      case 'FOOD_AND_DRINK':
        FOOD_AND_DRINK.transactions.push(transactionSchema);
        break;
      case 'GENERAL_MERCHANDISE':
        GENERAL_MERCHANDISE.transactions.push(transactionSchema);
        break;
      case 'HOME_IMPROVEMENT':
        HOME_IMPROVEMENT.transactions.push(transactionSchema);
        break;
      case 'MEDICAL':
        MEDICAL.transactions.push(transactionSchema);
        break;
      case 'PERSONAL_CARE':
        PERSONAL_CARE.transactions.push(transactionSchema);
        break;
      case 'GENERAL_SERVICES':
        GENERAL_SERVICES.transactions.push(transactionSchema);
        break;
      case 'GOVERNMENT_AND_NON_PROFIT':
        GOVERNMENT_AND_NON_PROFIT.transactions.push(transactionSchema);
        break;
      case 'TRANSPORTATION':
        TRANSPORTATION.transactions.push(transactionSchema);
        break;
      case 'TRAVEL':
        TRAVEL.transactions.push(transactionSchema);
        break;
      case 'RENT_AND_UTILITIES':
        RENT_AND_UTILITIES.transactions.push(transactionSchema);
        break;
    }
  });

  const finalObject = [
    INCOME,
    TRANSFER_IN,
    TRANSFER_OUT,
    LOAN_PAYMENTS,
    BANK_FEES,
    ENTERTAINMENT,
    FOOD_AND_DRINK,
    GENERAL_MERCHANDISE,
    HOME_IMPROVEMENT,
    MEDICAL,
    PERSONAL_CARE,
    GENERAL_SERVICES,
    GOVERNMENT_AND_NON_PROFIT,
    TRANSPORTATION,
    TRAVEL,
    RENT_AND_UTILITIES
  ];

  finalResponse = {
    transactions: finalObject,
    statusCode: 200,
    statusMessage: "Success",
    metaData: {
        totalTransactions: totalTxns,
        user_id: user_id,
        requestTime: new Date().toLocaleString(),
        requestIds: requestId,
        nextApiUrl: "/api/plaid/transactions/get",
        backendApiUrl: "/api/transactionsGet",
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
        {id: "startDate", type: "string", description: "start date of transactions"},
        {id: "endDate", type: "string", description: "end date of transactions"},
        {id: "user_id", type: "string", description: "users unique id"},
        {id: "access_token", type: "string", description: "plaid access token"},
      ],
      metaData: {
          error: error,
          requestTime: new Date().toLocaleString(),
          nextApiUrl: "/api/plaid/transactions/get",
          required_method: "GET",
          method_used: req.method,
      }
  };
  console.error('INSIDE CATCH');
  finalStatus = 400;
  };
  await res.status(finalStatus);
  await res.send(finalResponse);
  await res.end();
});

module.exports = router;