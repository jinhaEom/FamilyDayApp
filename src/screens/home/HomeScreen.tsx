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
  Dimensions,
} from 'react-native';
import {AuthContext} from '../../auth/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  RootStackParamList,
  UserScDetailParams,
} from '../../navigation/Navigations';
import {Colors} from '../../constants/Colors';
import {Calendar, LocaleConfig, DateData} from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Schedule} from '../../types/type';
import FastImage from 'react-native-fast-image';
import {useCalendarData} from '../../hooks/useCalendarData';
import {useRoomSync} from '../../hooks/useRoomSync';

const {width} = Dimensions.get('window');

// 날짜 관련 설정
LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  dayNames: [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
};
LocaleConfig.defaultLocale = 'ko';

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

  const formatDisplayDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return date.toLocaleDateString('ko-KR', options);
  }, []);

  return {formatDate, getDatesInRange, formatDisplayDate};
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

// 멤버 아바타 컴포넌트
interface MemberAvatarProps {
  member: {
    profileImage?: string | null;
    nickname: string;
  };
  onPress: () => void;
}

const MemberAvatar = ({member, onPress}: MemberAvatarProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.memberAvatarContainer}>
      {member.profileImage ? (
        <View style={styles.avatarWrapper}>
          <FastImage
            style={styles.userImage}
            source={{
              uri: member.profileImage || '',
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
      ) : (
        <View style={styles.avatarWrapper}>
          <View style={styles.defaultAvatar}>
            <Ionicons name="person" size={24} color={Colors.PRIMARY} />
          </View>
        </View>
      )}
      <Text style={styles.memberName}>{member.nickname}</Text>
    </TouchableOpacity>
  );
};

// 중요 일정 카드 컴포넌트
interface ImportantScheduleCardProps {
  schedule: Schedule;
  onPress: () => void;
}

