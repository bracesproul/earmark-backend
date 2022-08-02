/* eslint-disable */
/*
  function createData(
    name: string,
    date: string,
    amount: number,
    category: string,
  ) 
*/

/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
import {TransactionsGetResponse} from "plaid";
dotenv.config();
const globalvars = require('../../../lib/globalVars');
const { getAccessTokensTransactions } = require('../../../lib/firebase/firestore');
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

const getCategoryColor = (category: string) => {
    const colors: any = {
        'Income': '#00FFFF',
        'Transfer In': '#000000',
        'Transfer Out': '#0000FF',
        'Loan Payments': '#FF00FF',
        'Bank Fees': '#808080',
        'Entertainment': '#008000',
        'Food And Drink': '#00FF00',
        'General Merchandise': '#800000',
        'Home Improvement': '#000080',
        'Medical': '#808000',
        'Personal Care': '#800080',
        'General Services': '#FF0000',
        'Government And Non-Profit': '#C0C0C0',
        'Transportation': '#008080',
        'Travel': '#FFFF00',
        'Rent And Utilities': '#AAFFC3',
    }
    return colors[category];
}

// Line chart function 
const getLineChartData = (transactionsResponse: any) => {
    if (transactionsResponse.length == 0) {
        return {
            lineChartData: {
                no_transactions: true
            },
            categoriesContainingData: {
                no_transactions: true
            },
            monthsContainingData: {
                no_transactions: true
            },
            finalData2: {
                no_transactions: true
            }
        }
    }
    let lineChartData = new Array();
    let monthsContainingData = new Array();
    let categoriesContainingData = new Array();
    for (let i = 0; i < 12; i++) {
        const monthsArray = getMonthDatesInArray('2022', `${i + 1}`);
        let month;
        if (i <= 9) {
            let startDate = '';
            const lastDay = monthsArray[monthsArray.length - 1].split('-')[2];
            let endDate = moment(`2022-0${i + 1}-${lastDay}`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            month = moment().month(`0${i}`).format('MMMM');
            let totalSpent = 0;
            let totalTransactions = 0;
            let transactionsByCategory: any = {
                'Income': 0,
                'Transfer In': 0,
                'Transfer Out': 0,
                'Loan Payments': 0,
                'Bank Fees': 0,
                'Entertainment': 0,
                'Food And Drink': 0,
                'General Merchandise': 0,
                'Home Improvement': 0,
                'Medical': 0,
                'Personal Care': 0,
                'General Services': 0,
                'Government And Non-Profit': 0,
                'Transportation': 0,
                'Travel': 0,
                'Rent And Utilities': 0,
                startDate: ''
            }

            transactionsResponse.forEach((transaction: any) => {
                const amount = Math.abs(transaction.amount);
                if (monthsArray.includes(transaction.date) && transaction.merchant_name !== undefined) {
                    totalSpent += amount;
                    totalTransactions++;
                    const categoryName: string = makeFirstLetterUpperCase(transaction.personal_finance_category.primary);
                    transactionsByCategory[categoryName] += amount;
                    startDate = transaction.date;
                }
            });

            lineChartData.push({
                name: `${month} | ${startDate}-${endDate}`,
                month: month,
                'Income': transactionsByCategory['Income'],
                'Transfer In': transactionsByCategory['Transfer In'],
                'Transfer Out': transactionsByCategory['Transfer Out'],
                'Loan Payments': transactionsByCategory['Loan Payments'],
                'Bank Fees': transactionsByCategory['Bank Fees'],
                'Entertainment': transactionsByCategory['Entertainment'],
                'Food And Drink': transactionsByCategory['Food And Drink'],
                'General Merchandise': transactionsByCategory['General Merchandise'],
                'Home Improvement': transactionsByCategory['Home Improvement'],
                'Medical': transactionsByCategory['Medical'],
                'Personal Care': transactionsByCategory['Personal Care'],
                'General Services': transactionsByCategory['General Services'],
                'Government And Non-Profit': transactionsByCategory['Government And Non-Profit'],
                'Transportation': transactionsByCategory['Transportation'],
                'Travel': transactionsByCategory['Travel'],
                'Rent And Utilities': transactionsByCategory['Rent And Utilities'],
                total: roundUnevenNumbers(totalSpent),
                startDate: transactionsByCategory.startDate,
                no_transactions: false
            })

        } else {
            let startDate = '';
            const lastDay = monthsArray[monthsArray.length - 1].split('-')[2];
            let endDate = moment(`2022-${i + 1}-${lastDay}`, 'YYYY-MM-DD').format("YYYY-MM-DD");
            month = moment().month(`${i}`).format('MMMM');
            let totalSpent = 0;
            let totalTransactions = 0;
            let transactionsByCategory: any = {
                'Income': 0,
                'Transfer In': 0,
                'Transfer Out': 0,
                'Loan Payments': 0,
                'Bank Fees': 0,
                'Entertainment': 0,
                'Food And Drink': 0,
                'General Merchandise': 0,
                'Home Improvement': 0,
                'Medical': 0,
                'Personal Care': 0,
                'General Services': 0,
                'Government And Non-Profit': 0,
                'Transportation': 0,
                'Travel': 0,
                'Rent And Utilities': 0,
                startDate: '',
                no_transactions: false
            };

            transactionsResponse.forEach((transaction: any) => {
                if (monthsArray.includes(transaction.date) && transaction.merchant_name !== undefined) {
                    const amount = Math.abs(transaction.amount);
                    totalSpent += amount;
                    totalTransactions++;
                    const categoryName: string = makeFirstLetterUpperCase(transaction.personal_finance_category.primary);
                    transactionsByCategory[categoryName] += amount;
                    startDate = transaction.date;
                }
            });

            lineChartData.push({
                name: `${month} | ${startDate}-${endDate}`,
                month: month,
                'Income': transactionsByCategory['Income'],
                'Transfer In': transactionsByCategory['Transfer In'],
                'Transfer Out': transactionsByCategory['Transfer Out'],
                'Loan Payments': transactionsByCategory['Loan Payments'],
                'Bank Fees': transactionsByCategory['Bank Fees'],
                'Entertainment': transactionsByCategory['Entertainment'],
                'Food And Drink': transactionsByCategory['Food And Drink'],
                'General Merchandise': transactionsByCategory['General Merchandise'],
                'Home Improvement': transactionsByCategory['Home Improvement'],
                'Medical': transactionsByCategory['Medical'],
                'Personal Care': transactionsByCategory['Personal Care'],
                'General Services': transactionsByCategory['General Services'],
                'Government And Non-Profit': transactionsByCategory['Government And Non-Profit'],
                'Transportation': transactionsByCategory['Transportation'],
                'Travel': transactionsByCategory['Travel'],
                'Rent And Utilities': transactionsByCategory['Rent And Utilities'],
                total: roundUnevenNumbers(totalSpent),
                startDate: transactionsByCategory.startDate,
            })

        }
    }

    let finalData2 = new Array();

    for (let i = 0; i < lineChartData.length; i++) {
        const month = lineChartData[i].month;
        const element = lineChartData[i];
        if (element.total !== 0) {
            monthsContainingData.push(month);
            if (element['Income'] !== 0 && !categoriesContainingData.includes('Income')) categoriesContainingData.push('Income');
            if (element['Transfer In'] !== 0 && !categoriesContainingData.includes('Transfer In')) categoriesContainingData.push('Transfer In');
            if (element['Transfer Out'] !== 0 && !categoriesContainingData.includes('Transfer Out')) categoriesContainingData.push('Transfer Out');
            if (element['Loan Payments'] !== 0 && !categoriesContainingData.includes('Loan Payments')) categoriesContainingData.push('Loan Payments');
            if (element['Bank Fees'] !== 0 && !categoriesContainingData.includes('Bank Fees')) categoriesContainingData.push('Bank Fees');
            if (element['Entertainment'] !== 0 && !categoriesContainingData.includes('Entertainment')) categoriesContainingData.push('Entertainment');
            if (element['Food And Drink'] !== 0 && !categoriesContainingData.includes('Food And Drink')) categoriesContainingData.push('Food And Drink');
            if (element['General Merchandise'] !== 0 && !categoriesContainingData.includes('General Merchandise')) categoriesContainingData.push('General Merchandise');
            if (element['Home Improvement'] !== 0 && !categoriesContainingData.includes('Home Improvement')) categoriesContainingData.push('Home Improvement');
            if (element['Medical'] !== 0 && !categoriesContainingData.includes('Medical')) categoriesContainingData.push('Medical');
            if (element['Personal Care'] !== 0 && !categoriesContainingData.includes('Personal Care')) categoriesContainingData.push('Personal Care');
            if (element['General Services'] !== 0 && !categoriesContainingData.includes('General Services')) categoriesContainingData.push('General Services');
            if (element['Government And Non-Profit'] !== 0 && !categoriesContainingData.includes('Government And Non-Profit')) categoriesContainingData.push('Government And Non-Profit');
            if (element['Transportation'] !== 0 && !categoriesContainingData.includes('Transportation')) categoriesContainingData.push('Transportation');
            if (element['Travel'] !== 0 && !categoriesContainingData.includes('Travel')) categoriesContainingData.push('Travel');
            if (element['Rent And Utilities'] !== 0 && !categoriesContainingData.includes('Rent And Utilities')) categoriesContainingData.push('Rent And Utilities');
            finalData2.push(lineChartData[i]);
        } 
    }
    return {lineChartData, categoriesContainingData, monthsContainingData, finalData2};
};

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
        return final.push({
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
        })
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
    return {
        final: final,
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
        { name: 'Income', value: 0, fill: '#00FFFF' },
        { name: 'Transfer In', value: 0, fill: '#000000' },
        { name: 'Transfer Out', value: 0, fill: '#0000FF' },
        { name: 'Loan Payments', value: 0, fill: '#FF00FF' },
        { name: 'Bank Fees', value: 0, fill: '#808080' },
        { name: 'Entertainment', value: 0, fill: '#008000' },
        { name: 'Food And Drink', value: 0, fill: '#00FF00' },
        { name: 'General Merchandise', value: 0, fill: '#800000' },
        { name: 'Home Improvement', value: 0, fill: '#000080' },
        { name: 'Medical', value: 0, fill: '#808000' },
        { name: 'Personal Care', value: 0, fill: '#800080' },
        { name: 'General Services', value: 0, fill: '#FF0000' },
        { name: 'Government And Non-Profit', value: 0, fill: '#C0C0C0' },
        { name: 'Transportation', value: 0, fill: '#008080' },
        { name: 'Travel', value: 0, fill: '#804000' },
        { name: 'Rent And Utilities', value: 0, fill: '#AAFFC3' },
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
    const accessTokens = await getAccessTokensTransactions(user_id);

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
                /*finalResponse = {
                    final: getLineChartData(transactionsResponse).finalData2,
                    lineChart: getLineChartData(transactionsResponse).lineChartData,
                    categories: getLineChartData(transactionsResponse).categoriesContainingData,
                    months: getLineChartData(transactionsResponse).monthsContainingData,
                    statusCode: 200,
                    statusMessage: "Success",
                    metaData: {
                        user_id: user_id,
                        requestTime: new Date().toLocaleString(),
                        requestIds: requestIds,
                        nextApiUrl: "/api/earmark/visuals",
                        method: "GET",
                    },
                  };*/
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