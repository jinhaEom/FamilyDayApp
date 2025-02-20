// src/auth/AuthProvider.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Collection, User, Room} from '../types/type';
import firestore from '@react-native-firebase/firestore';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from '@react-native-firebase/auth';
import {AuthContext} from './AuthContext';
import {Schedule} from '../types/type';
import type {User as FirebaseUser} from '@firebase/auth';
import storage from '@react-native-firebase/storage';
import {Alert} from 'react-native';
import {ToastMessage} from '../components/ToastMessage';
export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [processingSignUp, setProcessingSignUp] = useState(false);
  const [processingSignIn, setProcessingSignIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  const auth = useMemo(() => getAuth(), []);

  const justLoggedInRef = useRef(justLoggedIn);
  useEffect(() => {
    justLoggedInRef.current = justLoggedIn;
  }, [justLoggedIn]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          setUser(null);
          setCurrentRoom(null);
          setInitialized(true);
          return;
        }

        console.log('현재 로그인한 사용자 UID:', fbUser.uid);
        const userId = fbUser.uid;
        const basicUserInfo: User = {
          userId,
          email: fbUser.email || '',
          name: fbUser.displayName || '',
          // 최신 justLoggedIn 값은 ref로 사용
          justLoggedIn: justLoggedInRef.current,
        };

        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(userId)
            .get();
          const userData = userDoc.data();

          // 현재 참여 중인 방 정보 저장 (없으면 null)
          let roomInfo = null;
          if (userData?.currentRoomId) {
            const roomDoc = await firestore()
              .collection('rooms')
              .doc(userData.currentRoomId)
              .get();
            if (roomDoc.exists) {
              const roomData = roomDoc.data();
              roomInfo = roomData
                ? {
                    roomId: roomDoc.id,
                    roomName: roomData.roomName,
                    inviteCode: roomData.inviteCode,
                    createdAt: roomData.createdAt,
                    members: roomData.members || {},
                  }
                : null;
            }
          }

          const fetchSchedules = async (
            currentUser: User,
            currentRoomInfo: any,
          ) => {
            if (!currentUser || !currentRoomInfo) {
              return;
            }
            try {
              const roomRef = firestore()
                .collection('rooms')
                .doc(currentRoomInfo.roomId);
              const roomDoc = await roomRef.get();
              const roomData = roomDoc.data();
              // 현재 사용자의 스케줄 가져오기
              const userSchedules =
                roomData?.members?.[currentUser.userId]?.schedules || [];
              setSchedules(userSchedules);
            } catch (error) {
              console.error('스케줄 가져오기 오류:', error);
            }
          };

          const updatedUser = roomInfo
            ? {
                ...basicUserInfo,
                currentRoomId: roomInfo.roomId,
                currentRoomName: roomInfo.roomName,
              }
            : basicUserInfo;

          setUser(updatedUser);
          setCurrentRoom(roomInfo);
          fetchSchedules(updatedUser, roomInfo);
        } catch (error) {
          setUser(null);
          setCurrentRoom(null);
        } finally {
          setInitialized(true);
        }
      },
    );

    return () => unsubscribe();
  }, [auth]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      imageUrl: string | null,
    ) => {
      setProcessingSignUp(true);
      try {
        // 1. Firebase Auth로 사용자 생성
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // 2. 프로필 이미지가 있다면 Storage에 업로드
        let profileImageUrl = '';
        if (imageUrl) {
          const fileName = `profile_${
            userCredential.user.uid
          }_${new Date().getTime()}.jpg`;
          const reference = storage().ref(`profiles/${fileName}`);
          await reference.putFile(imageUrl);
          profileImageUrl = await reference.getDownloadURL();
        }

        // 3. displayName 업데이트
        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: profileImageUrl,
        });

        // 4. Firestore에 사용자 정보 저장
        await firestore()
          .collection(Collection.USERS)
          .doc(userCredential.user.uid)
          .set({
            userId: userCredential.user.uid,
            email: userCredential.user.email,
            name: name,
            profileImage: profileImageUrl,
          });
        ToastMessage({
          message: '회원가입이 완료되었습니다.',
          type: 'success',
        });
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('이미 가입된 이메일입니다.');
        } else {
          Alert.alert('회원가입 도중 오류가 발생했습니다.');
          console.error('회원가입 에러:', error);
        }
        throw error;
      } finally {
        setProcessingSignUp(false);
      }
    },
    [auth],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setProcessingSignIn(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setJustLoggedIn(true);
      } catch (error) {
        Alert.alert('이메일 또는 비밀번호를 다시 확인해주세요.');
        console.error('로그인 에러:', error);
      } finally {
        setProcessingSignIn(false);
      }
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDoc = await firestore().collection('users').doc(userId).get();

        // 문서가 존재하고 currentRoomId가 있는 경우에만 업데이트
        if (userDoc.exists && userDoc.data()?.currentRoomId) {
          await firestore().collection('users').doc(userId).update({
            currentRoomId: null,
            currentRoomName: null,
            lastSignOutAt: firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // 로그아웃 시 상태 초기화
      setUser(null);
      setCurrentRoom(null);
      setJustLoggedIn(false);
      setUserProfileImage(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  }, [auth]);

  // 스케쥴 추가 시 HomeScreen에 바로 반영
  const refreshSchedules = useCallback(async () => {
    if (!user || !currentRoom) {
      return;
    }
    try {
      const roomRef = firestore().collection('rooms').doc(currentRoom.roomId);
      const roomDoc = await roomRef.get();
      const roomData = roomDoc.data();
      if (roomData) {
        setCurrentRoom(prevRoom => {
          if (!prevRoom) {
            return null;
          }
          return {
            ...prevRoom,
            members: roomData.members || {},
          };
        });
      }
    } catch (error) {
      console.error('스케줄 새로고침 중 오류:', error);
    }
  }, [user, currentRoom]);

  const changeNickname = useCallback(
    async (nickname: string) => {
      if (!user?.userId || !currentRoom?.roomId) {
        Alert.alert('오류', '사용자 또는 방 정보를 찾을 수 없습니다.');
        return;
      }

      try {
        const roomRef = firestore().collection('rooms').doc(currentRoom.roomId);

        // members 객체 내의 특정 사용자의 nickname 필드만 업데이트
        await roomRef.update({
          [`members.${user.userId}.nickname`]: nickname,
        });

        // currentRoom 상태 업데이트
        setCurrentRoom(prevRoom => {
          if (!prevRoom || !user.userId) {
            return null;
          }
          return {
            ...prevRoom,
            members: {
              ...prevRoom.members,
              [user.userId]: {
                ...prevRoom.members[user.userId],
                nickname: nickname,
              },
            },
          };
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
    [user, currentRoom],
  );

  const value = useMemo(
    () => ({
      initialized,
      user,
      signUp,
      processingSignUp,
      setProcessingSignUp,
      signIn,
      processingSignIn,
      currentRoom,
      setCurrentRoom,
      signOut,
      justLoggedIn,
      setJustLoggedIn,
      schedules,
      refreshSchedules,
      userProfileImage,
      setUserProfileImage,
      auth,
      justLoggedInRef,
      setSchedules,
      changeNickname,
    }),
    [
      initialized,
      user,
      signUp,
      processingSignUp,
      signIn,
      processingSignIn,
      currentRoom,
      justLoggedIn,
      schedules,
      refreshSchedules,
      userProfileImage,
      signOut,
      auth,
      justLoggedInRef,
      setSchedules,
      changeNickname,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
