import {useCallback} from 'react';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {Alert} from 'react-native';
import {ToastMessage} from '../components/ToastMessage';
import {User, Room} from '../types/type';
import {Dispatch, SetStateAction} from 'react';

export const useUserProfile = (
  user: User | null,
  currentRoom: Room | null,
  setCurrentRoom: Dispatch<SetStateAction<Room | null>>,
  setUserProfileImage: (image: string | null) => void,
) => {
  // FCM 토큰 저장
  const addFcmToken = useCallback(
    async (token: string) => {
      if (!user?.userId) {
        console.warn('사용자 정보가 없어서 FCM 토큰을 저장할 수 없습니다.');
        return;
      }
      try {
        const userRef = firestore().collection('users').doc(user.userId);
        await userRef.set(
          {
            fcmToken: [token],
            lastTokenUpdated: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
        console.log('FCM 토큰 저장 성공:', token);
      } catch (error) {
        console.error('FCM 토큰 저장 중 오류:', error);
      }
    },
    [user],
  );

  // 닉네임 변경 함수
  const changeNickname = useCallback(
    async (nickname: string) => {
      if (!user?.userId || !currentRoom?.roomId) {
        Alert.alert('오류', '사용자 또는 방 정보를 찾을 수 없습니다.');
        return;
      }

      try {
        const roomRef = firestore().collection('rooms').doc(currentRoom.roomId);

        await roomRef.update({
          [`members.${user.userId}.nickname`]: nickname,
        });

        setCurrentRoom(prevRoom => {
          if (!prevRoom || !user.userId) {
            return null;
          }
          const updatedRoom: Room = {
            ...prevRoom,
            members: {
              ...prevRoom.members,
              [user.userId]: {
                ...prevRoom.members[user.userId],
                nickname: nickname,
              },
            },
          };
          return updatedRoom;
        });

        ToastMessage({
          message: '닉네임이 변경되었습니다.',
          type: 'success',
        });
      } catch (error) {
        console.error('닉네임 변경 중 오류:', error);
        ToastMessage({
          message: '닉네임 변경에 실패했습니다.',
          type: 'error',
        });
      }
    },
    [user, currentRoom, setCurrentRoom],
  );

  // 프로필 이미지 변경 함수
  const changeProfileImage = useCallback(
    async (imageUrl: string) => {
      if (!user?.userId || !currentRoom?.roomId) {
        Alert.alert('오류', '사용자 또는 방 정보를 찾을 수 없습니다.');
        return;
      }

      try {
        // 1. 파일 이름 생성
        const fileName = `profile_${user.userId}_${Date.now()}.jpg`;
        const reference = storage().ref(`profiles/${fileName}`);

        // 2. 이미지 업로드 및 URL 가져오기
        await reference.putFile(imageUrl);
        const downloadURL = await reference.getDownloadURL();

        // 3. Firestore 업데이트를 병렬로 처리
        await Promise.all([
          firestore()
            .collection('rooms')
            .doc(currentRoom.roomId)
            .update({
              [`members.${user.userId}.profileImage`]: downloadURL,
            }),
          firestore().collection('users').doc(user.userId).update({
            profileImage: downloadURL,
          }),
        ]);

        // 4. 상태 업데이트
        setUserProfileImage(downloadURL);
        setCurrentRoom(prevRoom => {
          if (!prevRoom || !user.userId) {
            return prevRoom;
          }
          const updatedRoom: Room = {
            ...prevRoom,
            members: {
              ...prevRoom.members,
              [user.userId]: {
                ...prevRoom.members[user.userId],
                profileImage: downloadURL,
              },
            },
          };
          return updatedRoom;
        });

        ToastMessage({
          message: '프로필 이미지가 변경되었습니다.',
          type: 'success',
        });
      } catch (error) {
        console.error('프로필 이미지 변경 중 오류:', error);
        ToastMessage({
          message: '프로필 이미지 변경에 실패했습니다.',
          type: 'error',
        });
      }
    },
    [user?.userId, currentRoom?.roomId, setCurrentRoom, setUserProfileImage],
  );

  // 스케줄 새로고침 함수
  const refreshSchedules = useCallback(async () => {
    if (!user || !currentRoom) {
      return;
    }
    try {
      const roomRef = firestore().collection('rooms').doc(currentRoom.roomId);
      const roomDoc = await roomRef.get();
      const roomData = roomDoc.data();
      if (roomData) {
        // 데이터가 실제로 변경되었는지 확인
        const isDataChanged =
          JSON.stringify(currentRoom.members) !==
          JSON.stringify(roomData.members);

        if (isDataChanged) {
          setCurrentRoom(prevRoom => {
            if (!prevRoom) {
              return null;
            }
            const updatedRoom: Room = {
              ...prevRoom,
              members: roomData.members || {},
            };
            return updatedRoom;
          });
        }

      }
    } catch (error) {
      console.error('스케줄 새로고침 중 오류:', error);
    }
  }, [user, currentRoom, setCurrentRoom]);

  return {
    addFcmToken,
    changeNickname,
    changeProfileImage,
    refreshSchedules,
  };
};
