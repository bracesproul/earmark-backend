export {};
const dotenv = require('dotenv');
dotenv.config();
const { getAccountProfileDetails, getAccountSecurityDetails } = require('../../../lib/firebase/firestore');
const express = require('express');
const router = express.Router();


router.get('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const settingsType = req.query.settingsType;
    try {
        switch (settingsType) {
            case 'profile': {
                getAccountProfileDetails(user_id)
                    .then( async (data:any) => {
                        await res.status(200)
                        await res.send(data);
                        await res.end();
                    })
            }
                break;
            case 'security': {
                getAccountSecurityDetails(user_id)
                    .then( async (data:any) => {
                        await res.status(200)
                        await res.send(data);
                        await res.end();
                    })
            }
                break;
        }

    } catch (error) {
        await res.status(400)
        await res.send('error getting account details');
        await res.end();
    }
});

module.exports = router;