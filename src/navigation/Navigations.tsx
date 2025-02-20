// Navigations.tsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChoiceRoom from '../screens/setup/ChoiceRoomScreen';
import MakeRoom from '../screens/setup/MakeRoomScreen';
import WritingCode from '../screens/setup/WritingCodeScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ExistChoiceRoom from '../screens/setup/ExistChoiceRoomScreen';
import { AuthContext } from '../auth/AuthContext';
import LoadingScreen from '../Loading/LoadingScreen';
import AddScheduleScreen from '../screens/home/AddScheduleScreen';
import { NavigationContainer, useRoute, RouteProp } from '@react-navigation/native';
import UserScDetailScreen from '../screens/home/UserScDetailScreen';
import { Schedule } from '../types/type';
import InviteCodeScreen from '../setting/settingMenu/InviteCodeScreen';
import ChangeNickNameScreen from '../setting/settingMenu/ChangeNickNameScreen';
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
  AddSchedule: undefined;
  UserScDetail: {userId: string, roomId: string, userName: string, schedules: Schedule[], roomName: string, startDate: string, endDate: string};
  Settings: undefined;
  InviteCode: undefined;
  ChangeNickName: undefined;
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
        <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
        <Stack.Screen name="UserScDetail" component={UserScDetailScreen} />
        <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
        <Stack.Screen name="ChangeNickName" component={ChangeNickNameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;

export const useRootRoute = <RouteName extends keyof RootStackParamList>() => {
  return useRoute<RouteProp<RootStackParamList, RouteName>>();
};
