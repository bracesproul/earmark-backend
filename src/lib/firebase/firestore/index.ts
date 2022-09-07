const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth, UserRecord } = require('firebase-admin/auth');
const { initializeApp, cert } = require('firebase-admin/app');

const serviceAccount = require('../../../../secrets/firebase-service-account.json');
initializeApp({
    credential: cert(serviceAccount)
});
const adminDb = getFirestore();

const addAccessTokenToDB = async (userId:string, accessToken:string, data:any) => {
    const userRef = adminDb.collection('users').doc(userId).collection('access_tokens').doc(accessToken);
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

const getAccessTokensRecurringTransactions = async (user_id: string) => {
    try {
        let accessTokens = new Array;
        let account_ids = new Array;
        const accessTokensRef = adminDb.collection('users').doc(user_id).collection('access_tokens').where("account_types", "array-contains-any", ['savings', 'checking', 'credit card']);
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

const getAccountIdsRecurring = async (user_id: string) => {
    try {
        let account_ids = new Array;
        const accessTokensRef = adminDb.collection('users').doc(user_id).collection('access_tokens').where("account_types", "array-contains-any", ['savings', 'checking', 'credit card']);
        const snapshot = await accessTokensRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
        return;
        }
        snapshot.forEach((doc:any) => {
            account_ids.push(doc.data().account_ids);
        });
        Promise.resolve(account_ids);
        return account_ids;
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

const addAccessTokens = async (user_id: string, params: any) => {
    const { access_token, item_id, institution_id, available_products, account_data, account_types, account_ids, institution_name } = params;
    try {
        const docData = {
            access_token: access_token,
            item_id: item_id,
            user_id: user_id,
            institution_id: institution_id,
            available_products: available_products,
            account_data: account_data,
            account_types: account_types,
            account_ids: account_ids,
            institution_name: institution_name,
        }
        const res = await adminDb.collection('users').doc(user_id).collection('access_tokens').doc(item_id).set(docData, { merge: true });
        Promise.resolve(res);
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
    const { firstName, lastName, phone, email, password } = parsedObject;
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
        getAuth()
        .updateUser(user_id, {
            email: email,
            phoneNumber: `+1${phone}`,
            password: password,
            displayName: `${firstName} ${lastName}`,
        })
        .then((userRecord:any) => {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch((error:any) => {
            console.error('Error updating user:', error);
        });
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

const deleteAccount = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    try {
        const res = await adminDb.collection('users').doc(user_id).delete();
        getAuth()
        .deleteUser(user_id)
        .then(() => {
            console.log('Successfully deleted user');
        })
        .catch((error: any) => {
            console.error('Error deleting user:', error);
        });
        Promise.resolve(res);
        return 'user deleted';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const deleteAllInstitutions = async (user_id: string, params: any) => {
    const parsedObject = JSON.parse(params);
    try {
        const institutionsRef = adminDb.collection('users').doc(user_id).collection('access_tokens')
        const res = await institutionsRef.get()
        res.forEach((doc: any) => {
            doc.delete()
        });
        await Promise.resolve(res);
        return 'success';
    } catch (error) {
        console.error(error);
        Promise.reject(error);
        return error;
    };
};

const getDynamicTransactions = async (user_id: string, page_id: string) => {
        try {
            let accountInfo: any = new Array();
            let accessTokens: string = '';
            const accessTokensRef = adminDb.collection('users').doc(user_id).collection('access_tokens').where("institution_id", '==', page_id);
            const snapshot = await accessTokensRef.get();
            if (snapshot.empty) {
                console.error('No matching documents.');
            return;
            }
            snapshot.forEach((doc:any) => {
                accessTokens = doc.data().access_token;
                accountInfo = {
                    access_token: doc.data().access_token,
                    account_data: doc.data().account_data,
                    institution_name: doc.data().institution_name,
                }
            });
            Promise.resolve(accessTokens);
            return {accessTokens, accountInfo};
        } catch (error) {
            console.error(error);
            Promise.reject(error);
            return error;
        };
};

function getAccountProfileDetails(user_id: string) {
    return new Promise((resolve, reject) => {
        const userRef = adminDb.collection('users').doc(user_id);
        userRef.get().then((doc: any) => {
            if (doc.exists) {
                const data = doc.data();
                resolve({
                    firstName: data.first_name,
                    lastName: data.last_name,
                    username: data.userId,
                    phone: data.phone_number,
                    address1: data.address_street,
                    address2: data.address_street2,
                    city: data.address_city,
                    state: data.address_state,
                    zip: data.address_zip,
                })
            } else {
                reject('No such document!');
            }
        }).catch((error: any) => {
            reject(error);
        });
    });
}

function getAccountSecurityDetails(user_id: string) {
    return new Promise((resolve, reject) => {
        const userRef = adminDb.collection('users').doc(user_id);
        userRef.get().then((doc: any) => {
            if (doc.exists) {
                const data = doc.data();
                resolve({
                    email: data.email,
                    birthday: data.date_of_birth,
                    username: data.userId,
                    phone: data.phone_number,
                    address1: data.address_street,
                    address2: data.address_street2,
                    city: data.address_city,
                    state: data.address_state,
                    zip: data.address_zip,
                })
            } else {
                reject('No such document!');
            }
        }).catch((error: any) => {
            reject(error);
        });
    });
}

function updateAccountProfileDetails(user_id: string, params: any) {
    return new Promise((resolve, reject) => {
        const parsedObject = JSON.parse(params);
        const { firstName, lastName, username, phone, address1, address2, city, state, zip } = parsedObject;
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            first_name: firstName,
            last_name: lastName,
            userId: username,
            phone_number: phone,
            address_street: address1,
            address_street2: address2,
            address_city: city,
            address_state: state,
            address_zip: zip,
          }
        userRef.set(data, { merge: true }).then(() => {
            resolve('success');
        }).catch((error: any) => {
            reject(error);
        });
    });
}

function updateAccountSecurityDetails(user_id: string, params: any) {
    return new Promise((resolve, reject) => {
        const parsedObject = JSON.parse(params);
        const { email, birthday } = parsedObject;
        const userRef = adminDb.collection('users').doc(user_id);
        const data = {
            email: email,
            date_of_birth: birthday,
          }
        userRef.set(data, { merge: true }).then(() => {
            resolve('success');
        }).catch((error: any) => {
            reject(error);
        });
    });
}

function updateUserProfileFirebase(user_id: string, params: any): any {
    const parsedObject = JSON.parse(params);
    const { email, password } = parsedObject;
    let res = {
        status: '',
        error: '',
    }
    if (password !== '') {
        getAuth()
            .updateUser(user_id, {
                email: email,
                password: password,
            })
            .then((userRecord:any) => {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log('Successfully updated user', userRecord.toJSON());
                res.status = 'success';
            })
            .catch((error:any) => {
                if (error.code === 'auth/email-already-exists') {
                    res.status = 'error';
                    res.error = 'Email already exists';
                } else {
                    res.status = 'error';
                    res.error = 'error';
                }
            });
    } else {
        getAuth()
            .updateUser(user_id, {
                email: email,
            })
            .then((userRecord:any) => {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log('Successfully updated user', userRecord.toJSON());
                res.status = 'success';
            })
            .catch((error:any) => {
                if (error.code === 'auth/email-already-exists') {
                    res.status = 'error';
                    res.error = 'Email already exists';
                } else {
                    res.status = 'error';
                    res.error = 'error';
                }
            });
    }
    return res;
}

const testFunc = async (user_id: string, params: any) => {
    const object = JSON.parse(params);
    const { param1, param2 } = object;
    return {user_id: user_id, param1: param1, param2: param2};
};

// institution
interface IFirestore {
    updateUser: (user_id: string, params: any) => Promise<void>;
    getAccessTokens: (userId: string) => Promise<void>;
    getAccessTokensTransactions: (userId: string) => Promise<void>;
    getAccessTokensRecurringTransactions: (userId: string) => Promise<void>;
    getAccountIdsRecurring: (userId: string) => Promise<void>;
    getAccessTokensInstitution: (user_id: string, params: any) => Promise<void>;
    addAccessTokens: (user_id: string, params: any) => Promise<void>;
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
    deleteAccount: (user_id: string, params: any) => Promise<void>;
    deleteAllInstitutions: (user_id: string, params: any) => Promise<void>;
    getDynamicTransactions: (user_id: string, page_id: string) => Promise<void>;
    addAccessTokenToDB: (userId:string, accessToken:string, data:any) => Promise<void>
    getAccountProfileDetails: (user_id: string) => Promise<void>;
    getAccountSecurityDetails: (user_id: string) => Promise<void>;
    updateAccountProfileDetails: (user_id: string, params: any) => Promise<void>;
    updateAccountSecurityDetails: (user_id: string, params: any) => Promise<void>;
    updateUserProfileFirebase: (user_id: string, params: any) => Promise<any>;
}

export {};
module.exports = {
    updateUser, 
    getAccessTokens,
    getAccessTokensTransactions,
    getAccessTokensRecurringTransactions,
    getAccountIdsRecurring,
    getAccessTokensInstitution,
    addAccessTokens,
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
    deleteAccount,
    deleteAllInstitutions,
    getDynamicTransactions,
    addAccessTokenToDB,
    getAccountProfileDetails,
    getAccountSecurityDetails,
    updateAccountProfileDetails,
    updateAccountSecurityDetails,
    updateUserProfileFirebase
};
