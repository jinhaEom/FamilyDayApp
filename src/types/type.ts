export type User = {
  userId: string;
  email: string;
  name: string;
  currentRoomId?: string;
  currentRoomName?: string;
  currentRoom?: string;
  selectedRoom?: string;
  justLoggedIn?: boolean;
};

type RoomMember = {
  nickname: string;
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

export type Schedule = {
  scheduleId: string;
  scheduleTitle: string;
  scheduleContent: string;
  scheduleDate: string;
  scheduleEndDate: string;
  createdAt: any;
  createdBy: string;
  userName: string;
};
