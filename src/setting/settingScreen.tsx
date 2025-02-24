import React, {useCallback} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Colors} from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';

const SettingScreen = () => {
  const {logOut} = useContext(AuthContext);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
