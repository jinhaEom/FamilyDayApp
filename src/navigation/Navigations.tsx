// Navigations.tsx
import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChoiceRoom from '../screens/setup/ChoiceRoomScreen';
import MakeRoom from '../screens/setup/MakeRoomScreen';
import WritingCode from '../screens/setup/WritingCodeScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ExistChoiceRoom from '../screens/setup/ExistChoiceRoomScreen';
import AddScheduleScreen from '../screens/home/AddScheduleScreen';
import UserScDetailScreen from '../screens/home/UserScDetailScreen';
import InviteCodeScreen from '../setting/settingMenu/InviteCodeScreen';
import LoadingScreen from '../Loading/LoadingScreen';
import {AuthContext} from '../auth/AuthContext';
import {Schedule} from '../types/type';

export interface UserScDetailParams {
  userId: string;
  userName: string;
  profileImage: string;
  roomId: string;
  roomName: string;
  schedules: Schedule[];
  startDate: string;
  endDate: string;
}

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
  UserScDetail: UserScDetailParams;
  Settings: undefined;
  InviteCode: undefined;
  ChangeNickName: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  const {initialized} = useContext(AuthContext);

  if (!initialized) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChoiceRoom" component={ChoiceRoom} />
        <Stack.Screen name="MakeRoom" component={MakeRoom} />
        <Stack.Screen name="WritingCode" component={WritingCode} />
        <Stack.Screen name="ExistChoiceRoom" component={ExistChoiceRoom} />
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
        <Stack.Screen name="UserScDetail" component={UserScDetailScreen} />
        <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
