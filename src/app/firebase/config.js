import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app)

function setData(customName, data) {
    const db = getDatabase()
    const reference = ref(db, customName)

    set(reference, data)
        .then(() => {
            console.log("Data saved successfully!");
        })
        .catch((error) => {
            console.error("Error saving data: ", error);
        });
}

export function getData(customName, callback) {
    const db = getDatabase();
    const reference = ref(db, customName);

    onValue(reference, (snapshot) => {
        const data = snapshot.val();
        callback(data); // Return the data via the callback
    }, (error) => {
        console.error("Error fetching data: ", error);
    });
}

export function getDataPromise(customName) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        const reference = ref(db, customName);

        onValue(reference, (snapshot) => {
            const data = snapshot.val();
            resolve(data); // Resolve the promise with the fetched data
        }, (error) => {
            reject(error); // Reject the promise if there's an error
        });
    });
}


export { app, auth, setData }