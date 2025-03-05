import {useCallback, useEffect, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

const usePushNotification = () => {
  const {user, addFcmToken} = useContext(AuthContext);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionRequested, setPermissionRequested] =
    useState<boolean>(false);
  const [isNotificationEnabled, setIsNotificationEnabled] =
    useState<boolean>(true);

  // 알림 설정 상태 로드
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const savedSetting = await AsyncStorage.getItem(
          NOTIFICATION_ENABLED_KEY,
        );
        setIsNotificationEnabled(savedSetting !== 'false');
      } catch (error) {
        console.error('알림 설정 로드 오류:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  useEffect(() => {
    const getFcmToken = async () => {
      try {
        // 알림이 비활성화된 경우 토큰을 가져오지 않음
        if (!isNotificationEnabled) {
          console.log('알림이 비활성화되어 FCM 토큰을 가져오지 않습니다.');
          return;
        }

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
  }, [user, addFcmToken, isNotificationEnabled]);

  // 알림 설정 변경 감지
  useEffect(() => {
    const checkNotificationSettings = async () => {
      try {
        const savedSetting = await AsyncStorage.getItem(
          NOTIFICATION_ENABLED_KEY,
        );
        const newSetting = savedSetting !== 'false';

        if (isNotificationEnabled !== newSetting) {
          setIsNotificationEnabled(newSetting);

          // 알림이 활성화되면 토큰을 다시 가져옴
          if (newSetting) {
            const token = await messaging().getToken();
            if (token) {
              setFcmToken(token);
              if (user) {
                addFcmToken(token);
              }
            }
          }
        }
      } catch (error) {
        console.error('알림 설정 확인 오류:', error);
      }
    };

    // 1초마다 설정 확인 (실제 앱에서는 더 긴 간격이나 이벤트 기반으로 변경 권장)
    const interval = setInterval(checkNotificationSettings, 1000);
    return () => clearInterval(interval);
  }, [isNotificationEnabled, user, addFcmToken]);

  useEffect(() => {
    // 알림이 비활성화된 경우 토큰 갱신을 처리하지 않음
    if (!isNotificationEnabled) return () => {};

    const unsubscribe = messaging().onTokenRefresh(token => {
      console.log('FCM 토큰 갱신:', token);
      setFcmToken(token);
    });
    return () => unsubscribe();
  }, [isNotificationEnabled]);

  useEffect(() => {
    if (user != null && fcmToken != null && isNotificationEnabled) {
      console.log('FCM 토큰 저장:', fcmToken);
      addFcmToken(fcmToken);
    }
  }, [fcmToken, user, addFcmToken, isNotificationEnabled]);

  const requestPermission = useCallback(async () => {
    // 알림이 비활성화된 경우 권한 요청을 하지 않음
    if (!isNotificationEnabled || permissionRequested) {
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
  }, [permissionRequested, isNotificationEnabled]);

  // 앱 시작시 권한 요청 (알림이 활성화된 경우에만)
  useEffect(() => {
    if (isNotificationEnabled) {
      requestPermission();
    }
  }, [requestPermission, isNotificationEnabled]);

  return {requestPermission, fcmToken, isNotificationEnabled};
};

export default usePushNotification;
