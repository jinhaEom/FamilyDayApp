import React, {useState, useEffect, forwardRef} from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Colors} from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {StyleProp, ViewStyle} from 'react-native';
import auth from '@react-native-firebase/auth';

interface InfoTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  isPhoneVerification?: boolean;
  onVerificationComplete?: (password: string) => void;
}

const InfoTextInput = forwardRef<TextInput, InfoTextInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      placeholderTextColor,
      secureTextEntry,
      onBlur,
      className,
      isPhoneVerification,
      onVerificationComplete,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [deleteIconVisible, setDeleteIconVisible] = useState(false);

    // 전화번호 인증 관련 상태
    const [verificationId, setVerificationId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
      setDeleteIconVisible(value.length > 0 && isFocused);
    }, [value, isFocused]);

    // 인증번호 요청 함수
    const requestVerificationCode = async () => {
      if (!value || value.length < 10) {
        Alert.alert('알림', '올바른 핸드폰 번호를 입력해주세요.');
        return;
      }

      try {
        setVerifying(true);
        // 국가 코드와 전화번호 조합 (한국 기준)
        const phoneNumber = `+82${
          value.startsWith('0') ? value.substring(1) : value
        }`;

        // Firebase 전화번호 인증 시작
        const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
        setVerificationId(confirmation.verificationId || '');
        setVerificationSent(true);
        Alert.alert('알림', '인증번호가 전송되었습니다.');
      } catch (error) {
        console.error('전화번호 인증 요청 오류:', error);
        Alert.alert('오류', '인증번호 전송에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setVerifying(false);
      }
    };

    // 인증번호 확인 함수
    const verifyCode = async () => {
      if (!verificationCode || verificationCode.length !== 6) {
        Alert.alert('알림', '6자리 인증번호를 입력해주세요.');
        return;
      }

      try {
        setVerifying(true);

        // Firebase 인증 확인
        const credential = auth.PhoneAuthProvider.credential(
          verificationId,
          verificationCode,
        );

        await auth().signInWithCredential(credential);

        // 인증 성공 시 임시 비밀번호 생성
        const tempPwd = generateTempPassword();
        setTempPassword(tempPwd);
        setVerificationSuccess(true);

        // 상위 컴포넌트에 완료 알림
        if (onVerificationComplete) {
          onVerificationComplete(tempPwd);
        }

        Alert.alert(
          '알림',
          '인증이 완료되었습니다. 임시 비밀번호가 생성되었습니다.',
        );
      } catch (error) {
        console.error('인증번호 확인 오류:', error);
        Alert.alert('오류', '인증번호가 올바르지 않습니다. 다시 확인해주세요.');
      } finally {
        setVerifying(false);
      }
    };

    // 임시 비밀번호 생성 함수
    const generateTempPassword = () => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    // 기본 입력 컴포넌트 렌더링
    if (!isPhoneVerification) {
      return (
        <View
          className={className}
          style={{
            height: 40,
            borderColor: isFocused ? Colors.PRIMARY : Colors.LIGHT_GRAY,
            backgroundColor: Colors.LIGHT_GRAY,
            borderWidth: 1,
            marginBottom: 15,
            paddingHorizontal: 10,
            justifyContent: 'center',
            borderRadius: 12,
            ...(props.style as ViewStyle),
          }}>
          <TextInput
            ref={ref}
            className="text-BLACK"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            secureTextEntry={secureTextEntry}
            {...props}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
          />
          {deleteIconVisible && (
            <TouchableOpacity className="absolute right-2">
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.GRAY}
                onPress={() => {
                  onChangeText('');
                }}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // 전화번호 인증 컴포넌트 렌더링
    return (
      <View>
        <View
          className={className}
          style={{
            height: 40,
            borderColor: isFocused ? Colors.PRIMARY : Colors.LIGHT_GRAY,
            backgroundColor: Colors.LIGHT_GRAY,
            borderWidth: 1,
            marginBottom: 5,
            paddingHorizontal: 10,
            justifyContent: 'center',
            borderRadius: 12,
            ...(props.style as ViewStyle),
          }}>
          <TextInput
            ref={ref}
            className="text-BLACK"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || '핸드폰 번호 (- 없이 입력)'}
            placeholderTextColor={placeholderTextColor}
            keyboardType="phone-pad"
            editable={!verificationSent || verificationSuccess}
            {...props}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
          />
          {deleteIconVisible && !verificationSent && (
            <TouchableOpacity className="absolute right-2">
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.GRAY}
                onPress={() => {
                  onChangeText('');
                }}
              />
            </TouchableOpacity>
          )}
        </View>

        {!verificationSent ? (
          <TouchableOpacity
            className="bg-PRIMARY py-2 px-4 rounded-xl self-end"
            onPress={requestVerificationCode}
            disabled={verifying || value.length < 10}>
            {verifying ? (
              <ActivityIndicator size="small" color={Colors.WHITE} />
            ) : (
              <Text className="text-WHITE font-bold">인증번호 받기</Text>
            )}
          </TouchableOpacity>
        ) : verificationSuccess ? (
          <View className="mt-2">
            <Text className="text-PRIMARY font-bold mb-1">임시 비밀번호</Text>
            <View className="flex-row items-center bg-LIGHT_GRAY p-2 rounded-lg">
              <Text className="text-BLACK flex-1">{tempPassword}</Text>
              <TouchableOpacity
                className="bg-PRIMARY py-1 px-2 rounded-lg ml-2"
                onPress={() => {
                  // 클립보드에 복사 로직 (실제 구현 시 추가)
                  Alert.alert('알림', '비밀번호가 클립보드에 복사되었습니다.');
                }}>
                <Text className="text-WHITE text-xs">복사</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View
              className="flex-row items-center"
              style={{
                height: 40,
                borderColor: isFocused ? Colors.PRIMARY : Colors.LIGHT_GRAY,
                backgroundColor: Colors.LIGHT_GRAY,
                borderWidth: 1,
                marginTop: 10,
                marginBottom: 5,
                paddingHorizontal: 10,
                justifyContent: 'center',
                borderRadius: 12,
              }}>
              <TextInput
                className="text-BLACK flex-1"
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="인증번호 입력 (6자리)"
                placeholderTextColor={Colors.GRAY}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              className="bg-PRIMARY py-2 px-4 rounded-xl self-end"
              onPress={verifyCode}
              disabled={verifying || verificationCode.length !== 6}>
              {verifying ? (
                <ActivityIndicator size="small" color={Colors.WHITE} />
              ) : (
                <Text className="text-WHITE font-bold">인증하기</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  },
);

export default InfoTextInput;
