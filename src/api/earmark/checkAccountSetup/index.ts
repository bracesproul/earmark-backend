export {};
const dotenv = require('dotenv');
dotenv.config();
const { accountSetupFinished, checkAccountSetupFinished } = require('../../../lib/firebase/firestore');
const express = require('express');
const router = express.Router();


router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const checkType = req.query.checkType;

    try {
        switch (checkType) {
            case 'set': {
                accountSetupFinished(user_id)
                    .then( async () => {
                        await res.status(200)
                        await res.send('success');
                        await res.end();
                    })
            }
                break;
            case 'check': {
                checkAccountSetupFinished(user_id).then( async (response:any) => {
                    if (response) {
                        console.log('account_setup_finished', response);
                        await res.status(200)
                        await res.send('success');
                        await res.end();
                    } else {
                        await res.status(200)
                        await res.send('not setup');
                        await res.end();
                    }
                })
            }
                break;
        }
    } catch (error) {
        console.error(error);
        await res.status(400)
        await res.send('error updating account details');
        await res.end();
    }
});

module.exports = router;