const { 
    collection, 
    query, 
    doc,
    getDocs, 
    setDoc,
    getDoc,
    where 
} = require("firebase/firestore"); 

const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');

initializeApp({
    apiKey: "AIzaSyCOnXDWQ369OM1lW0VC5FdYE19q1ug0_dc",
    authDomain: "earmark-8d1d3.firebaseapp.com",
    projectId: "earmark-8d1d3",
    storageBucket: "earmark-8d1d3.appspot.com",
    messagingSenderId: "46302537330",
    appId: "1:46302537330:web:403eac7f28d2a4868944eb",
    measurementId: "G-5474KY2MRV"
});
const db = getFirestore();

const readFirebase = async (user_id: string) => {
    const docRef = db.collection('users', user_id, 'accessTokens');
    const snapshotV = docRef.where("available_products", "array-contains", "transactions");
    const snapshot = await docRef.where('available_products', 'array-contains', 'transactions').get();

    const q = query(collection(db, "cities"), where("capital", "==", true));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc:any) => {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, " => ", doc.data());
    });
};

readFirebase('A9kohZbP3WRB1qdr3CqEd9GOLi33');


// Required schema for all txns frontend
/*
const transactionData = [
    { id: "ejradyRl9Mt9wKvjdow1fZDnvx4GwKi7wpx7E", col1: "McDonald's", col2: '2021-05-07', col3: "12.01", col4: "Food and Drink" },
    { id: "ejrat9wKvjdow1fZDnvx4GwKi7wpx7E", col1: 'Apple', col2: "2021-06-01", col3: "2,199.99", col4: "Electronics" },
    { id: "ejradyRl9Mt9wjwefjdow1fZDnvx4GwKi7wpx7E", col1: 'Safeway', col2: "2021-02-08", col3: "19.88", col4: "Grocries" },
    { id: "ejra43gMt9wKvjdow1fZDnvx4GwKi7wpx7E", col1: 'Oori', col2: "2021-08-22", col3: "8.75", col4: "Food and Drink" },
    { id: "ejradyRl9Mkfdow1fZDnvx4GwKi7wpx7E", col1: 'Target', col2: "2021-01-29", col3: "38.98", col4: "Shopping" },
    { id: "ejKvjdow1fZDnvx4GwKi7wpx7E", col1: 'Home Depot', col2: "2021-12-31", col3: "133.22", col4: "Home Goods" },
];
*/