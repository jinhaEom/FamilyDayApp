// src/auth/AuthProvider.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Collection, User, Room} from '../types/type';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {AuthContext} from './AuthContext';
import {Schedule} from '../types/type';
import {Alert} from 'react-native';
import {ToastMessage} from '../components/ToastMessage';
import messaging from '@react-native-firebase/messaging';

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [processingSignUp, setProcessingSignUp] = useState(false);
  const [processingSignIn, setProcessingSignIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [nickName, setNickName] = useState<string>('');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const justLoggedInRef = useRef(justLoggedIn);
  useEffect(() => {
    justLoggedInRef.current = justLoggedIn;
  }, [justLoggedIn]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(
      async (fbUser: FirebaseAuthTypes.User | null) => {
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
          justLoggedIn: justLoggedInRef.current,
        };

        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(userId)
            .get();
          const userData = userDoc.data();

          setUser(basicUserInfo);

          if (userData?.currentRoomId) {
            const roomDoc = await firestore()
              .collection('rooms')
              .doc(userData.currentRoomId)
              .get();
            if (roomDoc.exists) {
              const roomData = roomDoc.data();
              if (roomData) {
                const roomInfo = {
                  roomId: roomDoc.id,
                  roomName: roomData.roomName,
                  inviteCode: roomData.inviteCode,
                  createdAt: roomData.createdAt,
                  members: roomData.members || {},
                };

                setUser(prev => ({
                  ...prev!,
                  currentRoomId: roomInfo.roomId,
                  currentRoomName: roomInfo.roomName,
                }));
                setCurrentRoom(roomInfo);

                if (roomInfo.members[userId]?.nickname) {
                  setNickName(roomInfo.members[userId].nickname);
                }
              }
            }
          }

          if (userData?.profileImage) {
            setUserProfileImage(userData.profileImage);
          }
        } catch (error) {
          console.error('사용자 정보 로드 중 오류:', error);
          setUser(basicUserInfo);
          setCurrentRoom(null);
        } finally {
          setInitialized(true);
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      imageUrl: string | null,
    ) => {
      setProcessingSignUp(true);
      try {
        const userCredential = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );

        let profileImageUrl = '';
        if (imageUrl) {
          const fileName = `profile_${
            userCredential.user.uid
          }_${Date.now()}.jpg`;
          const reference = storage().ref(`profiles/${fileName}`);
          await reference.putFile(imageUrl);
          profileImageUrl = await reference.getDownloadURL();
        }

        await userCredential.user.updateProfile({
          displayName: name,
          photoURL: profileImageUrl,
        });

        await userCredential.user.reload();

        setUser({
          userId: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || name,
          justLoggedIn: true,
        });

        await firestore()
          .collection(Collection.USERS)
          .doc(userCredential.user.uid)
          .set({
            userId: userCredential.user.uid,
            email: userCredential.user.email,
            name: name,
            profileImage: profileImageUrl,
          });

        ToastMessage({message: '회원가입이 완료되었습니다.', type: 'success'});
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('이미 가입된 이메일입니다.');
        }
        throw error;
      } finally {
        setProcessingSignUp(false);
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setProcessingSignIn(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      setJustLoggedIn(true);

      // 로그인 성공 후 FCM 토큰 등록
      const token = await messaging().getToken();
      if (token) {
        // 사용자 문서에 토큰 저장
        const userRef = firestore()
          .collection(Collection.USERS)
          .doc(userCredential.user.uid);

        await userRef.set(
          {
            fcmToken: [token],
            lastTokenUpdated: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

        console.log('로그인 후 FCM 토큰 저장 성공');
      }
    } catch (error) {
      Alert.alert('이메일 또는 비밀번호를 다시 확인해주세요.');
      console.error('로그인 에러:', error);
    } finally {
      setProcessingSignIn(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    try {
      setCurrentRoom(null);
      setUser(null);
      setJustLoggedIn(false);
      setUserProfileImage(null);
      setSchedules([]);
      setNickName('');
      setInitialized(false);

      if (user?.userId) {
        try {
          await firestore()
            .collection(Collection.USERS)
            .doc(user.userId)
            .update({
              currentRoomId: null,
              currentRoomName: null,
            });
        } catch (error) {
          console.error('Firestore 업데이트 중 오류:', error);
        }
      }

      await auth().signOut();
      return Promise.resolve();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      return Promise.reject(error);
    }
  }, [user?.userId]);

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

        await roomRef.update({
          [`members.${user.userId}.nickname`]: nickname,
        });

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
          return {
            ...prevRoom,
            members: {
              ...prevRoom.members,
              [user.userId]: {
                ...prevRoom.members[user.userId],
                profileImage: downloadURL,
              },
            },
          };
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
    [user?.userId, currentRoom?.roomId],
  );
  const addFcmToken = useCallback(
    async (token: string) => {
      if (!user?.userId) {
        console.warn('사용자 정보가 없어서 FCM 토큰을 저장할 수 없습니다.');
        return;
      }
      try {
        const userRef = firestore()
          .collection(Collection.USERS)
          .doc(user.userId);
        await userRef.set(
          {
            fcmToken: [token],
            lastTokenUpdated: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
        console.log('FCM 토큰 저장 성공:', token);
        setFcmToken(token);
      } catch (error) {
        console.error('FCM 토큰 저장 중 오류:', error);
      }
    },
    [user],
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
      logOut,
      justLoggedIn,
      setJustLoggedIn,
      schedules,
      refreshSchedules,
      userProfileImage,
      setUserProfileImage,
      changeNickname,
      changeProfileImage,
      nickName,
      setNickName,
      setSchedules,
      fcmToken,
      setFcmToken,
      addFcmToken,
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
      logOut,
      changeNickname,
      changeProfileImage,
      nickName,
      setNickName,
      setSchedules,
      fcmToken,
      setFcmToken,
      addFcmToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
