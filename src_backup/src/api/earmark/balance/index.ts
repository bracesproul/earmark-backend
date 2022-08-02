/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

router.get('/', async (req: any, res: any, next: any) => {
    try {
        const success_message = {
            message: 'not setup yet',
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                requestTime: new Date().toLocaleString(),
                nextApiUrl: "/api/earmark/balance",
                backendApiUrl: "/api/balance",
                method: "GET",
            },
        };
        res.status(200);
        res.send(success_message);
        res.end();
    } catch (error) {
        res.status(400);
        res.send(error);
        res.end();
    };
});

module.exports = router;