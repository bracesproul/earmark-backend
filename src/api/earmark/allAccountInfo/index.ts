/* eslint-disable */
/* @ts-ignore */
// TODO: intergrate new acc get function, change frontend to be compatible with new function
export {};
const express = require('express');
const router = express.Router();
const globalVars = require('../../../lib/globalVars');
const updateFirestore = require('../../../lib/firebase/firestore/index');
const { getAccessTokens } = require('../../../services/db');
const { 
    Configuration, 
    PlaidApi, 
    PlaidEnvironments,
    AuthGetRequest,
    InstitutionsGetByIdRequest
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

const API_URL = globalVars().API_URL;

router.get('/', async (req: any, res: any) => {
    const user_id = req.query.user_id;
    let finalResponse;
    let finalStatus;
    let requestId;
    let accountsFormatted = new Array;
    let allAccounts = new Array;

    // firebase query code
    // const accessTokens = await updateFirestore.getAccessTokens(user_id);
    let accessTokens = await getAccessTokens(user_id)

    // end firebase query code

    try {
        console.log('inside try', accessTokens);
        for (let i = 0; i < accessTokens.length; i++) {
            console.log(accessTokens[i]);
            const request: InstanceType<typeof AuthGetRequest> = {
                access_token: accessTokens[i],
            };
            const response = await client.authGet(request);
            let finalHere = new Array;
            const numbers = response.data.numbers;
            const accounts = response.data.accounts;
            const item = response.data.item

            response.data.accounts.forEach((accId: any) => {
                const accountId = accId.account_id;
                let accNum = new String;
                let wireRouting = new String;
                let routing = new String;
                numbers.ach.forEach((number: any) => {
                    if (number.account_id === accountId) {
                        accNum = number.account
                        wireRouting = number.wire_routing
                        routing = number.routing
                    }
                });
                accounts.forEach((account: any) => {
                    let accType = account.subtype.charAt(0).toUpperCase() + account.subtype.slice(1);
                    if (account.account_id === accountId) {
                        finalHere.push({
                            col1: account.name,
                            col2: `$${account.balances.current}`,
                            col3: accType,
                            col4: accNum,
                            col5: routing,
                            col6: wireRouting,
                            id: account.account_id,
                            ins_id: item.institution_id,
                        });
                    }
                })

            });
            finalHere.forEach((finalAccount: any) => {
                allAccounts.push(finalAccount);
            })

            requestId = response.data.request_id;
        }
        finalResponse = {
            accounts: allAccounts,
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                user_id: user_id,
                requestTime: new Date().toLocaleString(),
                requestIds: requestId,
                nextApiUrl: "/api/earmark/allAccountInfo",
                backendApiUrl: "/api/accountsGet",
                method: "GET",
            },
        };
        finalStatus = 200;
    } catch (error) {
        console.error(error);
        finalResponse = {
            stack: error.stack,
            headers: error.headers,
            statusCode: error.statusCode,
            message: "error, try again",
            required_params: [
                {id: "user_id", type: "string", description: "users unique id"},
            ],
            metaData: {
                error: error,
                requestTime: new Date().toLocaleString(),
                nextApiUrl: "/api/earmark/allAccountInfo",
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

async function getAccountInfo(accessTokens:string[]) {
    try {
        let accounts: any = [];
        for (let i = 0; i < accessTokens.length; i++) {
            // makes request to plaid for account info
            const authRequest: InstanceType<typeof AuthGetRequest> = {
                access_token: accessTokens[i],
            };
            const authResponse = await client.authGet(authRequest);
            // makes request to plaid for institution info (only for institution name)
            const InsRequest: InstanceType<typeof InstitutionsGetByIdRequest> = {
                institution_id: authResponse.data.item.institution_id,
                country_codes: ['US'],
            };
            const InsResponse = await client.institutionsGetById(InsRequest);
            const institutionName = InsResponse.data.institution.name;

            // loops through authResponse and pushes account info to accounts array
            authResponse.data.accounts.map((account: any) => {
                accounts.push({
                    institution_name: institutionName,
                    account_id: account.account_id,
                    account_name: account.name,
                    official_name: account.official_name,
                    subtype: account.subtype,
                    balance: account.balances.available,
                    mask: account.mask,
                    account_numbers: getAccountNumbers(authResponse.data.numbers.ach, account.account_id),
                })
            })
        }
        return accounts;
    } catch (error) {
        console.error(error);
    }
}

function getAccountNumbers(data:any, account_id:string) {
    let account_numbers:any;
    try {
        data.forEach((number: any) => {
            if (account_id == number.account_id) {
                account_numbers = { account_number: number.account, routing_number: number.wire_routing};
            }
        })
        return account_numbers;
    } catch (error) {
        console.error(error);
        return null;
    }
}


module.exports = router;