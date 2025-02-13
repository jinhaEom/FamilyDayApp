import type {User, Room, Schedule} from '../types/type';
import {createContext} from 'react';
export interface AuthContextType {
  initialized: boolean;
  user: User | null;
  signUp: (email: string, password: string, name: string) => void;
  processingSignUp: boolean;
  signIn: (email: string, password: string) => void;
  processingSignIn: boolean;
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  signOut: () => void;
  justLoggedIn: boolean;
  setJustLoggedIn: (justLoggedIn: boolean) => void;
  schedules: Schedule[];
  setSchedules: (schedules: Schedule[]) => void;
}

export const AuthContext = createContext<AuthContextType>({
  initialized: false,
  user: null,
  signUp: async () => {},
  processingSignUp: false,
  signIn: async () => {},
  processingSignIn: false,
  signOut: async () => {},
  currentRoom: null,
  setCurrentRoom: () => {},
  justLoggedIn: false,
  setJustLoggedIn: () => {},
  schedules: [],
  setSchedules: () => {},
});
