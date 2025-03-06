import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import InfoTextInput from '../components/InfoTextInput';
import AppBasicButton from '../components/AppBasicButton';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const {height} = Dimensions.get('window');

const LoginScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const {signIn, processingSignIn, currentRoom, user} = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 애니메이션 효과
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 이미 로그인되어 있으면 메인 화면으로 이동
    if (currentRoom && user && !user.justLoggedIn) {
      navigation.replace('MainTabs', {
        roomId: currentRoom.roomId,
        roomName: currentRoom.roomName,
        nickname: currentRoom.members[user.userId]?.nickname || '',
        inviteCode: currentRoom.inviteCode,
      });
    }
  }, [currentRoom, user, navigation, fadeAnim]);

  const handleLogin = async () => {
    if (email.trim() === '' || password === '') {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const _user = await signIn(email, password);

      if (_user) {
        navigation.navigate('ChoiceRoom');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <Animated.View style={[styles.logoContainer, {opacity: fadeAnim}]}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="calendar-number-outline"
              size={48}
              color={Colors.WHITE}
            />
          </View>
          <Text style={styles.title}>Family Day</Text>
          <Text style={styles.subtitle}>가족의 소중한 순간을 함께</Text>
        </Animated.View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.PRIMARY} />
            </View>
            <InfoTextInput
              placeholder="이메일"
              value={email}
              placeholderTextColor={Colors.GRAY}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.PRIMARY}
              />
            </View>
            <InfoTextInput
              placeholder="비밀번호"
              placeholderTextColor={Colors.GRAY}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              ref={passwordRef}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={togglePasswordVisibility}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={Colors.GRAY}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>
              비밀번호를 잊으셨나요?
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <AppBasicButton
            onPress={handleLogin}
            buttonBackgroundColor={Colors.PRIMARY}
            buttonTextColor={Colors.WHITE}
            disabled={processingSignIn}
            style={styles.loginButton}>
            {processingSignIn ? (
              <ActivityIndicator size="small" color={Colors.WHITE} />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </AppBasicButton>

          <View style={styles.dividedContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>또는</Text>
            <View style={styles.divider} />
          </View>

          <AppBasicButton
            onPress={handleSignUp}
            buttonBackgroundColor={Colors.WHITE}
            buttonTextColor={Colors.PRIMARY}
            style={styles.signupButton}>
            <Text style={styles.signupButtonText}>회원가입</Text>
          </AppBasicButton>
        </View>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    top: 10,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 36,
    zIndex: 1,
    top: 10,
  },
  input: {
    flex: 1,
    paddingLeft: 40,
    color: Colors.BLACK,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: Colors.PRIMARY,
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: height * 0.05,
  },
  loginButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  orText: {
    marginHorizontal: 10,
    color: Colors.GRAY,
    fontSize: 14,
  },
  signupButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
});

export default LoginScreen;
