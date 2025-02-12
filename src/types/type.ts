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

export type Room = {
  roomId: string;
  roomName: string;
  inviteCode: string;
  createdAt: any;
  members: {
    [key: string]: {
      nickname: string;
      role: 'owner' | 'member';
    };
  };
};

export enum Collection {
  USERS = 'users',
  ROOMS = 'rooms',
}

export type Day = {
  dateString: string;
  day: number;
  month: number;
  year: number;
};
