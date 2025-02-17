import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Header from '../components/header/header';
import {Colors} from '../constants/Colors';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import {Text} from 'react-native';
import {Image} from 'react-native';
import {Alert} from 'react-native';
import InfoTextInput from '../components/InfoTextInput';
import AppBasicButton from '../components/AppBasicButton';
import {ActivityIndicator} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';
import {launchImageLibrary} from 'react-native-image-picker';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const SignUpScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const {
    signUp,
    processingSignUp,
    setProcessingSignUp,
    userProfileImage,
    setUserProfileImage,
  } = useContext(AuthContext);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      setProcessingSignUp(true);
      await signUp(email, password, name, userProfileImage);
      navigation.navigate('ChoiceRoom');
    } catch (error) {
      console.error('회원가입 오류:', error);
    } finally {
      setProcessingSignUp(false);
    }
  };

  const validateEmail = (_email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(_email);
  };

  const handleImagePress = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.assets && result.assets[0]?.uri) {
        setUserProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };
  const handleBack = () => {
    setUserProfileImage(null);
  };

  useEffect(() => {
    console.log(userProfileImage);
    setButtonDisabled(
      !email || !password || !passwordConfirm || !name || processingSignUp,
    );
  }, [
    email,
    password,
    passwordConfirm,
    name,
    processingSignUp,
    userProfileImage,
  ]);

  return (
    <View style={styles.container}>
      <Header title="계정생성" showRightIcon={false} onBack={handleBack} />
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleImagePress}>
          {userProfileImage ? (
            <Image
              source={{uri: userProfileImage}}
              style={styles.selectedImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imageText}>프로필 이미지를 선택하세요!</Text>
          )}
        </TouchableOpacity>
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
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        )}
      </View>
      {processingSignUp && (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      )}
      <View style={styles.bottomContainer}>
        <AppBasicButton
          onPress={handleSignUp}
          buttonBackgroundColor={buttonDisabled ? Colors.GRAY : Colors.PRIMARY}
          buttonTextColor={Colors.WHITE}
          disabled={buttonDisabled}>
          회원가입하기
        </AppBasicButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: Colors.GRAY,
    padding: 10,
    borderRadius: 10,
    width: 150,
    height: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'hidden', // 추가
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontSize: 14,
  },
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
    backgroundColor: Colors.PRIMARY,
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
