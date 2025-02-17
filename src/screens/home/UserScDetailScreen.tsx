import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/navigations';
import {Schedule} from '../../types/type';
import Header from '../../components/header/header';
import {Colors} from '../../constants/Colors';
import {formatDate} from '../../components/DateFormat';

const UserScDetailScreen = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'UserScDetail'>>();

  return (
    <>
      <Header />

      <View style={styles.container}>
        <Text style={styles.titleText}>{params.userName}님의 일정</Text>

        <Text style={styles.subTitleText}>일정 상세</Text>
        {params.schedules.length === 0 ? (
          <Text style={styles.scheduleText}>일정이 없습니다.</Text>
        ) : (
          params.schedules.map((schedule: Schedule, index: number) => (
            <View style={styles.scheduleContainer} key={index}>
              <View style={styles.countContainer}>
                <Text style={styles.countText}>{index + 1}</Text>
              </View>
              <View style={{flexDirection: 'column'}}>
                <Text style={styles.scheduleTitleText}>
                  {schedule.scheduleTitle}
                </Text>
                {formatDate(schedule.scheduleDate) ===
                formatDate(schedule.scheduleEndDate) ? (
                  <Text style={styles.scheduleText}>
                    {formatDate(schedule.scheduleDate)} 종일
                  </Text>
                ) : (
                  <>
                    <Text style={styles.scheduleText}>
                      {formatDate(schedule.scheduleDate)}
                    </Text>
                    <Text style={styles.scheduleText}>
                      {formatDate(schedule.scheduleEndDate)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 20,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.PRIMARY,
  },
  subTitleText: {
    fontSize: 24,
    marginBottom: 20,
    color: Colors.PRIMARY,
  },
  scheduleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  countContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.WHITE, // 필요에 따라 색상을 변경하세요.
  },
  scheduleText: {
    marginLeft: 20,
    marginTop: 10,
    fontSize: 14,
    color: Colors.GRAY,
  },
  scheduleTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
  },
});

export default UserScDetailScreen;
