// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA95g0zIEScYRpp5yJQMT7KcTzqJBq_7Zk",
  authDomain: "gas-leak-detection-4f3e1.firebaseapp.com",
  projectId: "gas-leak-detection-4f3e1",
  storageBucket: "gas-leak-detection-4f3e1.firebasestorage.app",
  messagingSenderId: "911088816501",
  appId: "1:911088816501:web:1592deb2055b13ad74833c",
  measurementId: "G-HDM2G5KHHF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);