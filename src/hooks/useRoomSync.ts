import {useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {User, Room} from '../types/type';
import {Dispatch, SetStateAction} from 'react';

export const useRoomSync = (
  currentRoom: Room | null,
  setCurrentRoom: Dispatch<SetStateAction<Room | null>>,
  user: User | null,
  userProfileImage: string | null,
  setUserProfileImage: (image: string | null) => void,
) => {
  // 방 데이터 실시간 동기화
  useEffect(() => {
    if (!currentRoom?.roomId) {
      return;
    }

    const unsubscribe = firestore()
      .collection('rooms')
      .doc(currentRoom.roomId)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const roomData = snapshot.data();
            if (roomData) {
              if (
                currentRoom.roomName === roomData.roomName &&
                currentRoom.inviteCode === roomData.inviteCode &&
                JSON.stringify(currentRoom.members) ===
                  JSON.stringify(roomData.members)
              ) {
                return;
              }

              setCurrentRoom({
                roomId: currentRoom.roomId,
                roomName: roomData.roomName,
                inviteCode: roomData.inviteCode,
                createdAt: roomData.createdAt,
                members: roomData.members || {},
              });
            }
          }
        },
        error => {
          console.error('실시간 업데이트 에러:', error);
        },
      );

    return () => unsubscribe();
  }, [
    currentRoom?.roomId,
    currentRoom?.roomName,
    currentRoom?.inviteCode,
    currentRoom?.members,
    setCurrentRoom,
  ]);

  // 프로필 이미지 동기화
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.userId) {
        return;
      }

      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.userId)
          .get();

        const userData = userDoc.data();
        if (
          userData?.profileImage &&
          userData.profileImage !== userProfileImage
        ) {
          setUserProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error('프로필 이미지 로딩 오류:', error);
      }
    };

    fetchUserProfile();
  }, [user?.userId, userProfileImage, setUserProfileImage]);

  // 방 멤버 프로필 이미지 동기화
  useEffect(() => {
    if (
      !user?.userId ||
      !userProfileImage ||
      !currentRoom?.members?.[user.userId] ||
      currentRoom.members[user.userId].profileImage === userProfileImage
    ) {
      return;
    }

    const updatedMembers = {
      ...currentRoom.members,
      [user.userId]: {
        ...currentRoom.members[user.userId],
        profileImage: userProfileImage,
      },
    };

    firestore()
      .collection('rooms')
      .doc(currentRoom.roomId)
      .update({
        members: updatedMembers,
      })
      .catch(error => {
        console.error('프로필 이미지 업데이트 오류:', error);
      });
  }, [user?.userId, userProfileImage, currentRoom]);
};
