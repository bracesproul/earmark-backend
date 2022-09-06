/* eslint-disable */
// TODO: add check for if no transactions are returned for given time period, if so noTxns: true
// ^to prevent frontend from thinking error occured and no txns were found

// TODO: connect and integrate total spending with frontend

/* eslint-disable */
export {};
const dotenv = require('dotenv');
dotenv.config();
// @ts-ignore
const parseNumbers = require('../../../lib/parseNumbers');
const { getAccessTokens } = require('../../../services/db');
const express = require('express');
const moment = require('moment');
const router = express.Router();
const {
    Configuration,
    PlaidApi,
    PlaidEnvironments,
    TransactionsGetRequest,
    TransactionsGetResponse
} = require("plaid");

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

/*
Requirements:
* transactions have same merchant name done
* transactions appear once a month done
* transactions are within the range of 27-33 days apart NOT DONE
* transactions have same $ amount (within 10%)
* transactions only occur once every 30 days (within 2 prev or 2 after days)
 */

interface TransactionsByNameData {
    id: string;
    name: string;
    uiName: string;
    date: string;
    amount: number;
    category: string;
}

interface ITransactionsByName {
    merchant_name: string;
    transactions: TransactionsByNameData[];
}

function sortTransactionsByName(transactions: any) {
    let transactionsByName:ITransactionsByName[] = [];
    for (let transaction of transactions) {
        let transactionName = transaction.merchant_name || transaction.name;
        transactionName = transactionName.toLowerCase();
        if (transactionsByName.length === 0) {
            transactionsByName.push({
                merchant_name: transactionName,
                transactions: [{
                    id: transaction.transaction_id,
                    name: transactionName,
                    uiName: transaction.merchant_name || transaction.name,
                    date: transaction.date,
                    amount: transaction.amount,
                    category: transaction.personal_finance_category.primary,
                }]
            });
        } else if (!transactionsByName.some((txn:any) => txn.merchant_name === transactionName)) {
            transactionsByName.push({
                merchant_name: transactionName,
                transactions: [{
                    id: transaction.transaction_id,
                    name: transactionName,
                    uiName: transaction.merchant_name || transaction.name,
                    date: transaction.date,
                    amount: transaction.amount,
                    category: transaction.personal_finance_category.primary,
                }]
            });
        } else if (transactionsByName.some((txn:any) => txn.merchant_name === transactionName)) {
            transactionsByName.forEach((txn:any) => {
                if (txn.merchant_name === transactionName) {
                    txn.transactions.push({
                        id: transaction.transaction_id,
                        name: transactionName,
                        uiName: transaction.merchant_name || transaction.name,
                        date: transaction.date,
                        amount: transaction.amount,
                        category: transaction.personal_finance_category.primary,
                    });
                }
            });
        }
    }
    return transactionsByName;
}

function filterDuplicateTransactionsByMonth(sortedByNameTransactions:ITransactionsByName[]) {
    let recurringTransactions: TransactionsByNameData[] = [];
    let transactionsChecked:string[];
    let noMatchCounter = 0;
    sortedByNameTransactions.forEach((txn:any, index) => {
        txn.transactions.forEach((transaction1:any) => {
            let transaction1AlreadyAdded = false;
            const firstDateLowerBound = moment(transaction1.date, 'YYYY-MM-DD').subtract(3, 'days');
            const firstDateUpperBound = moment(transaction1.date, 'YYYY-MM-DD').add(3, 'days');
            const firstAmountLowerBound = transaction1.amount - (transaction1.amount * 0.1);
            const firstAmountUpperBound = transaction1.amount + (transaction1.amount * 0.1);
            txn.transactions.forEach((transaction2:any) => {
                if (transaction2.id === transaction1.id) return;
                const secondDate = moment(transaction2.date, 'YYYY-MM-DD');
                console.log(secondDate, firstDateLowerBound, firstDateUpperBound);
                if (secondDate.isBetween(firstDateLowerBound, firstDateUpperBound) && transaction2.amount >= firstAmountLowerBound && transaction2.amount <= firstAmountUpperBound) {
                    if (!transactionsChecked.includes(transaction2.id)) {
                        console.log('does not include')
                        recurringTransactions.push(transaction2);
                        transactionsChecked.push(transaction2.id);
                    }
                    if (!transaction1AlreadyAdded || !transactionsChecked.includes(transaction1.id)) {
                        console.log('does not include')
                        transactionsChecked.push(transaction1.id);
                        recurringTransactions.push(transaction1);
                        transaction1AlreadyAdded = true;
                    }
                } else {
                    // console.log('no match', noMatchCounter++)
                }
            })
        })
    })
    return recurringTransactions;
}

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const accessTokens = await getAccessTokens(user_id);
    let finalResponse = []
    let finalStatus;
    let requestIds = new Array();
    for (let i = 0; i < accessTokens.length; i++) {
        try {
            // @ts-ignore
            const spendingRequest: TransactionsGetRequest = {
                access_token: accessTokens[i],
                start_date: moment().subtract(2, 'years').format('YYYY-MM-DD'),
                end_date: moment().format('YYYY-MM-DD'),
                options: {
                    include_personal_finance_category: true,
                },
            };
            const spendingResponse = await client.transactionsGet(spendingRequest);
            const transactions = spendingResponse.data.transactions;
            let sortedByNameTransactions = sortTransactionsByName(transactions);
            finalResponse.push(filterDuplicateTransactionsByMonth(sortedByNameTransactions))
        }
        catch (error) {
            console.error(error);
            await res.status(400).send(error);
            await res.end();
        }
    }

    await res.status(200);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;