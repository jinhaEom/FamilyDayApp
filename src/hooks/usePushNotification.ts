import {useCallback, useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {requestNotifications, RESULTS} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
const usePushNotification = () => {
  const {user, addFcmToken} = useContext(AuthContext);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    messaging()
      .getToken()
      .then(token => {
        setFcmToken(token);
      });
  }, []);
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(token => {
      setFcmToken(token);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user != null && fcmToken != null) {
      addFcmToken(fcmToken);
    }
  }, [fcmToken, user, addFcmToken]);

  const requestPermission = useCallback(async () => {
    const {status} = await requestNotifications([]);
    const enabled = status === RESULTS.GRANTED;
    console.log('enabled', enabled);

    if (!enabled) {
      Alert.alert('알림 권한이 필요합니다.');
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {requestPermission};
};
export default usePushNotification;
