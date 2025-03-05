import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Colors} from '../../constants/Colors';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import firestore from '@react-native-firebase/firestore';
import {useContext} from 'react';
import {AuthContext} from '../../auth/AuthContext';

// 6자리 랜덤 코드 생성 함수
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function MakeRoom() {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const {user, setCurrentRoom} = useContext(AuthContext);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleCreateRoom = async () => {
    console.log('handleCreateRoom 호출됨');

    if (!roomName.trim() || !nickname.trim()) {
      console.log('입력값 부족: roomName 또는 nickname이 비어 있음');
      Alert.alert('알림', '방 이름과 닉네임을 모두 입력해주세요.');
      return;
    }

    try {
      // 1. 초대 코드 생성
      const inviteCode = generateInviteCode();
      console.log('생성된 초대 코드:', inviteCode);

      // 2. 초대 코드 중복 확인
      console.log('초대 코드 중복 확인 시작');
      const snapshot = await firestore()
        .collection('rooms')
        .where('inviteCode', '==', inviteCode)
        .get();

      if (!snapshot.empty) {
        console.log('중복된 초대 코드 발견. 방 생성 중단');
        Alert.alert('오류', '방 생성에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 3. 새로운 방 생성
      console.log('새로운 방 생성 중...');
      const newRoomRef = firestore().collection('rooms').doc();
      console.log('새로운 방 레퍼런스 ID:', newRoomRef.id);

      if (user == null) {
        return;
      }

      const roomData = {
        roomName: roomName,
        inviteCode: inviteCode,
        createdAt: firestore.FieldValue.serverTimestamp(),
        members: {
          [user.userId]: {
            nickname: nickname,
            role: 'owner',
          },
        },
      };

      await newRoomRef.set(roomData);
      console.log('새로운 방 데이터 설정 완료.');

      // users 컬렉션에 현재 방 정보 저장 - set으로 변경
      await firestore().collection('users').doc(user.userId).set(
        {
          currentRoomId: newRoomRef.id,
          currentRoomName: roomName,
          userId: user.userId,
          email: user.email,
          name: user.name,
        },
        {merge: true},
      ); // merge 옵션 추가

      // currentRoom 상태 업데이트
      setCurrentRoom({
        roomId: newRoomRef.id,
        roomName: roomName,
        inviteCode: inviteCode,
        createdAt: firestore.FieldValue.serverTimestamp(),
        members: {
          [user.userId]: {
            nickname: nickname,
            role: 'owner',
          },
        },
      });

      // 4. Home 화면으로 이동
      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs', params: {
          roomId: newRoomRef.id,
          roomName: roomName,
          nickname: nickname,
          inviteCode: inviteCode,
        }},
        ],
      });
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('오류', '방 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>방 생성</Text>
      <Text style={styles.descriptionText}>
        방을 생성하여 가족을 초대해보세요!
      </Text>
      <TextInput
        style={styles.input}
        placeholder="방 이름을 입력해주세요"
        value={roomName}
        placeholderTextColor={Colors.GRAY}
        onChangeText={setRoomName}
      />
      <TextInput
        style={styles.input}
        placeholder="닉네임"
        placeholderTextColor={Colors.GRAY}
        value={nickname}
        onChangeText={setNickname}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreateRoom}>
        <Text style={styles.buttonText}>방 생성</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button2} onPress={handleCancel}>
        <Text style={styles.buttonText2}>취소</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: Colors.GRAY,
    backgroundColor: Colors.LIGHT_GRAY,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: Colors.PRIMARY,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.PRIMARY,
  },
  descriptionText: {
    fontSize: 16,
    marginBottom: 20,
    color: Colors.GRAY,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 18,
    marginBottom: 24,
  },
  button2: {
    backgroundColor: Colors.LIGHT_GRAY,
    padding: 12,
    borderRadius: 18,
    marginBottom: 24,
  },
  buttonText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonText2: {
    color: Colors.PRIMARY,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
