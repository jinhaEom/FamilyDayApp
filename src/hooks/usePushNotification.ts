import {useCallback, useEffect, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';

const usePushNotification = () => {
  const {user, addFcmToken} = useContext(AuthContext);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionRequested, setPermissionRequested] =
    useState<boolean>(false);

  useEffect(() => {
    const getFcmToken = async () => {
      try {
        const token = await messaging().getToken();
        console.log('FCM 토큰 (앱 시작):', token);

        if (token) {
          setFcmToken(token);
          if (user) {
            console.log('사용자가 로그인 상태, 직접 토큰 저장 시도');
            addFcmToken(token);
          } else {
            console.log('사용자가 로그인 상태가 아님, 토큰은 로그인 후 저장됨');
          }
        } else {
          console.error('FCM 토큰이 비어 있습니다');
        }
      } catch (error) {
        console.error('FCM 토큰 가져오기 실패:', error);
      }
    };

    getFcmToken();
  }, [user, addFcmToken]);

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(token => {
      console.log('FCM 토큰 갱신:', token);
      setFcmToken(token);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user != null && fcmToken != null) {
      console.log('FCM 토큰 저장:', fcmToken);
      addFcmToken(fcmToken);
    }
  }, [fcmToken, user, addFcmToken]);

  const requestPermission = useCallback(async () => {
    if (permissionRequested) {
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }

      const currentPermission = await messaging().hasPermission();
      console.log('현재 알림 권한 상태:', currentPermission);

      if (
        currentPermission === messaging.AuthorizationStatus.NOT_DETERMINED ||
        currentPermission === messaging.AuthorizationStatus.DENIED
      ) {
        const authStatus = await messaging().requestPermission({
          provisional: true,
          sound: true,
          badge: true,
          alert: true,
        });

        console.log('알림 권한 요청 결과:', authStatus);

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Alert.alert(
            '알림 권한이 필요합니다.',
            '설정에서 알림 권한을 허용해주세요.',
            [
              {text: '취소', style: 'cancel'},
              {text: '설정으로 이동', onPress: () => Linking.openSettings()},
            ],
          );
        }
      }

      setPermissionRequested(true);
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
    }
  }, [permissionRequested]);

  // 앱 시작시 권한 요청
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {requestPermission, fcmToken};
};

export default usePushNotification;
