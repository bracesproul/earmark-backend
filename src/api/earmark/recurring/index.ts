/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
const moment = require('moment');
const parseNumbers = require('../../../lib/parseNumbers');
const uniqid = require('uniqid');
const { makeStringJustLetterAndNumber } = require('../../../lib/parsing/formatString');
dotenv.config();
const globalVars = require('../../../lib/globalVars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const updateFirestore = require('../../../lib/firebase/firestore/');
const express = require('express');
const router = express.Router();

const API_URL = globalVars().API_URL;

const getDateRange = (date:string)=> {
    const lowDate = parseInt(moment(date, 'YYYY-MM-DD').subtract(1, 'days').format('DD-MM-YYYY').split('-')[0]);
    const highDate = parseInt(moment(date, 'YYYY-MM-DD').add(1, 'days').format('DD-MM-YYYY').split('-')[0]);
    return [lowDate, highDate]
};

const getUnixEpochStartEnd = (date:string) => {
    const firstOfMonth = moment(date, 'YYYY-MM-DD').startOf('month').unix();
    const lastOfMonth = moment(date, 'YYYY-MM-DD').endOf('month').unix();
    return [firstOfMonth, lastOfMonth];
};

const getUnixEpoch = (date:string) => {
    return moment(date, 'YYYY-MM-DD').unix();
};

const checkDuplicateMonths = (dateArr:string[], singleDate:string) => {
    let counter = 0;
    for (let i = 0; i < dateArr.length; i++) {
        if (dateArr[i] == singleDate) counter++
    }
    if (counter > 1) {
        return true;
    } else return false
}

const sortDatesByYear = (dateArr:string[]) => {
    let yearsArr = new Array();
    let datesObj:any = new Object()
    for (let i = 0; i < dateArr.length; i++) {
        const justMonth = parseInt(dateArr[i].slice(4, 6));
        const justYear = parseInt(dateArr[i].slice(0, 4));
        if (!yearsArr.includes(justYear)) yearsArr.push(justYear);

        if (!datesObj.hasOwnProperty(justYear)) {
            datesObj[justYear] = [justMonth];
        } else {
            datesObj[justYear].push(justMonth)
        }
    };
    return { yearsArr: yearsArr, datesObj: datesObj}
}

const getAvergeChargeAmount = (totalAmount:number, totalTransactions:number) => totalAmount / totalTransactions;

const getFirstAndLastDate = (datesArray:string[]) => {
    let largestDate = 0;
    let smallestDate = 0;
    datesArray.map((date) => {
        const numDate = parseInt(date.split('-').join(''));
        if (largestDate == 0) largestDate = numDate;
        if (numDate > largestDate) largestDate = numDate;
    })
    datesArray.map((date) => {
        const numDate = parseInt(date.split('-').join(''));
        if (smallestDate == 0) smallestDate = numDate;
        if (numDate < smallestDate) smallestDate = numDate;
    })
    const largestDateString = `${largestDate.toString().slice(0, 4)}-${largestDate.toString().slice(4, 6)}-${largestDate.toString().slice(6, 8)}`
    const smallestDateString = `${smallestDate.toString().slice(0, 4)}-${smallestDate.toString().slice(4, 6)}-${smallestDate.toString().slice(6, 8)}`
    return { firstDate: smallestDateString, lastDate: largestDateString};
};

const noSkippedMonths = (datesObj:any, yearsArr:number[], i:number, merchant_name:string) => {
    const sortedMonths = datesObj[yearsArr[i]].sort((a:number, b:number) => a - b);
    for (let i = 1; i < sortedMonths.length; i++) {
        if (sortedMonths[i -  1] + 1 != sortedMonths[i]) return false;
    }
    return true;
};

const multiYears = (datesObj:any, yearsArr:number[], merchant_name:string) => {
    const firstYear = Math.min(...yearsArr);

    for (let i = 0; i < yearsArr.length; i++) {
        const sortedMonths = datesObj[yearsArr[i]].sort((a:number, b:number) => a - b);
        const lastMonth = sortedMonths[sortedMonths.length -1];
        const firstMonth = sortedMonths[0];
        if ((yearsArr[i] == firstYear) && (lastMonth != 12)) {
            return false;
        } else if ((yearsArr[i] == firstYear) && (lastMonth == 12) && (noSkippedMonths(datesObj, yearsArr, i, merchant_name) == false)) {
            return false;
        } else if ((yearsArr[i] != firstYear) && (firstMonth == 1) && (noSkippedMonths(datesObj, yearsArr, i, merchant_name) == false)) {
            return false;
        } else if ((yearsArr[i] != firstYear) && (firstMonth != 1)) {
            return false;
        }
    }
};


const checkDupsDates = (dateArr:string[], singleDate:string, merchant_name:string) => {
    if (checkDuplicateMonths(dateArr, singleDate)) {
        return true
    } else {
        const yearsArr = sortDatesByYear(dateArr).yearsArr;
        const datesObj = sortDatesByYear(dateArr).datesObj;
        if (yearsArr.length > 1 && multiYears(datesObj, yearsArr, merchant_name) == false) return true;
        if (yearsArr.length == 1 && noSkippedMonths(datesObj, yearsArr, 0, merchant_name) == false) return true;
        return false;
    }

};

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;


    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['user_id', 'startDate', 'endDate'];
    const params = {
        user_id: user_id,
        startDate: startDate,
        endDate: endDate,
    };
    const nextApiUrl = '/api/earmark/allTransactions';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        await res.status(400);
        await res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE
    let finalResponse;
    let finalStatus;

    const accessTokens = await updateFirestore.getAccessTokensTransactions(user_id);
    for (let i = 0; i < accessTokens.length; i++) {
        try {
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'earmark-api-key': process.env.EARMARK_API_KEY,
                },
                url: API_URL + "/api/plaid/transactions/get",
                params: {
                    user_id: user_id,
                    access_token: accessTokens[i],
                    startDate: startDate,
                    endDate: endDate,
                },
                method: "GET"
            }
            const { data } = await axios(config);
            let txns:any = [];
            let txnNames: any = [];

            data.transactions.transactions.forEach((transaction:any) => {
                let name = transaction.merchant_name;
                if (!name) name = transaction.name
                if (!txnNames.includes(name)) txnNames.push(name);
                txns.push({
                    account_id: transaction.account_id,
                    category: transaction.personal_finance_category.primary,
                    transaction_id: transaction.transaction_id,
                    date: transaction.date,
                    name: transaction.name,
                    amount: transaction.amount,
                    merchant_name: name,
                    unix_epoch_time: getUnixEpoch(transaction.date),
                    unix_epoch_month_start_end: getUnixEpochStartEnd(transaction.date)
                })
            })

            let recurringTxns = new Array();
            for (let i = 0; i < txns.length; i++) {
                txns.forEach((forEaTxn:any) => {
                    const splitDate = parseInt(txns[i].date.split('-')[2]);
                    if (txns[i].date == forEaTxn.date && txns[i].merchant_name == forEaTxn.merchant_name) {
                        return;
                    }
                    if ((txns[i].merchant_name == forEaTxn.merchant_name) && (splitDate >= getDateRange(forEaTxn.date)[0] && splitDate <= getDateRange(forEaTxn.date)[1])) {
                        if (recurringTxns.find(element => element == forEaTxn)) return;
                        recurringTxns.push(forEaTxn);
                    }
                })
            }
            let finalTxnArr:any = [{transactions: {}}]


            let recTxnMap:any = {};
            recurringTxns.forEach((recTxn:any) => {
                if (!recTxnMap.hasOwnProperty(recTxn.merchant_name)) {
                    recTxnMap[recTxn.merchant_name] = {
                        merchant_name: recTxn.merchant_name,
                        category: recTxn.category,
                        allDates: [recTxn.date],
                        transactions: [recTxn],
                        transactionIds: [],
                    };
                    return;
                };
                recTxnMap[recTxn.merchant_name].transactions.push(recTxn);
                recTxnMap[recTxn.merchant_name].allDates.push(recTxn.date);
            })

            let objMapCount = 0;
            let final_data = new Array();

            Object.keys(recTxnMap).map((key:any) => {
                objMapCount++;

                let timeStamps = new Array();
                let monthlyTimeStampArrays = new Array();
                let normalDates:string[] = new Array();
                let transactionIds:string[] = new Array();
                let accountIds:string[] = new Array();
                let merchant_name:string;
                let totalAmountCounter:number = 0;
                let transactionCounter:number = 0;
                // const datesArray:string[] = recTxnMap[key].allDates;
                const firstDate = getFirstAndLastDate(recTxnMap[key].allDates).firstDate;
                const lastDate = getFirstAndLastDate(recTxnMap[key].allDates).lastDate;
                let category:string;

                recTxnMap[key].transactions.forEach((txn:any) => {
                    const splitDate = `${txn.date.split('-')[0]}${txn.date.split('-')[1]}`
                    normalDates.push(splitDate);
                    timeStamps.push(txn.unix_epoch_time);
                    monthlyTimeStampArrays.push(txn.unix_epoch_month_start_end);
                    transactionIds.push(txn.transaction_id);
                    accountIds.push(txn.account_id);
                    merchant_name = txn.merchant_name;
                    totalAmountCounter += txn.amount;
                    transactionCounter += 1;
                    category = makeStringJustLetterAndNumber(txn.category)
                    recTxnMap[key].transactionIds.push({ txn_id: txn.transaction_id, txn_date: txn.date })
                });
                
                recTxnMap[key].transactions.every((txn:any) => {
                    const splitDate = `${txn.date.split('-')[0]}${txn.date.split('-')[1]}`

                    if (checkDupsDates(normalDates, splitDate, txn.merchant_name)) {
                        delete recTxnMap[key];
                        return !checkDupsDates(normalDates, splitDate, txn.merchant_name);
                    }
                });
            })

            
            Object.keys(recTxnMap).map((key:any) => {
                const datesArray = recTxnMap[key].allDates;
                let totalAmountCounter = 0;
                let transactionCounter = 0;
                recTxnMap[key].transactions.forEach((txn:any) => {
                    totalAmountCounter += txn.amount;
                    transactionCounter += 1;
                });
                const newStruct = recTxnMap[key].transactions.map((txn:any) => {
                    return {
                        txn_id: txn.transaction_id,
                        acc_id: txn.account_id,
                        col1: txn.merchant_name,
                        col2: parseNumbers(totalAmountCounter),
                        col3: parseNumbers(getAvergeChargeAmount(totalAmountCounter, transactionCounter)),
                        col4: transactionCounter,
                        col5: getFirstAndLastDate(datesArray).firstDate,
                        col6: getFirstAndLastDate(datesArray).lastDate,
                        col7: makeStringJustLetterAndNumber(txn.category),
                        date: txn.date,
                        amount: parseNumbers(txn.amount)
                    }
                });
                final_data.push(newStruct)
            });
            let merchant_transactions_and_overview:Array<any> = new Array();
            let structCounter = 0;
            final_data.forEach((data:any) => {
                structCounter += 1;
                for (let i = 0; i < data.length; i++) {
                    if (i == 0) {
                        merchant_transactions_and_overview.push({
                            id: `${uniqid()}-${uniqid()}`,
                            acc_id: data[i].acc_id,
                            col1: data[i].col1,
                            col2: `$${data[i].col2}`,
                            col3: `$${data[i].col3}`,
                            col4: data[i].col4,
                            col5: data[i].col5,
                            col6: data[i].col6,
                            col7: data[i].col7,
                            txn_metadata: [{
                                col1: data[i].col1,
                                col2: data[i].date,
                                col3: `$${data[i].amount}`,
                                col4: data[i].col7,
                                id: `${uniqid()}-${uniqid()}`,
                                acc_id: data[i].acc_id,
                            }]
                        });
                    };
                    merchant_transactions_and_overview[structCounter - 1].txn_metadata.push({
                        col1: data[i].col1,
                        col2: data[i].date,
                        col3: `$${data[i].amount}`,
                        col4: data[i].col7,
                        id: `${uniqid()}-${uniqid()}`,
                        acc_id: data[i].acc_id,
                    });
                }
            })

            finalResponse = {
                recurring_transactions: merchant_transactions_and_overview,
                statusCode: 200,
                statusMessage: "Success",
                metaData: {
                    requestTime: new Date().toLocaleString(),
                    nextApiUrl: "/api/earmark/recurring",
                    backendApiUrl: "/api/recurring",
                    method: "GET",
                },
            };
            finalStatus = 200;
        } catch (error) {
            finalStatus = 400;
            finalResponse = error;
        };
    };


    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;