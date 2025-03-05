// src/auth/AuthProvider.tsx
import React, {useMemo} from 'react';
import {AuthContext} from './AuthContext';
import {useAuth} from '../hooks/useAuth';
import {useUserProfile} from '../hooks/useUserProfile';

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const {
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
  } = useAuth();

 const {addFcmToken, changeNickname, changeProfileImage, refreshSchedules} =
    useUserProfile(user, currentRoom, setCurrentRoom, setUserProfileImage);

  // Context 값 메모이제이션
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
      addFcmToken,
    }),
    [
      initialized,
      user,
      signUp,
      processingSignUp,
      setProcessingSignUp,
      signIn,
      processingSignIn,
      currentRoom,
      setCurrentRoom,
      justLoggedIn,
      setJustLoggedIn,
      schedules,
      refreshSchedules,
      userProfileImage,
      setUserProfileImage,
      logOut,
      changeNickname,
      changeProfileImage,
      nickName,
      setNickName,
      setSchedules,
      addFcmToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
