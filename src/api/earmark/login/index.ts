export {};
const dotenv = require('dotenv');
dotenv.config();
const { sendWebhook } = require('../../../lib/webhooks');
const express = require('express');
const router = express.Router();


router.post('/', async (req: any, res: any, next: any) => {
    const user_email = req.query.user_email;
    const user_id = req.query.user_id;
    try {
        console.log(req)
        sendWebhook(req.body.user_email, req.body.user_id);
        await res.status(200)
        await res.send('success');
        await res.end();
    } catch (error) {
        console.error(error);
        await res.status(400)
        await res.send('error sending login webhook');
        await res.end();
    }
});

module.exports = router;