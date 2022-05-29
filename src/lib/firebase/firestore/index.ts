const admin = require('firebase-admin');
const serviceAccount = require('../../../../secrets/firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const adminDb = admin.firestore();

const updateUser = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { data } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const res = await userRef.set(data, { merge: true });
        console.log('doc successfully written', await res);
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    }
};

const getAccessTokens = async (user_id: string) => {
    try {
        let accessTokens = new Array;
        const accessTokensRef = adminDb.collection('users').doc(user_id).collection('access_tokens');
        const snapshot = await accessTokensRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
        return;
        }
        snapshot.forEach((doc:any) => {
            accessTokens.push(doc.data().access_token);
        });
        Promise.resolve(accessTokens);
        return accessTokens;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const getAccessTokensTransactions = async (user_id: string) => {
    try {
        let accessTokens = new Array;
        const accessTokensRef = adminDb.collection('users').doc(user_id).collection('access_tokens').where("available_products", "array-contains", "transactions");
        const snapshot = await accessTokensRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
        return;
        }
        snapshot.forEach((doc:any) => {
            accessTokens.push(doc.data().access_token);
        });
        Promise.resolve(accessTokens);
        return accessTokens;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const getAccessTokensInstitution = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { institution_id } = parsedObject;
    try {
        let accessTokens = new String;
        const accessTokensRef = adminDb.collection('users').doc(user_id).collection('access_tokens').where("institution_id", "==", institution_id);
        const snapshot = await accessTokensRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
        return;
        }
        snapshot.forEach((doc:any) => {
            accessTokens = doc.data().access_token;
        });
        Promise.resolve(accessTokens);
        return accessTokens;
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const createUser = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { access_token, item_id, institution_Id, available_products } = parsedObject;
    try {
        const docData = {
            access_token: access_token,
            item_id: item_id,
            user_id: user_id,
            institution_id: institution_Id,
            available_products: available_products,
        }
        const res = await adminDb.collection('users').doc(user_id).set(docData);
        Promise.resolve();
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const updateAccountElement = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { element, edit } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const res = await userRef.update({ [element]: edit });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const addSecurityChangelog = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { changeType } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            securityChangelog: [
                {change: changeType, date: new Date().toLocaleString(), user_id: user_id},
            ]
        };
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
}

const createUserEntry = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { phoneNumber, email, firstName, lastName } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            user_id: user_id,
            phone_number: phoneNumber,
            email: email,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          }
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const updateCategory = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { category, transactionObjects } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id).collection('categories').doc(category);
        const data = {
            transactions: transactionObjects,
        }
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
}

const addBillingPlan = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { plan } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            billing_info: {
              billing_account_name: "",
              billing_address: {
                address_city: "",
                address_state: "",
                address_street: "",
                address_zip: "",
              },
              billing_id: "",
              billing_plan: plan,
              card_exp_date: "",
              card_last_four: "",
              card_type: "",
              first_name: "",
              last_name: "",
            },
          }
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const setupUserAccount = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { dob, street, street2, city, state, zip, userId } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            date_of_birth: dob,
            address_street: street,
            address_street2: street2,
            address_city: city,
            address_state: state,
            address_zip: zip,
            userId: userId,
            setup: true,
        };
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const updateUserSecurity = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { firstName, lastName, phone, email } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            phone_number: phone,
            email: email,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          }
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const updateUserAddress = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    const { addressStreet, addressStreet2, addressCity, addressState, addressZip } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            address_street: addressStreet,
            address_street2: addressStreet2,
            address_city: addressCity,
            address_state: addressState,
            address_zip: addressZip,
          }
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const updateUserPersonal = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    console.log(parsedObject);
    const { date_of_birth, username } = parsedObject;
    try {
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            date_of_birth: date_of_birth,
            userId: username,
          }
        const res = await userRef.set(data, { merge: true });
        Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const testFunc = async (user_id: string, params: any) => {
    const object = JSON.parse(params);
    console.log('object', object);
    const { param1, param2 } = object;
    console.log('params1', param1);
    console.log('params2', param2);
    return 'YELLO';
};

// institution
interface IFirestore {
    updateUser: (user_id: string, params: any) => Promise<void>;
    getAccessTokens: (userId: string) => Promise<void>;
    getAccessTokensTransactions: (userId: string) => Promise<void>;
    getAccessTokensInstitution: (user_id: string, params: any) => Promise<void>;
    createUser: (user_id: string, params: any) => Promise<void>;
    updateAccountElement: (user_id: string, params: any) => Promise<void>;
    addSecurityChangelog: (user_id: string, params: any) => Promise<void>;
    createUserEntry: (user_id: string, params: any) => Promise<void>;
    updateCategory: (user_id: string, params: any) => Promise<void>;
    addBillingPlan: (user_id: string, params: any) => Promise<void>;
    setupUserAccount: (user_id: string, params: any) => Promise<void>;
    testFunc: (user_id: string, params: any) => Promise<void>;
    updateUserSecurity: (user_id: string, params: any) => Promise<void>;
    updateUserAddress: (user_id: string, params: any) => Promise<void>;
    updateUserPersonal: (user_id: string, params: any) => Promise<void>;
}

module.exports = {
    updateUser, 
    getAccessTokens,
    getAccessTokensTransactions,
    getAccessTokensInstitution,
    updateAccountElement,
    addSecurityChangelog,
    createUserEntry,
    updateCategory,
    addBillingPlan,
    setupUserAccount,
    testFunc,
    updateUserSecurity,
    updateUserAddress,
    updateUserPersonal,
};