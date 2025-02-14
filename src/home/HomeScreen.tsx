// HomeScreen.tsx
import React, {
  useEffect,
  useRef,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
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
import {Day, Schedule} from '../types/type';
import {scheduleColors} from '../constants/Colors';
import firestore from '@react-native-firebase/firestore';
type MarkedDates = {
  [date: string]: {
    dots?: {color: string}[];
  };
};

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {user, currentRoom, setCurrentRoom} = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateDetail, setDateDetail] = useState(false);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<
    Schedule[]
  >([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const formatDate = useCallback((timestamp: any): string | null => {
    if (!timestamp) {
      return null;
    }

    try {
      if (timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toISOString().split('T')[0];
      }

      // 문자열인 경우
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
      }

      return null;
    } catch (error) {
      console.error('날짜 변환 중 오류:', error);
      return null;
    }
  }, []);

  // 두 날짜 사이의 날짜 배열을 반환하는 함수
  const getDatesInRange = useMemo(() => {
    return (startDate: string, endDate: string): string[] => {
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);

      while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };
  }, []);

  useEffect(() => {
    if (user != null) {
      console.log('schedules:', currentRoom?.members);
    }

    if (!currentRoom) {
      navigation.replace('ChoiceRoom');
    }
  }, [currentRoom, navigation, user]);

  useEffect(() => {
    if (!currentRoom?.members) {
      return;
    }

    const newMarkedDates: MarkedDates = {};

    Object.values(currentRoom.members).forEach(member => {
      if (member.schedules && Array.isArray(member.schedules)) {
        member.schedules.forEach((schedule: Schedule) => {
          const formattedStartDate = formatDate(schedule.scheduleDate);
          const formattedEndDate = formatDate(schedule.scheduleEndDate);

          if (formattedStartDate && formattedEndDate) {
            const dateRange = getDatesInRange(
              formattedStartDate,
              formattedEndDate,
            );
            dateRange.forEach(date => {
              if (!newMarkedDates[date]) {
                newMarkedDates[date] = {
                  dots: [{color: Colors.BLUE}],
                };
              } else {
                newMarkedDates[date].dots?.push({
                  color:
                    scheduleColors[
                      Math.floor(Math.random() * scheduleColors.length)
                    ],
                });
              }
            });
          }
        });
      }
    });

    console.log('Marked Dates:', newMarkedDates);
    setMarkedDates(newMarkedDates);
  }, [currentRoom, formatDate, getDatesInRange]);

  useEffect(() => {
    if (!currentRoom?.members || !selectedDate) {
      return;
    }

    const schedules: Schedule[] = [];
    Object.values(currentRoom.members).forEach(member => {
      if (member.schedules) {
        member.schedules.forEach((schedule: Schedule) => {
          const startDateStr = formatDate(schedule.scheduleDate);
          const endDateStr = formatDate(schedule.scheduleEndDate);

          if (startDateStr && endDateStr) {
            const dateRange = getDatesInRange(startDateStr, endDateStr);
            if (dateRange.includes(selectedDate)) {
              // schedule 객체에 작성자 정보 추가 (userName)
              schedules.push({...schedule, userName: member.nickname});
            }
          }
        });
      }
    });

    setSelectedDateSchedules(schedules);
  }, [selectedDate, currentRoom, formatDate, getDatesInRange]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: dateDetail ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [dateDetail, slideAnim]);

  useEffect(() => {
    if (!currentRoom?.roomId) {return;}

    // Firestore 실시간 리스너 설정
    const unsubscribe = firestore()
      .collection('rooms')
      .doc(currentRoom.roomId)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const roomData = snapshot.data();
            if (roomData) {
              // currentRoom 상태 업데이트
              setCurrentRoom({
                roomId: currentRoom.roomId,
                roomName: roomData.roomName,
                inviteCode: roomData.inviteCode,
                createdAt: roomData.createdAt,
                members: roomData.members || {},
              });
            }
          }
        },
        error => {
          console.error('실시간 업데이트 에러:', error);
        },
      );

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [currentRoom?.roomId, setCurrentRoom]);

  const addScheduleHandler = () => {
    navigation.navigate('AddSchedule');
  };

  // 작성자별로 일정 그룹화
  const groupedSchedules = useMemo(() => {
    const groups: {[userName: string]: Schedule[]} = {};
    selectedDateSchedules.forEach(schedule => {
      const owner = schedule.userName || 'Unknown';
      if (!groups[owner]) {
        groups[owner] = [];
      }
      groups[owner].push(schedule);
    });
    return groups;
  }, [selectedDateSchedules]);

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
          <TouchableOpacity
            key={userId}
            onPress={() =>
              navigation.navigate('UserScDetail', {
                userId,
                roomId: currentRoom.roomId,
                userName: currentRoom.members[userId]?.nickname,
                schedules: currentRoom.members[userId]?.schedules || [],
                roomName: currentRoom.roomName,
                startDate: currentRoom.members[userId]?.schedules?.[0]?.scheduleDate || '',
                endDate: currentRoom.members[userId]?.schedules?.[0]?.scheduleEndDate || '',
              })
            }>
            <Text key={userId} style={styles.userText}>
              {currentRoom.members[userId]?.nickname.slice(0, 2) ||
                user?.name[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.addButton} onPress={addScheduleHandler}>
        <Text>일정 등록하기</Text>
        <Ionicons name="add-circle-outline" size={24} color="black" />
      </TouchableOpacity>
      <Calendar
        style={styles.calendar}
        markedDates={markedDates}
        markingType={'multi-dot'}
        onDayPress={(day: Day) => {
          setDateDetail(true);
          setSelectedDate(day.dateString);
          if (dateDetail === true) {
            setDateDetail(false);
          }
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
            <Text>{selectedDate}</Text>
            <TouchableOpacity onPress={() => setDateDetail(false)}>
              <Ionicons name="caret-up-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.detailContent}>
            {Object.entries(groupedSchedules).map(([userName, schedules]) => (
              <View key={userName} style={styles.userScheduleGroup}>
                <Text style={styles.userScheduleHeader}>{userName}</Text>
                {schedules.map(schedule => (
                  <View key={schedule.scheduleId} style={styles.scheduleItem}>
                    <Text style={styles.scheduleTitle}>
                      {schedule.scheduleTitle}
                    </Text>
                    <Text style={styles.scheduleContent}>
                      {schedule.scheduleContent}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
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
    marginTop: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 10,
    marginBottom: 10,
  },
  userScheduleGroup: {
    marginBottom: 15,
  },
  userScheduleHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.BLACK,
  },
  scheduleItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  scheduleContent: {
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginTop: 4,
  },
});

export default HomeScreen;
