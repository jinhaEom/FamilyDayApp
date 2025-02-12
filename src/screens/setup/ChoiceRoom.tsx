import React, {useEffect, useRef, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {Colors} from '../../constants/Colors';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import {useContext} from 'react';
import {AuthContext} from '../../auth/AuthContext';

const ChoiceRoom = () => {
  const {signOut, currentRoom} = useContext(AuthContext);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const handleButtonPress = (
    screen: 'WritingCode' | 'MakeRoom' | 'ExistChoiceRoom',
  ) => {
    navigation.navigate(screen);
  };
  const {user} = useContext(AuthContext);

  useEffect(() => {
    // currentRoom이 있고, 로그인한 상태이며,
    // 방을 선택한 후 처음 들어온 경우만 MainTabs로 이동
    if (currentRoom && user && !user.justLoggedIn) {
      navigation.replace('MainTabs', {
        roomId: currentRoom.roomId,
        roomName: currentRoom.roomName,
        nickname: currentRoom.members[user.userId]?.nickname || '',
        inviteCode: currentRoom.inviteCode,
      });
    }
  }, [currentRoom, user, navigation]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('로그아웃 중 에러 발생:', error);
    }
  }, [signOut, navigation]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(descriptionOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleOpacity, descriptionOpacity]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.titleText, {opacity: titleOpacity}]}>
        안녕하세요 {user?.name}님!
      </Animated.Text>
      <Animated.Text
        style={[styles.descriptionText, {opacity: descriptionOpacity}]}>
        일정을 공유할 방을 생성하거나 초대를 받아보세요!
      </Animated.Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleButtonPress('WritingCode')}>
          <Text style={styles.buttonText}>초대코드로 방 들어가기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button2}
          onPress={() => handleButtonPress('MakeRoom')}>
          <Text style={styles.buttonText2}>방 생성</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button2}
          onPress={() => handleButtonPress('ExistChoiceRoom')}>
          <Text style={styles.buttonText2}>참여한 방 선택하기</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.BLACK,
  },
  descriptionText: {
    fontSize: 16,
    marginBottom: 20,
    color: Colors.GRAY,
  },
  button: {
    backgroundColor: Colors.BLACK,
    padding: 12,
    borderRadius: 18,
    marginBottom: 24,
  },
  button2: {
    backgroundColor: Colors.LIGHT_GRAY,
    padding: 12,
    borderRadius: 18,
    marginBottom: 24,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonText2: {
    color: Colors.DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 48,
  },
  logoutButton: {
    color: Colors.GRAY,
    bottom: 24,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  logoutButtonText: {
    color: Colors.GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ChoiceRoom;
