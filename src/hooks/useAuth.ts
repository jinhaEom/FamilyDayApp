import {useState, useCallback, useEffect, useRef} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {Collection, User, Room, Schedule} from '../types/type';
import {Alert} from 'react-native';
import {ToastMessage} from '../components/ToastMessage';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

export const useAuth = () => {
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

  // FCM 토큰 초기화
  useEffect(() => {
    const initializeFcmToken = async () => {
      try {
        // iOS에서는 토큰을 가져오기 전에 디바이스 등록이 필요
        if (Platform.OS === 'ios') {
          await messaging().registerDeviceForRemoteMessages();
          console.log('iOS 디바이스 원격 메시지 등록 완료');
        }

        // 이 시점에서는 토큰을 가져오기만 하고 저장은 하지 않음
        // 실제 저장은 usePushNotification 훅에서 처리
        const token = await messaging().getToken();
        if (token) {
          setFcmToken(token);
          console.log('FCM 토큰 초기화 완료:', token);
        }
      } catch (error) {
        console.error('FCM 토큰 초기화 오류:', error);
      }
    };

    initializeFcmToken();
  }, []);

  // 회원가입 함수
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

        // FCM 토큰 등록
        let fcmToken = null;
        try {
          // iOS에서는 토큰을 가져오기 전에 디바이스 등록이 필요
          if (Platform.OS === 'ios') {
            await messaging().registerDeviceForRemoteMessages();
          }

          fcmToken = await messaging().getToken();
        } catch (fcmError) {
          console.error('FCM 토큰 등록 오류:', fcmError);
        }

        await firestore()
          .collection(Collection.USERS)
          .doc(userCredential.user.uid)
          .set({
            userId: userCredential.user.uid,
            email: userCredential.user.email,
            name: name,
            profileImage: profileImageUrl,
            fcmToken: fcmToken ? [fcmToken] : [],
            lastTokenUpdated: firestore.FieldValue.serverTimestamp(),
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

  // 로그인

  const signIn: (
    email: string,
    password: string,
  ) => Promise<FirebaseAuthTypes.User | null> = useCallback(
    async (email, password) => {
      // ✅ 반환 타입 명시적으로 지정
      setProcessingSignIn(true);
      try {
        const userCredential = await auth().signInWithEmailAndPassword(
          email,
          password,
        );
        setJustLoggedIn(true);

        // ✅ 로그인 성공 후 사용자 객체 반환
        const user = userCredential.user;

        // ✅ 로그인 성공 후 FCM 토큰 등록
        try {
          if (Platform.OS === 'ios') {
            await messaging().registerDeviceForRemoteMessages();
          }

          const token = await messaging().getToken();
          if (token) {
            const userRef = firestore()
              .collection(Collection.USERS)
              .doc(user.uid);
            await userRef.set(
              {
                fcmToken: [token],
                lastTokenUpdated: firestore.FieldValue.serverTimestamp(),
              },
              {merge: true},
            );
            console.log('로그인 후 FCM 토큰 저장 성공');
          }
        } catch (fcmError) {
          console.error('FCM 토큰 등록 오류:', fcmError);
        }

        return user;
      } catch (error) {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호를 다시 확인해주세요.');
        console.error('로그인 에러:', error);
        return null;
      } finally {
        setProcessingSignIn(false);
      }
    },
    [],
  );


  // 로그아웃
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

  return {
    user,
    initialized,
    processingSignUp,
    setProcessingSignUp,
    processingSignIn,
    signUp,
    signIn,
    logOut,
    currentRoom,
    setCurrentRoom,
    justLoggedIn,
    setJustLoggedIn,
    schedules,
    setSchedules,
    userProfileImage,
    setUserProfileImage,
    nickName,
    setNickName,
    fcmToken,
    setFcmToken,
  };
};
