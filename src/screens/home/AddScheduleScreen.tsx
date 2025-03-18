import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import {Colors} from '../../constants/Colors';
import AppBasicButton from '../../components/AppBasicButton';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {AuthContext} from '../../auth/AuthContext';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Schedule} from '../../types/type';
import {format} from 'date-fns';
import {ko} from 'date-fns/locale';
import InfoTextInput from '../../components/InfoTextInput';

// 헤더 컴포넌트
interface HeaderProps {
  title: string;
  onBack: () => void;
}

const Header = ({title, onBack}: HeaderProps) => {
  return (
    <View className="flex-row items-center justify-between p-4">
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
      </TouchableOpacity>
      <View className="flex-1 items-center">
        <Text className="text-[18px] font-bold text-PRIMARY">{title}</Text>
      </View>
    </View>
  );
};

interface DatePickerFieldProps {
  label: string;
  date: Date;
  onPress: () => void;
}

const DatePickerField = ({label, date, onPress}: DatePickerFieldProps) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-bold text-DARK_GRAY mb-2">{label}</Text>
      <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between bg-LIGHT_GRAY rounded-lg p-2 border border-GRAY">
        <Text className="text-sm text-DARK_GRAY">
          {format(date, 'yyyy년 MM월 dd일 (eee)', {locale: ko})}
        </Text>
        <Ionicons name="calendar" size={20} color={Colors.PRIMARY} />
      </TouchableOpacity>
    </View>
  );
};

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0: 월요일, 1: 화요일, ...

  const handleConfirm = (date: Date) => {
    setDatePickerVisibility(false);
    if (dateType === 'start') {
      setStartDate(date);
      // 만약 시작일이 종료일보다 나중이면 종료일도 같이 업데이트
      if (date > endDate) {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
    }
  };

  const toggleDay = (index: number) => {
    setSelectedDays(prev => {
      if (prev.includes(index)) {
        return prev.filter(day => day !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleScheduleAdd = async (roomId: string, userId: string) => {
    if (!scheduleName.trim()) {
      Alert.alert('알림', '일정 이름을 입력해주세요.');
      return;
    }

    if (!scheduleContent.trim()) {
      Alert.alert('알림', '일정 내용을 입력해주세요.');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('알림', '종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const schedules: Schedule[] = [];
      let currentDate = new Date(startDate);

      // 시작일부터 종료일까지 반복
      while (currentDate <= endDate) {
        // 선택된 요일이 있는 경우, 해당 요일에만 일정 추가
        if (
          selectedDays.length === 0 ||
          selectedDays.includes(currentDate.getDay())
        ) {
          const scheduleData: Schedule = {
            scheduleId: `${new Date().getTime()}_${currentDate.getTime()}`,
            scheduleTitle: scheduleName.trim(),
            scheduleContent: scheduleContent.trim(),
            scheduleDate: currentDate.toISOString(),
            userName: user?.name || '',
            scheduleEndDate: currentDate.toISOString(), // 반복 일정의 경우 종료일도 같은 날짜로 설정
            createdAt: firestore.Timestamp.now(),
            userId: userId,
            isImportant: isImportant,
          };
          schedules.push(scheduleData);
        }
        // 다음 날짜로 이동
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const roomRef = firestore().collection('rooms').doc(roomId);
      const roomDoc = await roomRef.get();
      const roomData = roomDoc.data();

      if (!roomData || !roomData.members || !roomData.members[userId]) {
        throw new Error('방 또는 사용자 정보를 찾을 수 없습니다.');
      }

      const currentSchedules = roomData.members[userId].schedules || [];
      const updatedSchedules = [...currentSchedules, ...schedules];

      // Firestore에 업데이트
      await roomRef.update({
        [`members.${userId}.schedules`]: updatedSchedules,
      });

      await refreshSchedules();

      Alert.alert('성공', '일정이 등록되었습니다.');

      setTimeout(() => {
        navigation.goBack();
      }, 300);
    } catch (error) {
      console.error('일정 등록 중 오류:', error);
      Alert.alert('오류', '일정 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDatePickerVisibility(false);
  };

  const handleToggleImportant = () => {
    setIsImportant(!isImportant);
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Header title="일정 등록하기" onBack={() => navigation.goBack()} />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.formContainer}>
            <InfoTextInput
              value={scheduleName}
              onChangeText={setScheduleName}
              placeholder="일정 이름을 입력하세요"
            />

            <InfoTextInput
              value={scheduleContent}
              onChangeText={setScheduleContent}
              placeholder="일정 상세 내용을 입력하세요"
              multiline={true}
              style={styles.scheduleContentInput}
            />

            <TouchableOpacity
              onPress={handleToggleImportant}
              style={styles.importantCheckboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  isImportant
                    ? {backgroundColor: Colors.PRIMARY}
                    : {backgroundColor: 'transparent'},
                ]}>
                {isImportant && (
                  <Ionicons name="checkmark" size={16} color={Colors.WHITE} />
                )}
              </View>
              <Text style={styles.importantCheckboxText}>중요 일정</Text>
            </TouchableOpacity>
            <Text className="text-lg mb-2">[매주]</Text>

            <View style={styles.weekContainer}>
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  style={[
                    styles.weekDayButton,
                    selectedDays.includes(index) && styles.weekDaySelected,
                  ]}>
                  <Text
                    style={[
                      styles.weekDayText,
                      selectedDays.includes(index) &&
                        styles.weekDayTextSelected,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="mb-4">
              <DatePickerField
                label="시작 날짜"
                date={startDate}
                onPress={() => {
                  setDateType('start');
                  setDatePickerVisibility(true);
                }}
              />

              <DatePickerField
                label="종료 날짜"
                date={endDate}
                onPress={() => {
                  setDateType('end');
                  setDatePickerVisibility(true);
                }}
              />
            </View>
          </View>
        </ScrollView>

        <View className="flex-row justify-between p-4">
          <AppBasicButton
            className="flex-1"
            onPress={() => navigation.goBack()}
            buttonBackgroundColor={Colors.LIGHT_GRAY}
            buttonTextColor={Colors.DARK_GRAY}
            disabled={isSubmitting}>
            <Text className="text-sm font-bold text-DARK_GRAY">취소</Text>
          </AppBasicButton>

          <AppBasicButton
            className="flex-1"
            onPress={() => {
              if (!currentRoom?.roomId || !user?.userId) {
                Alert.alert('오류', '사용자 또는 방 정보를 찾을 수 없습니다.');
                return;
              }
              handleScheduleAdd(currentRoom.roomId, user.userId);
            }}
            buttonBackgroundColor={Colors.PRIMARY}
            buttonTextColor={Colors.WHITE}
            disabled={isSubmitting}>
            <Text className="text-sm font-bold text-WHITE">
              {isSubmitting ? '등록 중...' : '일정 등록하기'}
            </Text>
          </AppBasicButton>
        </View>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={datePickerVisibility}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        date={dateType === 'start' ? startDate : endDate}
        confirmTextIOS="확인"
        cancelTextIOS="취소"
      />
    </>
  );
};

const styles = StyleSheet.create({

  scrollViewContent: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    shadowColor: Colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.DARK_GRAY,
  },
  importantCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleContentInput: {
    height: 300,
    paddingTop: 10,
    paddingRight: 20,
  },
  importantCheckboxText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.DARK_GRAY,
    fontWeight: '500',
  },

  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
  },


  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaySelected: {
    backgroundColor: Colors.PRIMARY,
  },
  weekDayText: {
    fontSize: 14,
    color: Colors.DARK_GRAY,
    fontWeight: '500',
  },
  weekDayTextSelected: {
    color: Colors.WHITE,
  },
});

export default AddScheduleScreen;
