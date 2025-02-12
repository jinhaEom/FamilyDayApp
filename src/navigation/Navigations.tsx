// Navigations.tsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChoiceRoom from '../screens/setup/ChoiceRoom';
import MakeRoom from '../screens/setup/MakeRoom';
import WritingCode from '../screens/setup/WritingCode';
import BottomTabNavigator from './BottomTabNavigator';
import ExistChoiceRoom from '../screens/setup/ExistChoiceRoom';
import { AuthContext } from '../auth/AuthContext';
import LoadingScreen from '../Loading/LoadingScreen';
import { NavigationContainer } from '@react-navigation/native';
export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  SignUp: undefined;
  ChoiceRoom: undefined;
  WritingCode: undefined;
  MakeRoom: undefined;
  ExistChoiceRoom: undefined;
  MainTabs: {
    roomId: string;
    roomName: string;
    nickname: string;
    inviteCode: string;
  };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();



const Navigation: React.FC = () => {
  const { user, initialized, currentRoom } = useContext(AuthContext);

  // 초기화 중일 때는 로딩 화면만 표시
  if (!initialized) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 로그인 전이면 로그인 관련 스택을 사용
  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ChoiceRoom" component={ChoiceRoom} />
          <Stack.Screen name="MakeRoom" component={MakeRoom} />
          <Stack.Screen name="WritingCode" component={WritingCode} />
          <Stack.Screen name="ExistChoiceRoom" component={ExistChoiceRoom} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 로그인 후라면, currentRoom 값에 따라 초기 라우트 결정
  const initialRouteName = currentRoom ? 'MainTabs' : 'ChoiceRoom';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ChoiceRoom" component={ChoiceRoom} />
        <Stack.Screen name="MakeRoom" component={MakeRoom} />
        <Stack.Screen name="WritingCode" component={WritingCode} />
        <Stack.Screen name="ExistChoiceRoom" component={ExistChoiceRoom} />
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
