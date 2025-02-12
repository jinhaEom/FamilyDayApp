// src/auth/AuthProvider.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
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

// Firebase Web SDK 타입에서 FirebaseApp과 FirebaseUser를 가져옵니다.
import type {User as FirebaseUser} from '@firebase/auth';

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [processingSignUp, setProcessingSignUp] = useState(false);
  const [processingSignIn, setProcessingSignIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          console.log('현재 로그인한 사용자 UID:', fbUser.uid);
          const userId = fbUser.uid;

          try {
            // 사용자 문서 확인
            const userDoc = await firestore()
              .collection('users')
              .doc(userId)
              .get();

            const userData = userDoc.data();
            const basicUserInfo: User = {
              userId,
              email: fbUser.email || '',
              name: fbUser.displayName || '',
              justLoggedIn,
            };

            if (userData?.currentRoomId) {
              const roomDoc = await firestore()
                .collection('rooms')
                .doc(userData.currentRoomId)
                .get();

              if (roomDoc.exists) {
                const roomData = roomDoc.data();
                if (roomData == null) {
                  return;
                }
                setUser({
                  ...basicUserInfo,
                  currentRoomId: roomDoc.id,
                  currentRoomName: roomData.roomName,
                });

                setCurrentRoom({
                  roomId: roomDoc.id,
                  roomName: roomData.roomName,
                  inviteCode: roomData.inviteCode,
                  createdAt: roomData.createdAt,
                  members: roomData.members || {},
                });
              } else {
                setUser(basicUserInfo);
                setCurrentRoom(null);
              }
            } else {
              setUser(basicUserInfo);
              setCurrentRoom(null);
            }
          } catch (error) {
            setUser(null);
            setCurrentRoom(null);
          }
        } else {
          setUser(null);
          setCurrentRoom(null);
        }
        setInitialized(true);
      },
    );

    return () => unsubscribe();
  }, [auth, justLoggedIn]);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      setProcessingSignUp(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        // 회원가입 후 displayName 업데이트
        await updateProfile(userCredential.user, {displayName: name});
        await firestore()
          .collection(Collection.USERS)
          .doc(userCredential.user.uid)
          .set({
            userId: userCredential.user.uid,
            email: userCredential.user.email,
            name: name,
          });
      } catch (error) {
        console.error('회원가입 에러:', error);
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
        // 로그아웃 시 users 컬렉션의 방 정보도 초기화
        await firestore().collection('users').doc(userId).update({
          currentRoomId: null,
          currentRoomName: null,
          lastSignOutAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      // 로그아웃 시 상태 초기화
      setUser(null);
      setCurrentRoom(null);
      setJustLoggedIn(false);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  }, [auth]);

  const value = useMemo(() => {
    return {
      initialized,
      user,
      signUp,
      processingSignUp,
      signIn,
      processingSignIn,
      currentRoom,
      setCurrentRoom,
      signOut,
      justLoggedIn,
      setJustLoggedIn,
    };
  }, [
    initialized,
    user,
    signUp,
    processingSignUp,
    signIn,
    processingSignIn,
    currentRoom,
    setCurrentRoom,
    signOut,
    justLoggedIn,
    setJustLoggedIn,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
