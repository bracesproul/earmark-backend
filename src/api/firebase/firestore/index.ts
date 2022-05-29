/* eslint-disable */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const globalVars = require('../../../lib/globalVars');
import { paramErrorHandling } from '../../../lib/Errors/paramErrorHandling'
const updateFirestore = require('../../../lib/firebase/firestore/');
const express = require('express');
const router = express.Router();

const API_URL = globalVars().API_URL;

router.post('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const params = req.query.params;
    const func = req.query.func;

    console.log('query', req.query);

    let finalResponse;
    let finalStatus = 400;
        try {
            let response;
            switch (func) {
                case "updateAccountElement":
                    response = await updateFirestore.updateAccountElement(user_id, params);
                    break;
                case "addSecurityChangelog":
                    response = await updateFirestore.addSecurityChangelog(user_id, params);
                    break;
                case "createUserEntry":
                    response = await updateFirestore.createUserEntry(user_id, params);
                    break;
                case "updateCategory":
                    response = await updateFirestore.updateCategory(user_id, params);
                    break;
                case "addBillingPlan":
                    response = await updateFirestore.addBillingPlan(user_id, params);
                    break;
                case "setupUserAccount":
                    response = await updateFirestore.setupUserAccount(user_id, params);
                    break;
                case "testFunc":
                    response = await updateFirestore.testFunc(user_id, params);
                    break;
                case "updateUserSecurity":
                    response = await updateFirestore.updateUserSecurity(user_id, params);
                    break;
                case "updateUserAddress":
                    response = await updateFirestore.updateUserAddress(user_id, params);
                    break;
                case "updateUserPersonal":
                    response = await updateFirestore.updateUserPersonal(user_id, params);
                    break;
            };
            finalResponse = {
                response: response
            };
            finalStatus = 200;
        } catch (error) {
            finalStatus = 400;
            finalResponse = error;
        };
    await res.status(finalStatus);
    await res.send(finalResponse);
    await res.end();
});

module.exports = router;