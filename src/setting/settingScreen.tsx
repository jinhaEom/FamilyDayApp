import React, {useCallback} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Colors} from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import {useNavigation} from '@react-navigation/native';
import {CommonActions} from '@react-navigation/native';

const SettingScreen = () => {
  const {signOut} = useContext(AuthContext);
  const navigation = useNavigation();

  const inVitedHandler = useCallback(() => {
    console.log('초대하기');
  }, []);

  const changeNicknameHandler = useCallback(() => {
    console.log('닉네임 변경');
  }, []);

  const choiceRoomHandler = useCallback(() => {
    console.log('방 선택하기');
  }, []);

  const logOutHandler = useCallback(async () => {
    try {
      await signOut();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Login'}],
        }),
      );
    } catch (error) {
      console.error('로그아웃 중 에러 발생:', error);
    }
  }, [signOut, navigation]);

  return (
    <View style={styles.topContainer}>
      <View style={styles.line} />
      <TouchableOpacity style={styles.container} onPress={inVitedHandler}>
        <Ionicons name="person-add-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>초대하기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.container}
        onPress={changeNicknameHandler}>
        <Ionicons name="pencil-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>닉네임 변경</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.container} onPress={choiceRoomHandler}>
        <Ionicons name="grid-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>방 선택하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.container} onPress={logOutHandler}>
        <Ionicons name="log-out-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.textStyle}>로그아웃</Text>
      </TouchableOpacity>
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
