import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/navigations';
import {Schedule} from '../../types/type';
import Header from '../../components/header/header';
import {Colors} from '../../constants/Colors';
import {formatDate} from '../../components/DateFormat';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 일정 카드 컴포넌트
interface ScheduleCardProps {
  schedule: Schedule;
  index: number;
}

const ScheduleCard = ({schedule, index}: ScheduleCardProps) => {
  const isSameDay =
    formatDate(schedule.scheduleDate) === formatDate(schedule.scheduleEndDate);

  return (
    <View style={styles.scheduleCard}>
      <View
        style={[
          styles.importanceIndicator,
          schedule.isImportant && styles.importantIndicator,
        ]}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{index + 1}</Text>
          </View>
          <Text style={styles.scheduleTitleText}>{schedule.scheduleTitle}</Text>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.iconTextRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.PRIMARY}
            />
            {isSameDay ? (
              <Text style={styles.scheduleText}>
                {formatDate(schedule.scheduleDate)} 종일
              </Text>
            ) : (
              <Text style={styles.scheduleText}>
                {formatDate(schedule.scheduleDate)} ~{' '}
                {formatDate(schedule.scheduleEndDate)}
              </Text>
            )}
          </View>

          {schedule.scheduleContent && (
            <View style={styles.iconTextRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={Colors.PRIMARY}
              />
              <Text style={styles.scheduleText}>
                {schedule.scheduleContent}
              </Text>
            </View>
          )}

          <View style={styles.iconTextRow}>
            <Ionicons name="person-outline" size={16} color={Colors.PRIMARY} />
            <Text style={styles.scheduleText}>{schedule.userName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 빈 일정 상태 컴포넌트
const EmptySchedule = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="calendar-outline" size={60} color={Colors.LIGHT_GRAY} />
    <Text style={styles.emptyText}>일정이 없습니다.</Text>
    <Text style={styles.emptySubText}>새로운 일정을 추가해보세요!</Text>
  </View>
);

const UserScDetailScreen = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'UserScDetail'>>();
  const schedules = Array.isArray(params.schedules) ? params.schedules : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.WHITE} barStyle="dark-content" />
      <Header title={`${params.userName}님의 일정`} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {params.userName
                  ? params.userName.charAt(0).toUpperCase()
                  : '?'}
              </Text>
            </View>
            <Text style={styles.titleText}>{params.userName}님의 일정</Text>
          </View>
          <Text style={styles.scheduleCount}>
            총 {schedules.length}개의 일정
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.subTitleText}>일정 상세</Text>

        {schedules.length === 0 ? (
          <EmptySchedule />
        ) : (
          <View style={styles.scheduleList}>
            {schedules.map((schedule: Schedule, index: number) => (
              <ScheduleCard
                key={schedule.scheduleId || index}
                schedule={schedule}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.WHITE,
    fontSize: 22,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  scheduleCount: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
    marginLeft: 62, // avatar width + margin
  },
  divider: {
    height: 1,
    backgroundColor: Colors.LIGHT_GRAY,
    marginBottom: 20,
  },
  subTitleText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.DARK_GRAY,
  },
  scheduleList: {
    marginBottom: 16,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0.8,
    borderColor: Colors.LIGHT_GRAY,
    overflow: 'hidden',
  },
  importanceIndicator: {
    width: 6,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  importantIndicator: {
    backgroundColor: Colors.PRIMARY,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  scheduleDetails: {
    marginLeft: 42, // countContainer width + marginRight
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.DARK_GRAY,
    flex: 1,
  },
  scheduleText: {
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.DARK_GRAY,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
  },
});

export default UserScDetailScreen;
