/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const updateFirestore = require('../../../lib/firebase/firestore');
const express = require('express');
const router = express.Router();

const { Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
} = require('plaid');

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

const resetCategoryObjects = () => {
    INCOME = {
        category: 'INCOME', 
        transactions: new Array,
        frontendName: "Income",
      }
    TRANSFER_IN = {
        category: 'TRANSFER_IN', 
        transactions: new Array,
        frontendName: "Transfer In",
      }
    TRANSFER_OUT = {
        category: 'TRANSFER_OUT', 
        transactions: new Array,
        frontendName: "Transfer Out",
      };
    LOAN_PAYMENTS = {
        category: 'LOAN_PAYMENTS', 
        transactions: new Array,
        frontendName: "Loan Payments",
      };
    BANK_FEES = {
        category: 'BANK_FEES', 
        transactions: new Array,
        frontendName: "Bank Fees",
      };
    ENTERTAINMENT = {
        category: 'ENTERTAINMENT', 
        transactions: new Array,
        frontendName: "Entertainment",
      };
    FOOD_AND_DRINK = {
        category: 'FOOD_AND_DRINK', 
        transactions: new Array,
        frontendName: "Food and Drink",
      };
    GENERAL_MERCHANDISE = {
        category: 'GENERAL_MERCHANDISE', 
        transactions: new Array,
        frontendName: "General Merchandise",
      };
    HOME_IMPROVEMENT = {
        category: 'HOME_IMPROVEMENT', 
        transactions: new Array,
        frontendName: "Home Improvement",
      };
    MEDICAL = {
        category: 'MEDICAL', 
        transactions: new Array,
        frontendName: "Medical",
      };
    PERSONAL_CARE = {
        category: 'PERSONAL_CARE', 
        transactions: new Array,
        frontendName: "Personal Care",
      };
    GENERAL_SERVICES = {
        category: 'GENERAL_SERVICES', 
        transactions: new Array,
        frontendName: "General Services",
      };
    GOVERNMENT_AND_NON_PROFIT = {
        category: 'GOVERNMENT_AND_NON_PROFIT', 
        transactions: new Array,
        frontendName: "Government and Non-Profit",
      };
    TRANSPORTATION = {
        category: 'TRANSPORTATION', 
        transactions: new Array,
        frontendName: "Transportation",
      };
    TRAVEL = {
        category: 'TRAVEL', 
        transactions: new Array,
        frontendName: "Travel",
      };
    RENT_AND_UTILITIES = {
    category: 'RENT_AND_UTILITIES', 
    transactions: new Array,
    frontendName: "Rent and Utilities",
  };
    return;
}

let INCOME = {
  category: 'INCOME', 
  transactions: new Array,
  frontendName: "Income",
}
let TRANSFER_IN = {
  category: 'TRANSFER_IN', 
  transactions: new Array,
  frontendName: "Transfer In",
}
let TRANSFER_OUT = {
  category: 'TRANSFER_OUT', 
  transactions: new Array,
  frontendName: "Transfer Out",
}
let LOAN_PAYMENTS = {
  category: 'LOAN_PAYMENTS', 
  transactions: new Array,
  frontendName: "Loan Payments",
}
let BANK_FEES = {
  category: 'BANK_FEES', 
  transactions: new Array,
  frontendName: "Bank Fees",
}
let ENTERTAINMENT = {
  category: 'ENTERTAINMENT', 
  transactions: new Array,
  frontendName: "Entertainment",
}
let FOOD_AND_DRINK = {
  category: 'FOOD_AND_DRINK', 
  transactions: new Array,
  frontendName: "Food and Drink",
}
let GENERAL_MERCHANDISE = {
  category: 'GENERAL_MERCHANDISE', 
  transactions: new Array,
  frontendName: "General Merchandise",
}
let HOME_IMPROVEMENT = {
  category: 'HOME_IMPROVEMENT', 
  transactions: new Array,
  frontendName: "Home Improvement",
}
let MEDICAL = {
  category: 'MEDICAL', 
  transactions: new Array,
  frontendName: "Medical",
}
let PERSONAL_CARE = {
  category: 'PERSONAL_CARE', 
  transactions: new Array,
  frontendName: "Personal Care",
}
let GENERAL_SERVICES = {
  category: 'GENERAL_SERVICES', 
  transactions: new Array,
  frontendName: "General Services",
}
let GOVERNMENT_AND_NON_PROFIT = {
  category: 'GOVERNMENT_AND_NON_PROFIT', 
  transactions: new Array,
  frontendName: "Government and Non-Profit",
}
let TRANSPORTATION = {
  category: 'TRANSPORTATION', 
  transactions: new Array,
  frontendName: "Transportation",
}
let TRAVEL = {
  category: 'TRAVEL', 
  transactions: new Array,
  frontendName: "Travel",
}
let RENT_AND_UTILITIES = {
  category: 'RENT_AND_UTILITIES', 
  transactions: new Array,
  frontendName: "Rent and Utilities",
}

router.get('/', async (req:any, res:any, next:any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate

    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id', 'startDate', 'endDate'];
    const params = {
      user_id: user_id,
      startDate: startDate,
      endDate: endDate
    };
    const nextApiUrl = '/api/plaid/transactions/get';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        res.status(400);
        res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE
  
    let transactionsGet;
    let requestId = new String();
    let totalTxns = new Number();
    let finalResponse;
    let finalStatus;
    const accessTokens = await updateFirestore.getAccessTokensTransactions(user_id);

  for (let i = 0; i < accessTokens.length; i++) {
    /* @ts-ignore */
    const request: TransactionsGetRequest = {
        access_token: accessTokens[i],
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
        return;
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
  };

  await res.status(finalStatus);
  await res.send(finalResponse);
  resetCategoryObjects();
  await res.end();
});

module.exports = router;