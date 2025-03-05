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
  SafeAreaView,
  StatusBar,
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
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{width: 24}} />
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
    <View style={styles.datePickerContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.datePickerButton}>
        <Text style={styles.dateText}>
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
      const scheduleData: Schedule = {
        scheduleId: new Date().getTime().toString(),
        scheduleTitle: scheduleName.trim(),
        scheduleContent: scheduleContent.trim(),
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

      const currentSchedules = roomData.members[userId].schedules || [];
      const updatedSchedules = [...currentSchedules, scheduleData];


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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.WHITE} barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <Header title="일정 등록하기" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scrollView}
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

            <View style={styles.dateContainer}>
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

        <View style={styles.buttonContainer}>
          <AppBasicButton
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            buttonBackgroundColor={Colors.LIGHT_GRAY}
            buttonTextColor={Colors.DARK_GRAY}
            disabled={isSubmitting}>
            <Text style={styles.buttonText}>취소</Text>
          </AppBasicButton>

          <AppBasicButton
            style={styles.submitButton}
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
            <Text style={styles.buttonText}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.DARK_GRAY,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
  },
  multilineInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
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
  dateContainer: {
    marginBottom: 20,
  },
  datePickerContainer: {
    marginBottom: 16,
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
  dateText: {
    color: Colors.DARK_GRAY,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    marginLeft: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddScheduleScreen;
