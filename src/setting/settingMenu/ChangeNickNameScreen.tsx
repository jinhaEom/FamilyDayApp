import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Colors} from '../../constants/Colors';
import {useContext} from 'react';
import {AuthContext} from '../../auth/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/navigations';
import Header from '../../components/header/header';
import {ToastMessage} from '../../components/ToastMessage';
import InfoTextInput from '../../components/InfoTextInput';

const ChangeNickNameScreen = () => {
  const {user, currentRoom, changeNickname} = useContext(AuthContext);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nickname, setNickname] = useState('');

  const handleChangeNickname = async () => {
    if (nickname === '') {
      ToastMessage({message: '닉네임을 입력해주세요.', type: 'error'});
      return;
    }
    await changeNickname(nickname);
    navigation.goBack();
  };
  return (
    <>
      <Header title="" />
      <View style={styles.container}>
        <Text style={styles.title}>닉네임 변경</Text>
        <Text style={styles.nowNickNameText}>
          현재 닉네임 : {currentRoom?.members[user?.userId as string]?.nickname}
        </Text>
        <InfoTextInput
          onChangeText={setNickname}
          value={nickname}
          placeholder="닉네임을 입력하세요"
        />
        <TouchableOpacity
          style={styles.changeNickNameButton}
          onPress={handleChangeNickname}>
          <Text style={{color: Colors.WHITE}}>변경하기</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.WHITE,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  nowNickNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.GRAY,
  },
  changeNickNameButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default ChangeNickNameScreen;
