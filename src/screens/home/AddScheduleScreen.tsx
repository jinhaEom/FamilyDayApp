import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import {Colors} from '../../constants/Colors';
import InfoTextInput from '../../components/InfoTextInput';
import AppBasicButton from '../../components/AppBasicButton';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {useContext} from 'react';
import {AuthContext} from '../../auth/AuthContext';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Schedule} from '../../types/type';

const AddScheduleScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [scheduleName, setScheduleName] = useState<string>('');
  const [scheduleContent, setScheduleContent] = useState<string>('');
  const [datePickerVisibility, setDatePickerVisibility] =
    useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const {user, currentRoom, refreshSchedules} = useContext(AuthContext);
  const [isImportant, setIsImportant] = useState<boolean>(false);

  const handleConfirm = (date: Date) => {
    setDatePickerVisibility(false);
    if (dateType === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };
  useEffect(() => {
    console.log(user, currentRoom);
  }, [user, currentRoom]);

  const handleScheduleAdd = async (roomId: string, userId: string) => {
    if (!scheduleName || !scheduleContent) {
      Alert.alert('알림', '일정 이름과 내용을 입력해주세요.');
      return;
    }
    try {
      const scheduleData: Schedule = {
        scheduleId: new Date().getTime().toString(),
        scheduleTitle: scheduleName,
        scheduleContent: scheduleContent,
        scheduleDate: startDate.toISOString(),
        userName: user?.name || '',
        scheduleEndDate: endDate.toISOString(),
        createdAt: firestore.Timestamp.now(),
        createdBy: userId,
        isImportant: isImportant,
      };

      const roomRef = firestore().collection('rooms').doc(roomId);

      const roomDoc = await roomRef.get();
      const roomData = roomDoc.data();

      if (!roomData || !roomData.members || !roomData.members[userId]) {
        throw new Error('방 또는 사용자 정보를 찾을 수 없습니다.');
      }

      // 기존 일정 배열 가져오기 (없으면 빈 배열로 초기화)
      const currentSchedules = roomData.members[userId].schedules || [];

      // 새 일정 추가
      const updatedSchedules = [...currentSchedules, scheduleData];

      // Firestore에 업데이트
      await roomRef.update({
        [`members.${userId}.schedules`]: updatedSchedules,
      });

      await refreshSchedules();

      Alert.alert('성공', '일정이 등록되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('일정 등록 중 오류:', error);
      Alert.alert('오류', '일정 등록에 실패했습니다.');
    }
  };
  const handleCancel = () => {
    setDatePickerVisibility(false);
  };
  const handleToggleImportant = () => {
    setIsImportant(!isImportant);
  };

  return (
    <View style={{flex: 1, padding: 20}}>
      <Text style={styles.titleText}>일정 등록하기</Text>
      <InfoTextInput
        placeholder="일정 이름"
        value={scheduleName}
        onChangeText={setScheduleName}
      />
      <InfoTextInput
        placeholder="일정 내용"
        value={scheduleContent}
        onChangeText={setScheduleContent}
        multiline={true}
        style={styles.scheduleContentInput}
      />

      {/* 중요 일정 체크박스 */}
      <TouchableOpacity
        onPress={handleToggleImportant}
        style={styles.importantCheckboxContainer}>
        <Ionicons
          name={isImportant ? 'checkbox' : 'checkbox-outline'}
          size={24}
          color={isImportant ? Colors.PRIMARY : Colors.DARK_GRAY}
        />
        <Text style={styles.importantCheckboxText}>중요 일정</Text>
      </TouchableOpacity>

      <View>
        <View style={[styles.spaceBetweenBox, {marginBottom: 30}]}>
          <Text>시작 날짜</Text>
          <TouchableOpacity
            onPress={() => {
              setDateType('start');
              setDatePickerVisibility(true);
            }}>
            <View style={styles.selectDateTextContainer}>
              <Text style={styles.selectDateText}>
                {startDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color={Colors.DARK_GRAY} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.spaceBetweenBox}>
          <Text>종료 날짜</Text>
          <View style={styles.spaceBetweenBoxText}>
            <TouchableOpacity
              onPress={() => {
                setDateType('end');
                setDatePickerVisibility(true);
              }}>
              <Text style={styles.selectDateText}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <View style={{marginLeft: 4}}>
              <Ionicons name="calendar" size={20} color={Colors.DARK_GRAY} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <AppBasicButton
          style={styles.button}
          onPress={() => {
            if (!currentRoom?.roomId || !user?.userId) {
              Alert.alert('오류', '사용자 또는 방 정보를 찾을 수 없습니다.');
              return;
            }
            handleScheduleAdd(currentRoom.roomId, user.userId);
          }}
          buttonBackgroundColor={Colors.PRIMARY}
          buttonTextColor={Colors.WHITE}
          disabled={false}>
          <Text>일정 등록하기</Text>
        </AppBasicButton>
        <AppBasicButton
          style={styles.button}
          onPress={() => navigation.goBack()}
          buttonBackgroundColor={Colors.LIGHT_GRAY}
          buttonTextColor={Colors.PRIMARY}
          disabled={false}>
          <Text>취소</Text>
        </AppBasicButton>
      </View>

      <DateTimePickerModal
        isVisible={datePickerVisibility}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.PRIMARY,
  },
  selectDateText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    marginRight: 4,
  },
  selectDateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetweenBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spaceBetweenBoxText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  scheduleContentInput: {
    height: 300,
    paddingTop: 10,
    paddingRight: 20,
  },
  importantCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  importantCheckboxText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default AddScheduleScreen;
