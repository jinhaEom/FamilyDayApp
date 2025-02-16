import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from '../screens/home/HomeScreen';
import SettingScreen from '../setting/settingScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const getTabBarIcon =
  (route: any) =>
  ({color, size}: {color: string; size: number}) => {
    if (route.name === 'Home') {
      return <Ionicons name="home" color={color} size={size} />;
    }
    return <Ionicons name="settings" color={color} size={size} />;
  };

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: getTabBarIcon(route),
        animation: 'fade',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Setting" component={SettingScreen} />
    </Tab.Navigator>
  );
}