const ImportantScheduleCard = ({
  schedule,
  onPress,
}: ImportantScheduleCardProps) => {
  return (
    <TouchableOpacity
      style={styles.importantScheduleCard}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.importantScheduleGradient}>
        <View style={styles.importantScheduleHeader}>
          <Ionicons name="calendar" size={16} color={Colors.WHITE} />
          <Text style={styles.importantScheduleDate}>
            {new Date(schedule.scheduleDate).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.importantScheduleTitle} numberOfLines={2}>
          {schedule.scheduleTitle}
        </Text>
        <View style={styles.importantScheduleFooter}>
          <Ionicons name="person-outline" size={14} color={Colors.WHITE} />
          <Text style={styles.importantScheduleOwner}>{schedule.userName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 일정 항목 컴포넌트
interface ScheduleItemProps {
  schedule: Schedule;
  onPress: () => void;
}

const ScheduleItem = ({schedule, onPress}: ScheduleItemProps) => {
  return (
    <TouchableOpacity
      style={styles.scheduleItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={[
          styles.scheduleColorDot,
          {
            backgroundColor: schedule.isImportant
              ? Colors.PRIMARY
              : Colors.SECONDARY,
          },
        ]}
      />
      <View style={styles.scheduleContent}>
        <Text style={styles.scheduleTitle}>{schedule.scheduleTitle}</Text>
        <Text style={styles.scheduleTime}>
          {new Date(schedule.scheduleDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' - '}
          {new Date(schedule.scheduleEndDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <View style={styles.scheduleOwner}>
        <Text style={styles.ownerName}>{schedule.userName}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.DARK_GRAY} />
    </TouchableOpacity>
  );
};

// 헤더 컴포넌트
interface HeaderProps {
  roomName: string;
}

const Header = ({roomName}: HeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.roomName}>{roomName} Room</Text>
    </View>
  );
};

// 메인 컴포넌트
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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [dateDetail, setDateDetail] = useState(false);

  const {formatDate, getDatesInRange, formatDisplayDate} = useDateUtils();
  const slideAnim = useDetailAnimation(dateDetail);

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
  }, [currentRoom, navigation, user, userProfileImage]);

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

  // 상세 일정 열기/닫기 애니메이션 스타일
  const detailViewStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [600, 0],
        }),
      },
    ],
    opacity: slideAnim,
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
    setDateDetail(true);
  };

  // 멤버 아바타 클릭 시 처리 함수
  const handleMemberScheduleView = (memberId: string) => {
    if (!currentRoom) {
      return;
    }

    const member = currentRoom.members[memberId];
    if (!member) {
      return;
    }

    const params: UserScDetailParams = {
      userId: memberId,
      userName: member.nickname,
      profileImage: member.profileImage || '',
      roomId: currentRoom.roomId,
      roomName: currentRoom.roomName,
      schedules: member.schedules || [],
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };

    navigation.navigate('UserScDetail', params);
  };

  if (!currentRoom) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        <Header roomName={currentRoom.roomName} />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>구성원</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.membersScrollView}
            contentContainerStyle={styles.membersContainer}>
            {Object.keys(currentRoom.members || {}).map(userId => (
              <MemberAvatar
                key={userId}
                member={currentRoom.members[userId]}
                onPress={() => handleMemberScheduleView(userId)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 캘린더 섹션 */}
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            markingType={'multi-dot'}
            onDayPress={handleDateSelect}
            monthFormat={'yyyy년 MM월'}
            hideExtraDays={true}
            firstDay={0}
            enableSwipeMonths={true}
            theme={{
              todayTextColor: Colors.PRIMARY,
              arrowColor: Colors.PRIMARY,
              selectedDayBackgroundColor: Colors.PRIMARY,
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
              'stylesheet.calendar.header': {
                header: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                },
              },
            }}
          />
        </View>

        {/* 중요 일정 섹션 */}
        {importantSchedules.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="star" size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>중요 일정</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.importantSchedulesContainer}>
              {importantSchedules.map(schedule => (
                <ImportantScheduleCard
                  key={schedule.scheduleId}
                  schedule={schedule}
                  onPress={() => {
                    const scheduleDate = formatDate(schedule.scheduleDate);
                    if (scheduleDate) {
                      setSelectedDate(scheduleDate);
                      setDateDetail(true);
                    }
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={addScheduleHandler}
        activeOpacity={0.8}>
        <Ionicons name="add" size={24} color={Colors.WHITE} />
      </TouchableOpacity>
      {/* 상세 일정 슬라이드 업 패널 */}
      <Animated.View style={[styles.detailView, detailViewStyle]}>
        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.detailDate}>
              {formatDisplayDate(selectedDate)}
            </Text>
            <Text style={styles.scheduleCount}>
              {selectedDateSchedules.length}개의 일정
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setDateDetail(false)}>
            <Ionicons name="close" size={24} color={Colors.DARK_GRAY} />
          </TouchableOpacity>
        </View>

        {selectedDateSchedules.length === 0 ? (
          <View style={styles.emptyScheduleContainer}>
            <Ionicons
              name="calendar-outline"
              size={50}
              color={Colors.LIGHT_GRAY}
            />
            <Text style={styles.emptyScheduleText}>일정이 없습니다</Text>
            <TouchableOpacity
              style={styles.addScheduleButton}
              onPress={addScheduleHandler}>
              <Text style={styles.addScheduleButtonText}>일정 추가하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.detailScrollView}
            showsVerticalScrollIndicator={false}>
            {Object.entries(groupedSchedules).map(([userName, schedules]) => (
              <View key={userName} style={styles.scheduleGroup}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>{userName}의 일정</Text>
                </View>
                {schedules.map(schedule => (
                  <ScheduleItem
                    key={schedule.scheduleId}
                    schedule={schedule}
                    onPress={() => {
                      handleMemberScheduleView(schedule.userId || '');
                    }}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

// 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.WHITE,
  },
  roomName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  sectionContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginLeft: 5,
  },
  membersScrollView: {
    marginTop: 10,
  },
  membersContainer: {
    paddingBottom: 10,
  },
  memberAvatarContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  avatarWrapper: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_LIGHT,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.DARK_GRAY,
  },
  calendarContainer: {
    marginTop: 20,
    marginBottom: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    borderWidth: 0.8,
    borderColor: Colors.LIGHT_GRAY,
    marginHorizontal: 20,
    padding: 10,
  },
  importantSchedulesContainer: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  importantScheduleCard: {
    width: width * 0.6,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  importantScheduleGradient: {
    padding: 15,
    height: 120,
    justifyContent: 'space-between',
    backgroundColor: Colors.PRIMARY,
    borderRadius: 15,
  },
  importantScheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importantScheduleDate: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.WHITE,
    marginLeft: 5,
  },
  importantScheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.WHITE,
    marginVertical: 10,
  },
  importantScheduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importantScheduleOwner: {
    fontSize: 12,
    color: Colors.WHITE,
    marginLeft: 5,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  scheduleCount: {
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  detailScrollView: {
    flex: 1,
  },
  scheduleGroup: {
    marginBottom: 20,
  },
  groupHeader: {
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  groupHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    marginBottom: 10,
  },
  scheduleColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.DARK_GRAY,
    marginBottom: 5,
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  scheduleOwner: {
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 10,
  },
  ownerName: {
    fontSize: 10,
    color: Colors.DARK_GRAY,
  },
  emptyScheduleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyScheduleText: {
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 10,
    marginBottom: 20,
  },
  addScheduleButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addScheduleButtonText: {
    color: Colors.WHITE,
    fontWeight: '500',
  },
});

export default HomeScreen;
