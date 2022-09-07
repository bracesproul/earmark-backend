/* eslint-disable */
import dotenv from 'dotenv';
import {TransactionsGetResponse} from "plaid";
dotenv.config();
const globalvars = require('../../../lib/globalVars');
const { getAccessTokens } = require('../../../lib/firebase/firestore');
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

interface IGetLineChartData {
    lineChartData: Array<any>;
    categoriesContainingData: Array<any>;
    monthsContainingData: Array<any>;
    finalData2: Array<any>;
}


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

const deleteByValue = (array: Array<any>, value: number) => {
    const index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

const makeFirstLetterUpperCase = (string: string) => {
    string = string.split('_').join(' ');
    string = string.toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
    return string;
}

const makeUpperCase = (string: string) => {
    string = string.split(' ').join('_');
    return string.toUpperCase();
}

const roundUnevenNumbers = (number: number) => {
    if (number === 0) return 0;
    const numString = number.toString();
    if (numString.includes('.')) {
        numString.split('.')[1].length > 2 ? number = parseFloat(numString.split('.')[0] + '.' + numString.split('.')[1].slice(0, 2)) : number = parseFloat(numString);
        return number;
    }
    return parseInt(numString);
};

const getDatesArray = (range: number) => {
    let datesArray = new Array();
    for (let i = 0; i < range; i++) {
        let startDate = moment();
        startDate = startDate.subtract(i, "days");
        startDate = startDate.format("YYYY-MM-DD");
        datesArray.push(startDate);
    }
    return datesArray;
}

const getPrevDatesArray = (startRange: number, endRange: number) => {
    let datesArray = new Array();
    for (let i = startRange; i < endRange; i++) {
        let startDate = moment();
        startDate = startDate.subtract(i, "days");
        startDate = startDate.format("YYYY-MM-DD");
        datesArray.push(startDate);
    }
    return datesArray;
}

const getMonthDatesInArray = (year: string, month: string) => {
    let datesArray = new Array();

    if (moment([year]).isLeapYear() && month === '2') {
        for (let i = 0; i < 29; i++) {
            let startDate = moment(`${year}-02-01`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            const newDate = moment(startDate, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
            datesArray.push(newDate)
        }
        return datesArray;
    }
    else if (month === '2') {
        for (let i = 0; i < 28; i++) {
            let startDate = moment(`${year}-02-01`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            const newDate = moment(startDate, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
            datesArray.push(newDate)
        }
        return datesArray;
    }
    else if (month == '1' || month == '3' || month == '5' || month == '7' || month == '8') {
        for (let i = 0; i < 31; i++) {
            let startDate = moment(`${year}-0${month}-01`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            const newDate = moment(startDate, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
            datesArray.push(newDate)
        }
        return datesArray;
    }
    else if (month == '10' || month == '12') {
        for (let i = 0; i < 31; i++) {
            let startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            const newDate = moment(startDate, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
            datesArray.push(newDate)
        }
        return datesArray;
    }
    else if (month == '4' || month == '6' || month == '9') {
        for (let i = 0; i < 30; i++) {
            let startDate = moment(`${year}-0${month}-01`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            const newDate = moment(startDate, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
            datesArray.push(newDate)
        }
        return datesArray;
    }
    else if (month == '11') {
        for (let i = 0; i < 30; i++) {
            let startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            const newDate = moment(startDate, 'YYYY-MM-DD').add(i, "days").format("YYYY-MM-DD");
            datesArray.push(newDate)
        }
        return datesArray;
    }
}

// Line chart function
type MonthsAndYears = 'January 2020' | 'January 2021' | 'January 2022' | 'February 2020' | 'February 2021' | 'February 2022' | 'March 2020' | 'March 2021' | 'March 2022' | 'April 2020' | 'April 2021' | 'April 2022' | 'May 2020' | 'May 2021' | 'May 2022' | 'June 2020' | 'June 2021' | 'June 2022' | 'July 2020' | 'July 2021' | 'July 2022' | 'August 2020' | 'August 2021' | 'August 2022' | 'September 2020' | 'September 2021' | 'September 2022' | 'October 2020' | 'October 2021' | 'October 2022' | 'November 2020' | 'November 2021' | 'November 2022' | 'December 2020' | 'December 2021' | 'December 2022'
type Months = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December'

interface IChartTransactionResponse {
    time_period: MonthsAndYears;
    "name": MonthsAndYears;
    "month": Months;
    "Income": number | null;
    "Transfer In": number | null;
    "Transfer Out": number | null;
    "Loan Payments": number | null;
    "Bank Fees": number | null;
    "Entertainment": number | null;
    "Food And Drink": number | null;
    "General Merchandise": number | null;
    "Home Improvement": number | null;
    "Medical": number | null;
    "Personal Care": number | null;
    "General Services": number | null;
    "Government And Non-Profit": number | null;
    "Transportation": number | null;
    "Travel": number | null;
    "Rent And Utilities": number | null;
    "total": number | null;
    "startDate": string | null;
    "no_transactions": boolean;
}

const renameAndDeleteFinalRes = (final:any) => {
    for (let i = 0; i < final.length; i++) {
        // console.log(final[i]);
        final[i]['Income'] = final[i]['INCOME'];
        delete final[i]['INCOME'];
        final[i]['Transfer In'] = final[i]['TRANSFER_IN'];
        delete final[i]['TRANSFER_IN'];
        final[i]['Transfer Out'] = final[i]['TRANSFER_OUT'];
        delete final[i]['TRANSFER_OUT'];
        final[i]['Loan Payments'] = final[i]['LOAN_PAYMENTS'];
        delete final[i]['LOAN_PAYMENTS'];
        final[i]['Bank Fees'] = final[i]['BANK_FEES'];
        delete final[i]['BANK_FEES'];
        final[i]['Entertainment'] = final[i]['ENTERTAINMENT'];
        delete final[i]['ENTERTAINMENT'];
        final[i]['Food And Drink'] = final[i]['FOOD_AND_DRINK'];
        delete final[i]['FOOD_AND_DRINK'];
        final[i]['General Merchandise'] = final[i]['GENERAL_MERCHANDISE'];
        delete final[i]['GENERAL_MERCHANDISE'];
        final[i]['Home Improvement'] = final[i]['HOME_IMPROVEMENT'];
        delete final[i]['HOME_IMPROVEMENT'];
        final[i]['Medical'] = final[i]['MEDICAL'];
        delete final[i]['MEDICAL'];
        final[i]['Personal Care'] = final[i]['PERSONAL_CARE'];
        delete final[i]['PERSONAL_CARE'];
        final[i]['General Services'] = final[i]['GENERAL_SERVICES'];
        delete final[i]['GENERAL_SERVICES'];
        final[i]['Government And Non-Profit'] = final[i]['GOVERNMENT_AND_NON_PROFIT'];
        delete final[i]['GOVERNMENT_AND_NON_PROFIT'];
        final[i]['Transportation'] = final[i]['TRANSPORTATION'];
        delete final[i]['TRANSPORTATION'];
        final[i]['Travel'] = final[i]['TRAVEL'];
        delete final[i]['TRAVEL'];
        final[i]['Rent And Utilities'] = final[i]['RENT_AND_UTILITIES'];
        delete final[i]['RENT_AND_UTILITIES'];
    }
    return final;
}


const newGetLineChartData = (response: TransactionsGetResponse) => {
    const transactions = response.data.transactions;
    let initialList: any = [];
    let final: any = [];
    let categories: string[] = [];
    let months:any = {
        2020: [],
        2021: [],
        2022: []
    };
    let monthsAlreadyChecked: string[] = [];
    if (transactions.length == 0) {
        return {
            final: [{
                time_period: null,
                name: null,
                month: null,
                INCOME: 0,
                TRANSFER_IN: 0,
                TRANSFER_OUT: 0,
                LOAN_PAYMENTS: 0,
                BANK_FEES: 0,
                ENTERTAINMENT: 0,
                FOOD_AND_DRINK: 0,
                GENERAL_MERCHANDISE: 0,
                HOME_IMPROVEMENT: 0,
                MEDICAL: 0,
                PERSONAL_CARE: 0,
                GENERAL_SERVICES: 0,
                GOVERNMENT_AND_NON_PROFIT: 0,
                TRANSPORTATION: 0,
                TRAVEL: 0,
                RENT_AND_UTILITIES: 0,
                total: 0,
                startDate: null,
                no_transactions: true
            }],
            categories: categories,
            months: months
        }
    }
    for (let i = 0; i < transactions.length; i++) {
        const categoryNameForKey = transactions[i].personal_finance_category.primary.split('-').join('_');
        initialList.push({
            amount: transactions[i].amount,
            date: transactions[i].date,
            category: makeFirstLetterUpperCase(transactions[i].personal_finance_category.primary),
            category_name: categoryNameForKey,
            account_id: transactions[i].account_id,
            merchant_name: transactions[i].merchant_name,
            name: transactions[i].name,
            transaction_id: transactions[i].transaction_id
        })
    }
    for (let i = 0; i < initialList.length; i++) {
        const simpleDate = moment(initialList[i].date, 'YYYY-MM-DD').format('MMMM-YYYY');
        const cleanDate = moment(initialList[i].date, 'YYYY-MM-DD').format('MMMM YYYY');
        const month = moment(initialList[i].date, 'YYYY-MM-DD').format('MMMM');
        const year  = moment(initialList[i].date, 'YYYY-MM-DD').format('YYYY');
        if (!monthsAlreadyChecked.includes(simpleDate)) {
            monthsAlreadyChecked.push(simpleDate);
            final.push({
                time_period: simpleDate,
                name: cleanDate,
                month: month,
                INCOME: 0,
                TRANSFER_IN: 0,
                TRANSFER_OUT: 0,
                LOAN_PAYMENTS: 0,
                BANK_FEES: 0,
                ENTERTAINMENT: 0,
                FOOD_AND_DRINK: 0,
                GENERAL_MERCHANDISE: 0,
                HOME_IMPROVEMENT: 0,
                MEDICAL: 0,
                PERSONAL_CARE: 0,
                GENERAL_SERVICES: 0,
                GOVERNMENT_AND_NON_PROFIT: 0,
                TRANSPORTATION: 0,
                TRAVEL: 0,
                RENT_AND_UTILITIES: 0,
                total: 0,
                startDate: cleanDate,
                no_transactions: false
            })
        }
        if (!months[year].includes(month)) months[year].push(month);
        if (!categories.includes(initialList[i].category)) categories.push(initialList[i].category)
        const index = final.findIndex((e:any )=> e.time_period === simpleDate);
        if (index !== -1) {
            final[index][initialList[i].category_name] += initialList[i].amount;
            final[index].total += initialList[i].amount;
        }
    }

    /*
Income: 0,
                "Transfer In": 0,
                "Transfer Out": 0,
                "Loan Payments": 0,
                "Bank Fees": 0,
                "Entertainment": 0,
                "Food And Drink": 0,
                "General Merchandise": 0,
                "Home Improvement": 0,
                "Medical": 0,
                "Personal Care": 0,
                "General Services": 0,
                "Government And Non Profit": 0,
                "Transportation": 0,
                "Travel": 0,
                "Rent And Utilities": 0,
*/

    return {
        final: renameAndDeleteFinalRes(final),
        categories: categories,
        months: months
    }
}

const colorsTreeMap: any = {
    January: '#00FFFF',
    February: '#000000',
    March: '#0000FF',
    April: '#FF00FF',
    May: '#808080',
    June: '#008000',
    July: '#00FF00',
    August: '#800000',
    September: '#000080',
    October: '#808000',
    November: '#800080',
    December: '#FF0000',
}

const getPieChartData = (transactionsResponse: any) => {
    let elements = [
        { name: 'Income', value: 0, fill: '#607d8b' },
        { name: 'Transfer In', value: 0, fill: '#ff5722' },
        { name: 'Transfer Out', value: 0, fill: '#795548' },
        { name: 'Loan Payments', value: 0, fill: '#9e9e9e' },
        { name: 'Bank Fees', value: 0, fill: '#ffeb3b' },
        { name: 'Entertainment', value: 0, fill: '#ffc107' },
        { name: 'Food And Drink', value: 0, fill: '#00FF00' },
        { name: 'General Merchandise', value: 0, fill: '#ff9800' },
        { name: 'Home Improvement', value: 0, fill: '#4caf50' },
        { name: 'Medical', value: 0, fill: '#8bc34a' },
        { name: 'Personal Care', value: 0, fill: '#cddc39' },
        { name: 'General Services', value: 0, fill: '#009688' },
        { name: 'Government And Non-Profit', value: 0, fill: '#00bcd4' },
        { name: 'Transportation', value: 0, fill: '#03a9f4' },
        { name: 'Travel', value: 0, fill: '#673ab7' },
        { name: 'Rent And Utilities', value: 0, fill: '#3f51b5' },
    ]

    transactionsResponse.forEach((transaction: any) => {
        elements.forEach((element: any) => {
            if (makeFirstLetterUpperCase(transaction.personal_finance_category.primary) === element.name) {
                const amount = roundUnevenNumbers(transaction.amount);
                element.value += Math.abs(amount);
            }
        })
    })

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].value === 0) {
            elements.splice(i, 1);
            i--;
        }
    }
    for (let i = 0; i < elements.length; i++) {
        elements[i].value = roundUnevenNumbers(elements[i].value);
    }
    return elements;
}

const client = new PlaidApi(configuration);

const API_URL = globalvars().API_URL;

router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const queryType = req.query.queryType;
    const accessTokens = await getAccessTokens(user_id);

    let finalResponse;
    let finalStatus;
    let requestIds = new Array();
    for (let i = 0; i < accessTokens.length; i++) {
        try {

            const request: InstanceType<typeof TransactionsGetRequest> = {
                access_token: accessTokens[i],
                start_date: startDate,
                end_date: endDate,
                options: {
                    include_personal_finance_category: true,
                },
            };
            const response: TransactionsGetResponse = await client.transactionsGet(request);
            const transactionsResponse = response.data.transactions;
            requestIds.push(response.data.request_id);
            if (queryType === 'lineChart') {
                finalResponse = {
                    final: await newGetLineChartData(response).final,
                    categories: await newGetLineChartData(response).categories,
                    months: await newGetLineChartData(response).months,
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/visuals",
                        method: "GET",
                    },
                };
                finalStatus = 200;
            }
            else if (queryType === 'barChart') {
                finalResponse = {
                    final: await newGetLineChartData(response).final,
                    categories: await newGetLineChartData(response).categories,
                    months: await newGetLineChartData(response).months,
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/visuals",
                        method: "GET",
                    },
                  };
                  finalStatus = 200;
            }
            else if (queryType === 'pieChart') {
                finalResponse = {
                    final: getPieChartData(transactionsResponse),
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/visuals",
                        method: "GET",
                    },
                  };
                finalStatus = 200;
            }
            else if (queryType === 'treemap') {
                const getTreemapData = async (transactionsResponse: any) => {
                    let treeMapData = new Array();
                    transactionsResponse.forEach((transaction: any) => {
                        if (transaction.merchant_name) {
                            const amount = roundUnevenNumbers(transaction.amount);
                            const category = makeFirstLetterUpperCase(transaction.personal_finance_category.primary);
                        }
                    });
                    return treeMapData;
                };

                
                finalStatus = 200;
            }

        } catch (error) {
            console.error('inside catch');
            console.error(error);
            finalStatus = 400;
            finalResponse = error;
        };
    }

    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;