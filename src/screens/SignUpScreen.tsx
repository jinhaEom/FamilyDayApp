import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity} from 'react-native';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ToastMessage} from '../components/ToastMessage';
import {useRef} from 'react';
import {TextInput} from 'react-native';
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const SignUpScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmRef = useRef<TextInput>(null);

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
      navigation.goBack();
    } catch (error) {
      ToastMessage({message: '회원가입 오류가 발생했습니다.', type: 'error'});
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
  const handlePasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleBack = () => {
    setUserProfileImage(null);
  };
  const handlePasswordConfirmVisible = () => {
    setIsPasswordConfirmVisible(!isPasswordConfirmVisible);
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
    <View className="flex-1">
      <Header title="계정생성" showRightIcon={false} onBack={handleBack} />
      <View className="p-4">
        <TouchableOpacity onPress={handleImagePress}>
          {userProfileImage ? (
            <>
              <Image
                source={{uri: userProfileImage}}
                className="w-[180px] h-[180px] rounded-xl items-center self-center mb-4"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 self-center items-center justify-center mb-4">
                <Ionicons name="camera" size={24} color={Colors.WHITE} />
              </View>
            </>
          ) : (
            <View className="w-[180px] h-[180px] rounded-xl items-center self-center bg-LIGHT_GRAY justify-center mb-4">
              <Ionicons name="person-add" size={40} color={Colors.PRIMARY} />
              <Text className="text-GRAY text-[14px]">프로필 선택</Text>
            </View>
          )}
        </TouchableOpacity>

        <InfoTextInput
          placeholder="닉네임"
          placeholderTextColor={Colors.GRAY}
          value={name}
          onChangeText={setName}
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <InfoTextInput
          placeholder="Email"
          ref={emailRef}
          placeholderTextColor={Colors.GRAY}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          onSubmitEditing={() => passwordRef.current?.focus()}
          onBlur={() => {
            if (email && !validateEmail(email)) {
              Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
              setEmail('');
            }
          }}
        />
        <View className="relative">
          <InfoTextInput
            placeholder="Password"
            ref={passwordRef}
            placeholderTextColor={Colors.GRAY}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            onSubmitEditing={() => passwordConfirmRef.current?.focus()}
          />
          {password !== '' && (
            <Ionicons
              className="absolute self-end right-2 justify-center items-center top-3"
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.GRAY}
              onPress={handlePasswordVisible}
            />
          )}
        </View>
        <View className="relative">
          <InfoTextInput
            placeholder="Password Confirm"
            placeholderTextColor={Colors.GRAY}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry={!isPasswordConfirmVisible}
            ref={passwordConfirmRef}
            onSubmitEditing={handleSignUp}
          />
          {passwordConfirm !== '' && (
            <Ionicons
              className="absolute self-end right-2 justify-center items-center top-3"
              name={isPasswordConfirmVisible ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.GRAY}
              onPress={handlePasswordConfirmVisible}
            />
          )}
        </View>
        {processingSignUp && buttonDisabled === false && (
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        )}
      </View>
      {processingSignUp && (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      )}
      <View className="flex-1 justify-end mb-4">
        <AppBasicButton
          className="h-12 items-center justify-center"
          onPress={handleSignUp}
          buttonBackgroundColor={buttonDisabled ? Colors.GRAY : Colors.PRIMARY}
          buttonTextColor={Colors.WHITE}
          disabled={buttonDisabled}>
          회원가입하기
        </AppBasicButton>
        <Text style={{textAlign: 'center', color: Colors.GRAY}}>
          이미 계정이 있으신가요?{'  '}
          <Text
            style={{color: Colors.PRIMARY}}
            onPress={() => navigation.goBack()}>
            로그인
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default SignUpScreen;
