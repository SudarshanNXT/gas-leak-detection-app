// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA95g0zIEScYRpp5yJQMT7KcTzqJBq_7Zk",
  authDomain: "gas-leak-detection-4f3e1.firebaseapp.com",
  projectId: "gas-leak-detection-4f3e1",
  storageBucket: "gas-leak-detection-4f3e1.appspot.com",
  messagingSenderId: "911088816501",
  appId: "1:911088816501:web:1592deb2055b13ad74833c",
  measurementId: "G-HDM2G5KHHF",
  databaseURL: "https://gas-leak-detection-4f3e1-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);