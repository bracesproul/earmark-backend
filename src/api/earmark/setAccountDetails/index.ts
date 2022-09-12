export {};
const dotenv = require('dotenv');
dotenv.config();
const { updateAccountProfileDetails, updateAccountSecurityDetails, updateUserProfileFirebase } = require('../../../lib/firebase/firestore');
const express = require('express');
const router = express.Router();


router.post('/', async (req: any, res: any, next: any) => {
    const user_id = req.query.user_id;
    const data = req.query.data;
    const settingsType = req.query.settingsType;


    try {
        switch (settingsType) {
            case 'profile': {
                updateAccountProfileDetails(user_id, data)
                    .then( async () => {
                        await res.status(200)
                        await res.send('success');
                        await res.end();
                    })
            }
                break;
            case 'security': {
                const firebaseUpdateRes = await updateUserProfileFirebase(user_id, data);
                updateAccountSecurityDetails(user_id, data)
                    .then( async () => {
                        if (firebaseUpdateRes.error === 'Email already exists') {
                            await res.status(400)
                            await res.json({
                                error: firebaseUpdateRes.error
                            });
                            await res.end();
                            return;
                        } else if (firebaseUpdateRes.error === 'error') {
                            await res.status(400)
                            await res.json({
                                error: firebaseUpdateRes.error
                            });
                            await res.end();
                            return;
                        }
                        await res.status(200)
                        await res.send('success');
                        await res.end();
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