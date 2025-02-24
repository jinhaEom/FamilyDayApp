import type {User, Room, Schedule} from '../types/type';
import {createContext} from 'react';
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
  signIn: (email: string, password: string) => void;
  processingSignIn: boolean;
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
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
  nickName : string;
  setNickName : (nickName: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  initialized: false,
  user: null,
  signUp: async () => {},
  processingSignUp: false,
  setProcessingSignUp: () => {},
  signIn: async () => {},
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
});
