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
    <View style={styles.container}>
      <Header title="계정생성" showRightIcon={false} onBack={handleBack} />
      <View style={styles.inputContainer}>
      <TouchableOpacity
              style={styles.imageContainer}
              onPress={handleImagePress}>
              {userProfileImage ? (
                <>
                  <Image
                    source={{uri: userProfileImage}}
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={24} color={Colors.WHITE} />
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person-add" size={40} color={Colors.PRIMARY} />
                  <Text style={styles.imageText}>프로필 선택</Text>
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
        <View style={{position: 'relative'}}>
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
              style={{
                position: 'absolute',
                right: 35,
                top: 10,
              }}
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.GRAY}
              onPress={handlePasswordVisible}
            />
          )}
        </View>
        <View style={{position: 'relative'}}>
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
              style={{position: 'absolute', right: 35, top: 10}}
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
      <View style={styles.bottomContainer}>
        <AppBasicButton
          onPress={handleSignUp}
          buttonBackgroundColor={buttonDisabled ? Colors.GRAY : Colors.PRIMARY}
          buttonTextColor={Colors.WHITE}
          disabled={buttonDisabled}>
          회원가입하기
        </AppBasicButton>
        <Text style={{textAlign: 'center', color: Colors.GRAY}}>
          이미 계정이 있으신가요?{'  '}
          <Text style={{color: Colors.PRIMARY}} onPress={() => navigation.goBack()}>
            로그인
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width :120,
    height: 120,
    borderRadius : 40,
    backgroundColor : Colors.LIGHT_GRAY,
    alignSelf:'center',
    justifyContent:'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical : 5,
    alignItems : 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: Colors.GRAY,
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
