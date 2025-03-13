export type User = {
  userId: string;
  email: string;
  name: string;
  currentRoomId?: string;
  currentRoomName?: string;
  currentRoom?: string;
  selectedRoom?: string;
  justLoggedIn?: boolean;
  nickname?: string;
};

type RoomMember = {
  nickname: string;
  profileImage?: string | null;
  role: 'owner' | 'member';
  schedules?: Schedule[];
};

export type Room = {
  roomId: string;
  roomName: string;
  inviteCode: string;
  createdAt: any;
  members: {
    [userId: string]: RoomMember;
  };
};

export enum Collection {
  USERS = 'users',
  ROOMS = 'rooms',
  SCHEDULE = 'schedule',
}

export type Day = {
  dateString: string;
  day: number;
  month: number;
  year: number;
};

export interface Schedule {
  scheduleId: string;
  scheduleTitle: string;
  scheduleContent: string;
  scheduleDate: string;
  userId?: string;
  userName: string;
  scheduleEndDate: string;
  createdAt: any;
  isImportant?: boolean;
  profileImage?: string | null;
}
