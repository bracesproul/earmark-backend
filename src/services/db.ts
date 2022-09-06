export {};
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('../../secrets/firebase-service-account.json');
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

interface IUserCreationData {
    email:string;
    phoneNumber:string;
    password:string;
    displayName:string;
}

interface IUserInfo {
    address_city:string;
    address_state:string;
    address_street:string;
    address_street2:string;
    address_zip:string;
    date_of_birth:string;
    email:string;
    first_name:string;
    last_name:string;
    full_name:string;
    phone_number:string;
    userId:string;
}

interface IAccessTokenData {
    access_token:string;
    account_data:string[];
    account_ids:string[];
    account_types:string[];
    available_products:string[];
    institution_id:string;
    institution_name:string;
    item_id:string;
    user_id:string;
    transactions_available:any
}



const createUser = async (userCreationData:IUserCreationData, userInfoData:IUserInfo) => {
    getAuth()
        .createUser({
            email: userCreationData.email,
            emailVerified: false,
            phoneNumber: userCreationData.phoneNumber,
            password: userCreationData.password,
            displayName: userCreationData.displayName,
            photoURL: null,
            disabled: false,
        })
        .then((userRecord:any) => {
            console.log('Successfully created new user:', userRecord.uid);
            addUserToDB(userInfoData, userRecord.uid);
        })
        .catch((error:any) => {
            console.log('Error creating new user:', error);
        });
}

const addUserToDB = async (data:IUserInfo, user_id:string) => {
    const userRef = db.collection('users').doc(user_id);
    try {
        await userRef.set({
            data,
            user_id: user_id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return {
            error: false,
            errorMessage: '',
            message: 'successfully added user to db'
        }
    } catch (error) {
        console.error(error);
        return {
            error: true,
            errorMessage: error,
            message: 'error adding user to db'
        }
    }
}

const updateUser = async (userId:string, data:IUserInfo) => {
    const userRef = db.collection('users').doc(userId);
    try {
        await userRef.set({
            data,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return {
            error: false,
            errorMessage: '',
            message: 'successfully added user to db'
        }
    } catch (error) {
        console.error(error);
        return {
            error: true,
            errorMessage: error,
            message: 'error updating user in db'
        }
    }

}

const addAccessTokenToDB = async (userId:string, accessToken:string, data:IAccessTokenData) => {
    const userRef = db.collection('users').doc(userId).collection('access_tokens').doc(accessToken);
    try {
        await userRef.set({
            access_token: data.access_token,
            account_data: data.account_data,
            account_ids: data.account_ids,
            account_types: data.account_types,
            institution_name: data.institution_name,
            institution_id: data.institution_id,
            user_id: userId,
            transactions_available: data.transactions_available,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return {
            error: false,
            errorMessage: '',
            message: 'successfully added access token to db'
        }
    } catch (error) {
        return {
            error: true,
            errorMessage: error,
            message: 'error adding access token to DB'
        }
    }
}

const getAccessTokens = async (userId:string) => {
    const userRef = db.collection('users').doc(userId).collection('access_tokens');
    try {
        const accessTokenSnapshot = await userRef.get();
        return accessTokenSnapshot.docs.map((doc:any) => doc.data().access_token);
    } catch (error) {
        console.error(error);
        return {
            error: true,
            errorMessage: error,
            message: 'error getting access tokens'
        }
    }
}

const getAccessTokenByInstitution = async (userId:string, institutionId:string) => {
    const userRef = db.collection('users').doc(userId).collection('access_tokens');
    try {
        const accessTokenSnapshot = await userRef.where('institution_id', '==', institutionId).get();
        return accessTokenSnapshot.docs.map((doc:any) => {
            return {
                accessToken: doc.data().access_token,
                accountInfo: {
                    access_token: doc.data().access_token,
                    account_data: doc.data().account_data,
                    institution_name: doc.data().institution_name,
                }
            }
        });
    } catch (error) {
        console.error(error);
        return {
            error: true,
            errorMessage: error,
            message: 'error getting access tokens'
        }
    }
}

const getAccessTokensRecurring = async (userId:string) => {
    const userRef = db.collection('users').doc(userId).collection('access_tokens');
    try {
        const accessTokenSnapshot = await userRef.where("account_types", "array-contains-any", ['savings', 'checking', 'credit card']).get();
        return accessTokenSnapshot.docs.map((doc:any) => doc.data().access_token);
    } catch (error) {
        console.error(error);
        return {
            error: true,
            errorMessage: error,
            message: 'error getting access tokens'
        }
    }
}


module.exports = {
    createUser,
    addAccessTokenToDB,
    getAccessTokens,
    getAccessTokenByInstitution,
    getAccessTokensRecurring,
    updateUser,
    addUserToDB
}

/*
* allAccountInfo: {
*   getAccessTokens,
* }
* allTransactions: {
* getAccessTokensTransactions
* }
* allTransactionsByCategory: {
* getAccessTokensTransactions
* }
* dashboard: {
* getAccessTokensTransactions
* }
* getDynamicTransactions: {
* getDynamicTransactions
* }
* getTransactionsByAccount: {
* getAccessTokensTransactions
* }
* ptokenExchange: {
* addAccessTokens
* }
* recurring: {
* getAccessTokensTransactions
* }
* visuals: {
* getAccessTokensTransactions
* }
*/