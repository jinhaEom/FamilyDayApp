import React, {useState} from 'react';
import {View, Text, Alert, ActivityIndicator} from 'react-native';
import Header from '../components/header/header';
import InfoTextInput from '../components/InfoTextInput';
import AppBasicButton from '../components/AppBasicButton';
import {Colors} from '../constants/Colors';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';
import Toast from 'react-native-simple-toast';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [processingReset, setProcessingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      Toast.show('유효한 이메일 주소를 입력해주세요.', Toast.SHORT);
      return;
    }

    if (!name || name.trim() === '') {
      Toast.show('이름을 입력해주세요.', Toast.SHORT);
      return;
    }

    try {
      setProcessingReset(true);

      const usersSnapshot = await firestore()
        .collection('users')
        .where('email', '==', email)
        .where('name', '==', name)
        .get();

      if (usersSnapshot.empty) {
        Toast.show('일치하는 사용자 정보를 찾을 수 없습니다.', Toast.SHORT);
        return;
      }

      await auth().sendPasswordResetEmail(email);

      setResetEmailSent(true);
      Alert.alert(
        '비밀번호 재설정 이메일 전송 완료',
        '이메일로 비밀번호 재설정 링크가 전송되었습니다. 이메일을 확인하여 비밀번호를 재설정해주세요.',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      Alert.alert(
        '오류',
        '비밀번호 재설정 이메일 전송에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setProcessingReset(false);
    }
  };

  return (
    <View className="flex-1">
      <Header title="비밀번호 찾기" showRightIcon={false} />
      <View className="p-4">
        <Text className="text-BLACK text-[16px] mb-2 font-bold">
          회원 정보 확인
        </Text>
        <Text className="text-GRAY text-[14px] mb-4">
          가입 시 등록한 정보를 입력하시면 이메일로 비밀번호 재설정 링크를
          보내드립니다.
        </Text>

        <Text className="text-BLACK text-[16px] mb-2">이름</Text>
        <InfoTextInput
          value={name}
          onChangeText={setName}
          placeholder="이름을 입력해주세요"
          placeholderTextColor={Colors.GRAY}
          className="w-full mb-4"
        />

        <Text className="text-BLACK text-[16px] mb-2">이메일</Text>
        <InfoTextInput
          value={email}
          onChangeText={setEmail}
          placeholder="가입한 이메일을 입력해주세요"
          placeholderTextColor={Colors.GRAY}
          keyboardType="email-address"
          autoCapitalize="none"
          className="w-full mb-6"
        />

        <AppBasicButton
          buttonBackgroundColor={Colors.PRIMARY}
          buttonTextColor={Colors.WHITE}
          disabled={processingReset}
          onPress={handleForgotPassword}>
          {processingReset ? (
            <ActivityIndicator size="small" color={Colors.WHITE} />
          ) : (
            '비밀번호 재설정 이메일 전송'
          )}
        </AppBasicButton>

        {resetEmailSent && (
          <View className="mt-6 p-4 bg-LIGHT_GRAY rounded-lg">
            <Text className="text-BLACK text-[16px] font-bold mb-2">
              이메일 전송 완료
            </Text>
            <Text className="text-GRAY text-[14px]">
              입력하신 이메일로 비밀번호 재설정 링크가 전송되었습니다. 이메일을
              확인하여 비밀번호를 재설정해주세요.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;
