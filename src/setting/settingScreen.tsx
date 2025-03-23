import React, {useCallback, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {Colors} from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { ToastMessage } from '../components/ToastMessage';
import { version } from '../../package.json';
const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

const SettingScreen = () => {
  const {logOut} = useContext(AuthContext);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const savedSetting = await AsyncStorage.getItem(
          NOTIFICATION_ENABLED_KEY,
        );
        // 저장된 설정이 없으면 기본값은 true (알림 활성화)
        setIsNotificationEnabled(savedSetting !== 'false');
      } catch (error) {
        console.error('알림 설정 로드 오류:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  const toggleNotification = async () => {
    try {
      const newValue = !isNotificationEnabled;
      setIsNotificationEnabled(newValue);

      // AsyncStorage에 설정 저장
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, newValue.toString());

      if (newValue) {
        // 알림 활성화
        if (Platform.OS === 'ios') {
          await messaging().registerDeviceForRemoteMessages();
        }

        const authStatus = await messaging().requestPermission({
          provisional: true,
          sound: true,
          badge: true,
          alert: true,
        });

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Alert.alert(
            '알림 권한이 필요합니다',
            '설정에서 알림 권한을 허용해주세요',
            [
              {text: '취소', style: 'cancel'},
              {text: '설정으로 이동', onPress: () => Linking.openSettings()},
            ],
          );
        } else {
          ToastMessage({
            message: '알림이 활성화되었습니다',
            type: 'success',
          });
        }
      } else {
        // 알림 비활성화 - 사용자에게 알림
        ToastMessage({
          message: '알림이 비활성화되었습니다',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('알림 설정 변경 오류:', error);
      ToastMessage({
        message: '알림 설정 변경 중 오류가 발생했습니다',
        type: 'error',
      });
    }
  };

  const inVitedHandler = useCallback(() => {
    navigation.navigate('InviteCode');
  }, [navigation]);

  const choiceRoomHandler = useCallback(() => {
    navigation.navigate('ExistChoiceRoom');
  }, [navigation]);

  const logOutHandler = useCallback(async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  }, [logOut]);

  return (
    <View style={styles.topContainer}>
      <View style={styles.line} />
      <TouchableOpacity style={styles.container} onPress={inVitedHandler}>
        <Ionicons name="person-add-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>초대하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.container} onPress={choiceRoomHandler}>
        <Ionicons name="grid-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>방 선택하기</Text>
      </TouchableOpacity>
      <View style={styles.container}>
        <Switch
          value={isNotificationEnabled}
          onValueChange={toggleNotification}
          trackColor={{false: Colors.LIGHT_GRAY, true: Colors.PRIMARY}}
          thumbColor={isNotificationEnabled ? Colors.WHITE : Colors.WHITE}
        />
        <Text style={styles.textStyle}>알림 설정</Text>
      </View>
      <TouchableOpacity style={styles.container} onPress={logOutHandler}>
        <Ionicons name="log-out-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>로그아웃</Text>
      </TouchableOpacity>
      <View style={styles.container}>
      <Text style={{flex: 1, textAlign: 'right'}}>버전 {version}</Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  topContainer: {
    flex: 1,
  },
  line: {
    width: '100%',
    height: 0.7,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  container: {
    width: '100%',
    padding: 10,
    height: 52,
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 0.7,
    alignItems: 'center',
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  textStyle: {
    marginLeft: 10,
    fontSize: 18,
    color: Colors.PRIMARY,
  },
});
export default SettingScreen;
