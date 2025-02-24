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
  BackHandler,
} from 'react-native';
import {AuthContext} from '../../auth/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import {Colors, scheduleColors} from '../../constants/Colors';
import {Calendar} from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Day, Schedule} from '../../types/type';
import firestore from '@react-native-firebase/firestore';
import FastImage from 'react-native-fast-image';
type MarkedDates = {
  [date: string]: {
    dots?: {color: string}[];
  };
};

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    user,
    currentRoom,
    setCurrentRoom,
    setUserProfileImage,
    justLoggedIn,
    userProfileImage,
  } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateDetail, setDateDetail] = useState(false);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<
    Schedule[]
  >([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return true;
      },
    );
    return () => backHandler.remove();
  }, []);

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
    // 로그인은 되어있지만 방이 선택되지 않은 경우
    if (!currentRoom && user) {
      navigation.replace('ChoiceRoom');
      return;
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
    const fetchUserProfile = async () => {
      if (!user?.userId) {
        return;
      }

      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.userId)
          .get();

        const userData = userDoc.data();
        if (
          userData?.profileImage &&
          userData.profileImage !== userProfileImage
        ) {
          setUserProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error('프로필 이미지 로딩 오류:', error);
      }
    };

    fetchUserProfile();
  }, [user?.userId, userProfileImage, setUserProfileImage]);

  useEffect(() => {
    if (!currentRoom?.roomId) {
      return;
    }

    const unsubscribe = firestore()
      .collection('rooms')
      .doc(currentRoom.roomId)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const roomData = snapshot.data();
            if (roomData) {
              if (
                currentRoom.roomName === roomData.roomName &&
                currentRoom.inviteCode === roomData.inviteCode &&
                JSON.stringify(currentRoom.members) ===
                  JSON.stringify(roomData.members)
              ) {
                return;
              }
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

    return () => unsubscribe();
  }, [currentRoom, setCurrentRoom]);

  useEffect(() => {
    if (
      !user?.userId ||
      !userProfileImage ||
      !currentRoom?.members?.[user.userId] ||
      currentRoom.members[user.userId].profileImage === userProfileImage
    ) {
      return;
    }

    const updatedMembers = {
      ...currentRoom.members,
      [user.userId]: {
        ...currentRoom.members[user.userId],
        profileImage: userProfileImage,
      },
    };

    firestore()
      .collection('rooms')
      .doc(currentRoom.roomId)
      .update({
        members: updatedMembers,
      })
      .catch(error => {
        console.error('프로필 이미지 업데이트 오류:', error);
      });
  }, [user?.userId, userProfileImage, currentRoom]);

  const addScheduleHandler = () => {
    navigation.navigate('AddSchedule');
  };

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
        horizontal
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
                startDate:
                  currentRoom.members[userId]?.schedules?.[0]?.scheduleDate ??
                  '',
                endDate:
                  currentRoom.members[userId]?.schedules?.[0]
                    ?.scheduleEndDate ?? '',
              })
            }>
            {currentRoom.members[userId]?.profileImage ? (
              <View>
                <FastImage
                  style={styles.userImage}
                  source={{
                    uri: currentRoom.members[userId]?.profileImage || '',
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <Text style={{textAlign: 'center', marginTop: 4}}>
                  {currentRoom.members[userId]?.nickname}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.userImage}>
                  <Ionicons name="person-outline" size={24} color="black" />
                </View>
                <Text style={{textAlign: 'center', marginTop: 4}}>
                  {currentRoom.members[userId]?.nickname}
                </Text>
              </>
            )}
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
          setSelectedDate(day.dateString);
          setDateDetail(true);
          if (dateDetail) {
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
                <Text style={styles.userScheduleHeader}>
                  🏷닉네임 : {userName}
                </Text>
                {schedules.map(schedule => (
                  <View key={schedule.scheduleId} style={styles.scheduleItem}>
                    <Text style={styles.scheduleTitle}>
                      📅 스케쥴 : {schedule.scheduleTitle}
                    </Text>
                    <Text style={styles.scheduleContent}>
                      📝 내용 : {schedule.scheduleContent}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          {Object.keys(groupedSchedules).length === 0 && (
            <Text>일정이 없어요</Text>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.GRAY,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
  },
  roomText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
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
    color: Colors.PRIMARY,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  scheduleItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DARK_GRAY,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.GRAY_TITLE,
    marginBottom: 3,
  },
  scheduleContent: {
    fontSize: 14,
    color: Colors.GRAY_CONTENT,
    lineHeight: 20,
  },
});

export default HomeScreen;
