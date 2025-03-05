import type {User, Room, Schedule} from '../types/type';
import {createContext, Dispatch, SetStateAction} from 'react';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';

export interface AuthContextType {
  initialized: boolean;
  user: User | null;
  signUp: (
    email: string,
    password: string,
    name: string,
    selectedImage: string | null,
  ) => void;
  processingSignUp: boolean;
  setProcessingSignUp: (processingSignUp: boolean) => void;
  signIn: (email: string, password: string) => Promise<FirebaseAuthTypes.User | null>;
  processingSignIn: boolean;
  currentRoom: Room | null;
  setCurrentRoom: Dispatch<SetStateAction<Room | null>>;
  logOut: () => Promise<void>;
  justLoggedIn: boolean;
  setJustLoggedIn: (justLoggedIn: boolean) => void;
  schedules: Schedule[];
  setSchedules: (schedules: Schedule[]) => void;
  refreshSchedules: () => Promise<void>;
  userProfileImage: string | null;
  setUserProfileImage: (userProfileImage: string | null) => void;
  changeNickname: (nickname: string) => Promise<void>;
  changeProfileImage: (imageUrl: string) => Promise<void>;
  nickName: string;
  setNickName: (nickName: string) => void;
  addFcmToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  initialized: false,
  user: null,
  signUp: async () => {},
  processingSignUp: false,
  setProcessingSignUp: () => {},
  signIn: async () => null,
  processingSignIn: false,
  logOut: async () => {},
  currentRoom: null,
  setCurrentRoom: () => {},
  justLoggedIn: false,
  setJustLoggedIn: () => {},
  schedules: [],
  setSchedules: () => {},
  refreshSchedules: async () => {},
  userProfileImage: null,
  setUserProfileImage: () => {},
  changeNickname: async () => {},
  changeProfileImage: async () => {},
  nickName: '',
  setNickName: () => {},
  addFcmToken: () => {},
});
