/* eslint-disable */

// TODO: WORKS UNLESS FIRST YEAR HAS MISSING MONTHS, testArr setup should fail, but it passes
// first year doesn't end with 12, passes
// first year ends with 12, contains two months and one is 7 other is 12, passes
// first year doesn't end with 12, contains one month and passes
// FIRST YEAR CHECKING BROKEN



import axios from 'axios';
import dotenv from 'dotenv';
import moment from 'moment';
dotenv.config();
const globalVars = require('../../../lib/globalVars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const updateFirestore = require('../../../lib/firebase/firestore/');
const express = require('express');
const router = express.Router();

const monthDates = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


const testArr:any = {"Uber": {
    "merchant_name": "Uber",
    "transactions": [
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "nk4Dz7pnqNuxWzWe4BpEfnnjlGw6p9uKdMdwZ",
            "date": "2022-05-18",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1652857200,
            "unix_epoch_month_start_end": [
                1651388400,
                1654066799
            ]
        },
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "RNBM5pVD7EcL8A89NGXDCrrjd5DR7biXKoK36",
            "date": "2022-04-18",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1650265200,
            "unix_epoch_month_start_end": [
                1648796400,
                1651388399
            ]
        },
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "raqDdMRnBeu1ydyBjqg5cvveEbZzglCaxkx61",
            "date": "2022-03-17",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1645084800,
            "unix_epoch_month_start_end": [
                1643702400,
                1646121599
            ]
        },
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "raqDdMRnBeu1ydyBjqg5cvveEbZzglCaxkx61",
            "date": "2022-02-17",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1645084800,
            "unix_epoch_month_start_end": [
                1643702400,
                1646121599
            ]
        },
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "aWkX5qdbnwSelzlwWaGki995BomDWvH1qKqQB",
            "date": "2022-01-18",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1642492800,
            "unix_epoch_month_start_end": [
                1641024000,
                1643702399
            ]
        },
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "aWkX5qdbnwSelzlwWaGki995BomDWvH1qKqQB",
            "date": "2021-12-18",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1642492800,
            "unix_epoch_month_start_end": [
                1641024000,
                1643702399
            ]
        },
        {
            "account_id": "kKwDqNbWVdcRGqG3xba4hZZ31ebaqbizWX9lQ",
            "transaction_id": "aWkX5qdbnwSelzlwWaGki995BomDWvH1qKqQB",
            "date": "2021-08-18",
            "name": "Uber 072515 SF**POOL**",
            "amount": 6.33,
            "merchant_name": "Uber",
            "unix_epoch_time": 1642492800,
            "unix_epoch_month_start_end": [
                1641024000,
                1643702399
            ]
        },
    ]
}};






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

const sumAllMonths = (array:number[]) => array.reduce((prev:number, current:number) => prev + current)

const sumFirstThroughLast = (lastNum:number) => {
    let total = 0;
    for (let i = 0; i <= lastNum; i++) {
        total += i;
    }
    return total;
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
        console.log('loop');
        const sortedMonths = datesObj[yearsArr[i]].sort((a:number, b:number) => a - b);
        /*
        let bigNumCounter;

        for (let n = 0; n < datesObj[yearsArr[i]].length; n++) {
            if (n == 0) bigNumCounter = datesObj[yearsArr[i]][n];
            if (datesObj[yearsArr[i]][n] > bigNumCounter) bigNumCounter = datesObj[yearsArr[i]][n];
        }
        console.log(datesObj[yearsArr[i]], bigNumCounter);
        */
        const lastMonth = sortedMonths[sortedMonths.length -1];
        const firstMonth = sortedMonths[0];
        if ((yearsArr[i] == firstYear) && (lastMonth != 12)) {
            console.log(merchant_name, 'false');
            return false;
        } else if ((yearsArr[i] == firstYear) && (lastMonth == 12) && (noSkippedMonths(datesObj, yearsArr, i, merchant_name) == false)) {
            console.log(merchant_name, 'false');
            return false;
        } else if ((yearsArr[i] != firstYear) && (firstMonth == 1) && (noSkippedMonths(datesObj, yearsArr, i, merchant_name) == false)) {
            console.log(merchant_name, 'false');
            return false;
        } else if ((yearsArr[i] != firstYear) && (firstMonth != 1)) {
            console.log(merchant_name, 'false');
            return false;
        }
    }
};


const checkDupsDates = (dateArr:string[], singleDate:string, merchant_name:string) => {
    if (checkDuplicateMonths(dateArr, singleDate)) {
        console.log('dup months', merchant_name);
        return true
    } else {
        const yearsArr = sortDatesByYear(dateArr).yearsArr;
        const datesObj = sortDatesByYear(dateArr).datesObj;
        /*
        if (yearsArr.length > 1) {
            const sortedMonths = datesObj[yearsArr[0]].sort((a:number, b:number) => a - b);
            const lastMonth = sortedMonths[sortedMonths.length -1];
            if (lastMonth != 12) {
                console.log(lastMonth);
                console.log(sortedMonths);
                return true;
            }
        }
        */
        if (yearsArr.length > 1 && multiYears(datesObj, yearsArr, merchant_name) == false) return true;
        if (yearsArr.length == 1 && noSkippedMonths(datesObj, yearsArr, 0, merchant_name) == false) return true;
        return false;
    }

};

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const queryType = req.query.queryType;


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
                        transactions: [recTxn]
                    };
                    return;
                };
                recTxnMap[recTxn.merchant_name].transactions.push(recTxn);
            })

            let objMapCount = 0;
            Object.keys(recTxnMap).map((key:any) => {
                objMapCount++;

                let timeStamps = new Array();
                let monthlyTimeStampArrays = new Array();
                let normalDates:string[] = new Array();
                recTxnMap[key].transactions.forEach((txn:any) => {
                    const splitDate = `${txn.date.split('-')[0]}${txn.date.split('-')[1]}`
                    normalDates.push(splitDate);
                    timeStamps.push(txn.unix_epoch_time);
                    monthlyTimeStampArrays.push(txn.unix_epoch_month_start_end);
                });

                recTxnMap[key].transactions.every((txn:any) => {
                    const splitDate = `${txn.date.split('-')[0]}${txn.date.split('-')[1]}`

                    if (checkDupsDates(normalDates, splitDate, txn.merchant_name)) {
                        delete recTxnMap[key];
                        return !checkDupsDates(normalDates, splitDate, txn.merchant_name);
                    }
                });
            })


            finalResponse = {
                recurring_transactions: recTxnMap,
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