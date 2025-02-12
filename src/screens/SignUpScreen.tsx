import React, {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Header from '../components/header/header';
import {Colors} from '../constants/Colors';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import {Alert} from 'react-native';
import InfoTextInput from '../components/InfoTextInput';
import AppBasicButton from '../components/AppBasicButton';
import {ActivityIndicator} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const SignUpScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const {signUp, processingSignUp} = useContext(AuthContext);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  const handleSignUp = async () => {
    if (buttonDisabled) {
      return;
    }
    setButtonDisabled(true);
    if (password !== passwordConfirm) {
      Alert.alert('비밀번호가 일치하지 않습니다.');
      setButtonDisabled(false);
      return;
    }
    try {
      await signUp(email, password, name);
      console.log(email, password, name);
      navigation.goBack();
    } catch (error) {
      console.error('Error signing up:', error);
      setButtonDisabled(false);
    }
  };

  const validateEmail = (_email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(_email);
  };

  useEffect(() => {
    setButtonDisabled(
      !email || !password || !passwordConfirm || !name || processingSignUp,
    );
  }, [email, password, passwordConfirm, name, processingSignUp]);

  return (
    <View style={styles.container}>
      <Header title="계정생성" showRightIcon={false} />
      <View style={styles.inputContainer}>
        <InfoTextInput
          placeholder="닉네임"
          placeholderTextColor={Colors.GRAY}
          value={name}
          onChangeText={setName}
        />
        <InfoTextInput
          placeholder="Email"
          placeholderTextColor={Colors.GRAY}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          onBlur={() => {
            if (email && !validateEmail(email)) {
              Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
              setEmail('');
            }
          }}
        />
        <InfoTextInput
          placeholder="Password"
          placeholderTextColor={Colors.GRAY}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <InfoTextInput
          placeholder="Password Confirm"
          placeholderTextColor={Colors.GRAY}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
        />
        {processingSignUp && buttonDisabled === false && (
          <ActivityIndicator size="large" color={Colors.BLACK} />
        )}
      </View>
      {processingSignUp && (
        <ActivityIndicator size="large" color={Colors.BLACK} />
      )}
      <View style={styles.bottomContainer}>
        <AppBasicButton
          onPress={handleSignUp}
          buttonBackgroundColor={buttonDisabled ? Colors.GRAY : Colors.BLACK}
          buttonTextColor={Colors.WHITE}
          disabled={buttonDisabled}>
          회원가입하기
        </AppBasicButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    padding: 20,
  },
  bottomContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: Colors.BLACK,
    padding: 12,
    margin: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
