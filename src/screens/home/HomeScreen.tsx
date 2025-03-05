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
import {Colors} from '../../constants/Colors';
import {Calendar} from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Day, Schedule} from '../../types/type';
import FastImage from 'react-native-fast-image';
import {useCalendarData} from '../../hooks/useCalendarData';
import {useRoomSync} from '../../hooks/useRoomSync';

// 날짜 유틸리티 훅
const useDateUtils = () => {
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

  const getDatesInRange = useCallback(
    (startDate: string, endDate: string): string[] => {
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);
      while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    },
    [],
  );

  return {formatDate, getDatesInRange};
};

// 애니메이션 훅
const useDetailAnimation = (dateDetail: boolean) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: dateDetail ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [dateDetail, slideAnim]);

  return slideAnim;
};

// 뒤로가기 방지 훅
// const useBackHandler = () => {
//   useEffect(() => {
//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       () => {
//         return true;
//       },
//     );
//     return () => backHandler.remove();
//   }, []);
// };

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    user,
    currentRoom,
    setCurrentRoom,
    setUserProfileImage,
    userProfileImage,
  } = useContext(AuthContext);

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateDetail, setDateDetail] = useState(false);

  // 커스텀 훅 사용
  const {formatDate, getDatesInRange} = useDateUtils();
  const slideAnim = useDetailAnimation(dateDetail);
//   useBackHandler();

  // 방 데이터 동기화
  useRoomSync(
    currentRoom,
    setCurrentRoom,
    user,
    userProfileImage,
    setUserProfileImage,
  );

  // 캘린더 데이터 관리
  const {markedDates, selectedDateSchedules, importantSchedules} =
    useCalendarData(currentRoom, selectedDate, formatDate, getDatesInRange);

  // 방 선택 화면으로 이동
  useEffect(() => {
    if (!currentRoom && user) {
      navigation.replace('ChoiceRoom');
    }
  }, [currentRoom, navigation, user]);

  // 일정 추가 핸들러
  const addScheduleHandler = useCallback(() => {
    navigation.navigate('AddSchedule');
  }, [navigation]);

  // 일정 그룹화
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

      {importantSchedules.length > 0 && (
        <View style={styles.importantSchedulesContainer}>
          <View style={styles.importantSchedulesHeader}>
            <Ionicons name="star" size={20} color={Colors.PRIMARY} />
            <Text style={styles.importantSchedulesTitle}>중요 일정</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.importantSchedulesContent}>
            {importantSchedules.map(schedule => (
              <TouchableOpacity
                key={schedule.scheduleId}
                style={styles.importantScheduleItem}
                onPress={() => {
                  const scheduleDate = formatDate(schedule.scheduleDate);
                  if (scheduleDate) {
                    setSelectedDate(scheduleDate);
                    setDateDetail(true);
                  }
                }}>
                <View style={styles.importantScheduleHeader}>
                  <Ionicons name="calendar" size={16} color={Colors.PRIMARY} />
                  <Text style={styles.importantScheduleDate}>
                    {new Date(schedule.scheduleDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.importantScheduleTitle} numberOfLines={2}>
                  {schedule.scheduleTitle}
                </Text>
                <Text style={styles.importantScheduleOwner}>
                  {schedule.userName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
                    {schedule.isImportant && (
                      <Text style={styles.importantTag}>⭐ 중요</Text>
                    )}
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
  importantTag: {
    fontSize: 14,
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    marginTop: 5,
  },
  importantSchedulesContainer: {
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  importantSchedulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  importantSchedulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginLeft: 5,
  },
  importantSchedulesContent: {
    paddingHorizontal: 5,
    paddingBottom: 5,
  },
  importantScheduleItem: {
    width: 150,
    height: 100,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderLeftWidth: 8,
    borderLeftColor: Colors.PRIMARY,
    justifyContent: 'space-between',
  },
  importantScheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importantScheduleDate: {
    fontSize: 12,
    color: Colors.GRAY_TITLE,
    marginLeft: 5,
  },
  importantScheduleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginVertical: 5,
  },
  importantScheduleOwner: {
    fontSize: 12,
    color: Colors.GRAY_CONTENT,
    textAlign: 'right',
  },
});

export default HomeScreen;
