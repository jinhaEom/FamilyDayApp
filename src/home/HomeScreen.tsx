// HomeScreen.tsx
import React, {useEffect, useRef, useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import {AuthContext} from '../auth/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/Navigations';
import {Colors} from '../constants/Colors';
import {Calendar} from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Day} from '../types/type';
import {enableFreeze} from 'react-native-screens';
const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {signOut, user, currentRoom, setCurrentRoom} = useContext(AuthContext);
  const [dateDetail, setDateDetail] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enableFreeze(false);
    console.log('dev Test');

    console.log('Current Room:', currentRoom);
    console.log('User:', user);

    if (!currentRoom) {
      navigation.replace('ChoiceRoom');
    }
  }, [currentRoom, navigation, user]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: dateDetail ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [dateDetail, slideAnim]);

  const logOutHandler = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('로그아웃 중 에러 발생:', error);
    }
  };

  if (!currentRoom) {
    return null;
  }

  return (
    <ScrollView style={{flex: 1}}>
      <Text style={styles.roomText}>{currentRoom.roomName} Room</Text>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.userContainer}
        contentContainerStyle={styles.userContentContainer}>
        {Object.keys(currentRoom.members || {}).map(userId => (
          <Text key={userId} style={styles.userText}>
            {currentRoom.members[userId]?.nickname.slice(0, 2) || user?.name[0]}
          </Text>
        ))}
      </ScrollView>
      <Calendar
        style={styles.calendar}
        onDayPress={(day: Day) => {
          setDateDetail(true);
        }}
      />
      <Animated.View
        style={[
          styles.detailContainer,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 1],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}>
        <View>
          <View style={styles.detailHeader}>
            <Text>[25-02-10]</Text>
            <TouchableOpacity onPress={() => setDateDetail(false)}>
              <Ionicons name="caret-up-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.detailContent}>
            <Text>하이 :</Text>
            <Text>오늘은 저녁회식있음</Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  roomText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.BLACK,
    padding: 24,
  },
  userContainer: {
    flexGrow: 0,
    marginTop: 12,
    padding: 20,
  },
  userContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
    borderWidth: 1,
    marginRight: 12,
    borderColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.GRAY,
    width: 80,
    height: 80,
    borderRadius: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 80,
  },
  calendar: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  detailContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    padding: 10,
    backgroundColor: Colors.LIGHT_GRAY,
    margin: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailContent: {
    flexDirection: 'row',
    marginTop: 10,
  },
});

export default HomeScreen;
