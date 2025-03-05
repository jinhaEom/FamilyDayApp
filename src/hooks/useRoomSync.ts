import {useEffect, useRef} from 'react';
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
  // 마지막 업데이트 시간을 추적하기 위한 ref
  const lastUpdateRef = useRef<number>(0);

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
              // 데이터가 실제로 변경되었는지 확인
              const isDataChanged =
                currentRoom.roomName !== roomData.roomName ||
                currentRoom.inviteCode !== roomData.inviteCode ||
                JSON.stringify(currentRoom.members) !==
                  JSON.stringify(roomData.members);

              // 마지막 업데이트 이후 충분한 시간이 지났는지 확인 (300ms)
              const now = Date.now();
              const timeSinceLastUpdate = now - lastUpdateRef.current;
              const shouldUpdate = isDataChanged && timeSinceLastUpdate > 300;

              if (shouldUpdate) {
                lastUpdateRef.current = now;

                setCurrentRoom({
                  roomId: currentRoom.roomId,
                  roomName: roomData.roomName,
                  inviteCode: roomData.inviteCode,
                  createdAt: roomData.createdAt,
                  members: roomData.members || {},
                });
              }
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
