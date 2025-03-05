import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {Colors} from '../../constants/Colors';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../auth/AuthContext';
import auth from '@react-native-firebase/auth';

export default function WritingCode() {
  const [inviteCode, setInviteCode] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [nickname, setNickname] = useState('');

  // 깜빡임 효과를 위한 useEffect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(cursorInterval);
    };
  }, []);

  const inputRef = useRef<TextInput>(null);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {setCurrentRoom} = useContext(AuthContext);

  const handleJoinRoom = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      Alert.alert('알림', '6자리 초대 코드를 입력해주세요.');
      return;
    }

    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const query = firestore()
        .collection('rooms')
        .where('inviteCode', '==', inviteCode.toUpperCase());

      const snapshot = await query.get();

      if (snapshot.empty) {
        Alert.alert('오류', '유효하지 않은 초대 코드입니다.');
        return;
      }

      const roomDoc = snapshot.docs.find(
        doc => doc.data().inviteCode === inviteCode.toUpperCase(),
      );

      if (!roomDoc) {
        Alert.alert('오류', '유효하지 않은 초대 코드입니다.');
        return;
      }

      const roomData = roomDoc.data();

      // 이미 방에 참여한 멤버인지 확인
      //   if (roomData.members && roomData.members[userId]) {
      //     Alert.alert('알림', '이미 참여한 방입니다.');
      //     return;
      //   }
      if (roomData.members && roomData.members[userId]) {
        // users 컬렉션에 현재 방 정보 저장
        await firestore().collection('users').doc(userId).update({
          currentRoomId: roomDoc.id,
          currentRoomName: roomData.roomName,
        });

        setCurrentRoom({
          roomId: roomDoc.id,
          roomName: roomData.roomName,
          inviteCode: inviteCode.toUpperCase(),
          createdAt: roomData.createdAt,
          members: roomData.members,
        });

        navigation.replace('MainTabs', {
          roomId: roomDoc.id,
          roomName: roomData.roomName,
          nickname: roomData.members[userId].nickname,
          inviteCode: inviteCode.toUpperCase(),
        });
        return;
      }

      setShowNicknameDialog(true); // 닉네임 입력 다이얼로그 표시
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('오류', '방 참여 중 오류가 발생했습니다.');
    }
  };

  const handleNicknameSubmit = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const roomDoc = await firestore()
        .collection('rooms')
        .where('inviteCode', '==', inviteCode.toUpperCase())
        .get();

      if (roomDoc.empty) {
        Alert.alert('오류', '유효하지 않은 초대 코드입니다.');
        return;
      }

      const roomData = roomDoc.docs[0].data();

      await firestore()
        .collection('rooms')
        .doc(roomDoc.docs[0].id)
        .update({
          [`members.${userId}`]: {
            nickname: nickname,
            role: 'member',
          },
        });

      // users 컬렉션에 현재 방 정보 저장
      await firestore().collection('users').doc(userId).update({
        currentRoomId: roomDoc.docs[0].id,
        currentRoomName: roomData.roomName,
      });

      setCurrentRoom({
        roomId: roomDoc.docs[0].id,
        roomName: roomData.roomName,
        inviteCode: inviteCode.toUpperCase(),
        createdAt: roomData.createdAt,
        members: {
          ...roomData.members,
          [userId]: {
            nickname: nickname,
            role: 'member',
          },
        },
      });

      setShowNicknameDialog(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs', params: {
          roomId: roomDoc.docs[0].id,
          roomName: roomData.roomName,
          nickname: nickname,
          inviteCode: inviteCode.toUpperCase(),
        }},
        ],
      });
    } catch (error) {
      console.error('Error updating room members:', error);
      Alert.alert('오류', '방 참여 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleCodeChange = (text: string) => {
    // 숫자와 영문자만 허용하고 6자리로 제한
    const filteredText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (filteredText.length <= 6) {
      setInviteCode(filteredText);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>방 코드 입력</Text>
      <View style={styles.codeContainer}>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={inviteCode}
          onChangeText={handleCodeChange}
          maxLength={6}
          autoCapitalize="characters"
          autoFocus={true}
        />

        {Array(6)
          .fill(0)
          .map((_, index) => {
            const char = inviteCode[index] || '';
            const isCurrentIndex =
              index === inviteCode.length && inviteCode.length < 6;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.codeBox, isCurrentIndex && styles.codeBoxActive]}
                onPress={() => inputRef.current?.focus()}>
                {char ? (
                  <Text style={styles.codeText}>{char}</Text>
                ) : isCurrentIndex && showCursor ? (
                  <Text style={styles.cursor}>|</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleJoinRoom}>
          <Text style={styles.buttonText}>입력</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2} onPress={handleCancel}>
          <Text style={styles.buttonText2}>취소</Text>
        </TouchableOpacity>
      </View>

      {showNicknameDialog && (
        <View style={styles.dialogContainer}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>닉네임 입력</Text>
            <TextInput
              style={styles.dialogInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
            />
            <View style={styles.dialogButtonContainer}>
              <TouchableOpacity
                style={styles.dialogButton}
                onPress={() => setShowNicknameDialog(false)}>
                <Text style={styles.dialogButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonPrimary]}
                onPress={handleNicknameSubmit}>
                <Text style={styles.dialogButtonTextPrimary}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const BOX_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.WHITE,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.PRIMARY,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  codeBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 8,
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxActive: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  // 깜빡이는 커서 스타일
  cursor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  button2: {
    backgroundColor: Colors.LIGHT_GRAY,
    padding: 12,
    borderRadius: 18,
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
  dialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 15,
  },
  dialogButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogButton: {
    padding: 8,
    marginLeft: 10,
  },
  dialogButtonPrimary: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 4,
  },
  dialogButtonText: {
    color: Colors.PRIMARY,
  },
  dialogButtonTextPrimary: {
    color: Colors.WHITE,
  },
});
