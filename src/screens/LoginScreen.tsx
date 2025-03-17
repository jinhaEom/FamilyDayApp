import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
      className="flex-1 justify-between p-4">
      <Animated.View className="items-center mt-5" style={{opacity: fadeAnim}}>
        <View className="rounded-full bg-PRIMARY w-20 h-20 items-center justify-center">
          <Ionicons
            name="calendar-number-outline"
            size={48}
            color={Colors.WHITE}
          />
        </View>
        <Text className="text-[32px] font-bold text-PRIMARY ">Family Day</Text>
        <Text className="text-[14px] text-GRAY mb-20">
          가족의 소중한 순간을 함께
        </Text>
      </Animated.View>

      <View className="w-full my-20">
        <View className="flex-row items-center mb-4">
          <View className="absolute left-2 z-10 mb-4">
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
            className="flex-1 pl-20 w-full text-BLACK"
          />
        </View>

        <View className="flex-row items-center mb-4">
          <View className="absolute left-2 z-10 mb-4">
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
            className="flex-1 pl-20 w-full text-BLACK"
          />
          <TouchableOpacity
            className="absolute right-10 z-10 mb-4"
            onPress={togglePasswordVisibility}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.GRAY}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="self-end mt-2"
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="text-PRIMARY text-[14px]">
            비밀번호를 잊으셨나요?
          </Text>
        </TouchableOpacity>
      </View>

      <View className="w-full mb-1">
        <AppBasicButton
          className="rounded-full h-12 items-center justify-center"
          onPress={handleLogin}
          buttonBackgroundColor={Colors.PRIMARY}
          buttonTextColor={Colors.WHITE}
          disabled={processingSignIn}>
          {processingSignIn ? (
            <ActivityIndicator size="small" color={Colors.WHITE} />
          ) : (
            <Text className="text-[16px] font-bold">로그인</Text>
          )}
        </AppBasicButton>

        <View className="flex-row items-center my-4">
          <View className="flex-1 h-0.5 bg-LIGHT_GRAY" />
          <Text className="mx-2 text-GRAY text-[14px]">또는</Text>
          <View className="flex-1 h-0.5 bg-LIGHT_GRAY" />
        </View>

        <AppBasicButton
          className="rounded-xl border border-PRIMARY h-12"
          onPress={handleSignUp}
          buttonBackgroundColor={Colors.WHITE}
          buttonTextColor={Colors.PRIMARY}>
          <Text className="text-PRIMARY text-[16px] text-bo">회원가입</Text>
        </AppBasicButton>
      </View>
    </KeyboardAvoidingView>
  );
};



export default LoginScreen;
