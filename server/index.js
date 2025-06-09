import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push } from 'firebase/database';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA95g0zIEScYRpp5yJQMT7KcTzqJBq_7Zk",
  authDomain: "gas-leak-detection-4f3e1.firebaseapp.com",
  projectId: "gas-leak-detection-4f3e1",
  storageBucket: "gas-leak-detection-4f3e1.firebasestorage.app",
  messagingSenderId: "911088816501",
  appId: "1:911088816501:web:1592deb2055b13ad74833c",
  measurementId: "G-HDM2G5KHHF",
  databaseURL: "https://gas-leak-detection-4f3e1-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const readingsRef = ref(db, 'gasReadings');

// Setup Serial Port (⚠️ Update COM port as per your system)
const port = new SerialPort({ path: 'COM5', baudRate: 9600 }); 
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

console.log("📡 Listening for real-time gas sensor data...\n");

parser.on('data', (line) => {
  const trimmedLine = line.trim();
  console.log("🔍 Arduino says:", trimmedLine);

  try {
    if (trimmedLine.includes("Gas Level")) {
      const parts = trimmedLine.split('=');
      const valPart = parts[1]?.split('->')[0].trim();
      const gasValue = parseInt(valPart);

      if (!isNaN(gasValue)) {
        const status = trimmedLine.includes("GAS LEAKING") ? "LEAK" : "NORMAL";

        const reading = {
          value: gasValue,
          status,
          timestamp: Date.now()
        };

        push(readingsRef, reading)
          .then(() => console.log("✅ Uploaded to Firebase:", reading))
          .catch(err => console.error("❌ Firebase error:", err));
      } else {
        console.warn("⚠️ Invalid gas value received, skipping.");
      }
    }
  } catch (err) {
    console.error("❌ Parsing error:", err);
  }
});
