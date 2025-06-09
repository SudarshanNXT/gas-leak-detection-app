import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, Vibration, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { db } from './firebase';
import { ref, query, limitToLast, onChildAdded, off } from 'firebase/database';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function App() {
  const [gasLevel, setGasLevel] = useState(null);
  const [gasStatus, setGasStatus] = useState('Disconnected');
  const [timestamp, setTimestamp] = useState(null);
  const [connected, setConnected] = useState(true);
  const [history, setHistory] = useState([]);
  const [alertActive, setAlertActive] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  const soundRef = useRef();
  const unsubscribeRef = useRef();
  const GAS_THRESHOLD = 100;

  // Welcome alert
  useEffect(() => {
    Alert.alert('Welcome', 'Gas Leak Detector is now active!');
  }, []);

  // Load alert sound
  useEffect(() => {
    (async () => {
      const { sound } = await Audio.Sound.createAsync(require('./assets/alert.mp3'));
      soundRef.current = sound;
    })();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;
      if (actionId === 'STOP_SOUND') {
        stopAlert();
      }
    });

    return () => subscription.remove();
  }, []);

  // Listen to Firebase
  useEffect(() => {
    if (!connected || isTestMode) return;

    const gasQuery = query(ref(db, 'gasReadings'), limitToLast(1));

    unsubscribeRef.current = onChildAdded(gasQuery, (snapshot) => {
      const data = snapshot.val();
      const gasVal = data?.value ?? 0;
      const gasStat = data?.status ?? 'Unknown';
      const time = data?.timestamp ?? null;

      setGasLevel(gasVal);
      setGasStatus(gasStat);
      setTimestamp(time);

      setHistory(prev => {
        const updated = [...prev, gasVal];
        return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
      });

      if (gasVal > GAS_THRESHOLD && !alertActive) {
        triggerAlert();
      }
    });

    return () => {
      off(ref(db, 'gasReadings'), 'child_added');
    };
  }, [connected, alertActive, isTestMode]);

  const triggerAlert = async () => {
    setAlertActive(true);

    try {
      await soundRef.current?.replayAsync();
      Vibration.vibrate();

      Alert.alert(
        '🚨 Gas Leak Detected!',
        'Dangerous gas level above 100ppm!',
        [
          {
            text: 'Stop',
            onPress: () => stopAlert(),
            style: 'cancel',
          }
        ],
        { cancelable: false }
      );

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Gas Leak Detected!',
          body: 'Tap to stop the alarm.',
          sound: 'default',
        },
        trigger: null,
      });

    } catch (err) {
      console.error('Alert error:', err);
    }
  };

  const stopAlert = async () => {
    try {
      await soundRef.current?.stopAsync();
      Vibration.cancel();
    } catch (e) {
      console.error('Failed to stop alert:', e);
    } finally {
      setAlertActive(false);
      setIsTestMode(false);
    }
  };

  const disconnectApp = () => {
    setConnected(false);
    setGasLevel(null);
    setGasStatus('Disconnected');
    setTimestamp(null);
    setHistory([]);
  };

  const refreshApp = () => {
    setConnected(false);
    setTimeout(() => {
      setConnected(true);
    }, 500);
  };

  const testEmergency = () => {
    setIsTestMode(true);
    const simulatedVal = 150;
    const time = new Date().toISOString();

    setGasLevel(simulatedVal);
    setGasStatus('Test Mode - High');
    setTimestamp(time);

    setHistory(prev => {
      const updated = [...prev, simulatedVal];
      return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
    });

    triggerAlert();
  };

  const isDanger = gasLevel > 100 || alertActive || isTestMode;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: isDanger ? '#3a0000' : '#1c1c1e' }}>
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={[styles.header, isDanger && { backgroundColor: 'red' }]}>
          <Text style={styles.headerText}>
            <FontAwesome5 name="broadcast-tower" size={20} /> Gas Leak Detector IOT
          </Text>
        </View>

        <Text style={styles.readingLabel}>Current Reading</Text>
        <View style={[styles.circle, isDanger ? styles.dangerCircle : null]}>
          <Text style={styles.reading}>{gasLevel ?? '---'}</Text>
        </View>

        <Text style={styles.status}>
          Status: <Text style={{ color: isDanger ? 'red' : '#60C163' }}>{gasStatus} {isDanger ? '🔥' : '✅'}</Text>
        </Text>

        <Text style={styles.timestamp}>
          Timestamp: {timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm:ss') : '---'}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnGreen} onPress={refreshApp}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.btnText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnRed} onPress={disconnectApp}>
            <Ionicons name="power" size={20} color="#fff" />
            <Text style={styles.btnText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.btnRed, { marginTop: 20 }]} onPress={testEmergency}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.btnText}>Test Emergency</Text>
        </TouchableOpacity>

        {history.length > 0 && (
          <LineChart
            data={{
              labels: [],
              datasets: [{ data: history }],
            }}
            width={screenWidth - 30}
            height={220}
            withDots
            withShadow
            yAxisSuffix=""
            yAxisInterval={1}
            chartConfig={{
              backgroundGradientFrom: "#1E1E1E",
              backgroundGradientTo: "#1E1E1E",
              color: () => isDanger ? 'red' : '#60C163',
              labelColor: () => '#ccc',
              strokeWidth: 2,
              propsForDots: {
                r: '2',
                strokeWidth: '1',
                stroke: isDanger ? 'red' : '#60C163',
              },
            }}
            bezier
            style={styles.chart}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  dangerCircle: {
    borderColor: 'red',
  },
  header: {
    backgroundColor: '#60C163',
    width: '100%',
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  readingLabel: {
    color: '#ccc',
    fontSize: 20,
    marginTop: 20,
  },
  circle: {
    marginTop: 10,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: '#60C163',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reading: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  status: {
    fontSize: 22,
    marginTop: 10,
    color: 'white',
  },
  timestamp: {
    fontSize: 14,
    marginTop: 15,
    color: '#aaa',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  btnRed: {
    flexDirection: 'row',
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnGreen: {
    flexDirection: 'row',
    backgroundColor: '#60C163',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  chart: {
    marginTop: 30,
    borderRadius: 10,
  },
});