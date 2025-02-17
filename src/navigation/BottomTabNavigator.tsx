import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from '../screens/home/HomeScreen';
import SettingScreen from '../setting/SettingScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Colors} from '../constants/Colors';
const Tab = createBottomTabNavigator();

const getTabBarIcon =
  (route: any) =>
  ({focused}: {focused: boolean}) => {
    if (route.name === 'Home') {
      return (
        <Ionicons
          name="home"
          color={focused ? Colors.PRIMARY : Colors.PRIMARY_SUB}
          size={focused ? 24 : 20}
        />
      );
    }
    return (
      <Ionicons
        name="settings"
        color={focused ? Colors.PRIMARY : Colors.PRIMARY_SUB}
        size={focused ? 24 : 20}
      />
    );
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
