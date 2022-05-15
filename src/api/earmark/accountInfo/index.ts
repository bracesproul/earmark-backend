/* eslint-disable */
import dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const router = express.Router();

router.get('/', async (req: any, res: any) => {
    try {
        const success_message = {
            message: 'not setup yet',
            statusCode: 200,
            statusMessage: "Success",
            metaData: {
                requestTime: new Date().toLocaleString(),
                nextApiUrl: "/api/earmark/accountInfo",
                backendApiUrl: "/api/accountInfo",
                method: "GET",
            },
        };
        await res.status(200);
        await res.send(success_message);
        await res.end();
    } catch (error) {
        res.status(400);
        res.send(error);
        res.end();
    };
});

module.exports = router;