import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {Colors} from '../constants/Colors';
import {AuthContext} from '../auth/AuthContext';
import {useContext} from 'react';
import InfoTextInput from '../components/InfoTextInput';
import AppBasicButton from '../components/AppBasicButton';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/navigations';
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const LoginScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const {signIn, processingSignIn, currentRoom, user} = useContext(AuthContext);

  useEffect(() => {
    if (currentRoom && user && !user.justLoggedIn) {
      navigation.replace('MainTabs', {
        roomId: currentRoom.roomId,
        roomName: currentRoom.roomName,
        nickname: currentRoom.members[user.userId]?.nickname || '',
        inviteCode: currentRoom.inviteCode,
      });
    }
  }, [currentRoom, user, navigation]);

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      await signIn(email, password);
      navigation.navigate('ChoiceRoom');

    } catch (error) {
      console.error('Error signing in:', error);
      Alert.alert('이메일 또는 비밀번호를 다시 확인해주세요.');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Day</Text>
      <InfoTextInput
        placeholder="Email"
        value={email}
        placeholderTextColor={Colors.GRAY}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <InfoTextInput
        placeholder="Password"
        placeholderTextColor={Colors.GRAY}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        ref={passwordRef}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
      <AppBasicButton
        onPress={handleLogin}
        buttonBackgroundColor={Colors.PRIMARY_SUB}
        buttonTextColor={Colors.WHITE}
        disabled={processingSignIn}>
        {processingSignIn ? (
          <ActivityIndicator size="small" color={Colors.WHITE} style={{}} />
        ) : (
          'Login'
        )}
      </AppBasicButton>
      <AppBasicButton
        onPress={handleSignUp}
        buttonBackgroundColor={Colors.LIGHT_GRAY}
        buttonTextColor={Colors.PRIMARY_SUB}>
        SignUp
      </AppBasicButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.PRIMARY,
  },
});

export default LoginScreen;
