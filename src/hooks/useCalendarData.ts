import {useState, useEffect} from 'react';
import {Schedule, Room} from '../types/type';
import {scheduleColors} from '../constants/Colors';

type MarkedDates = {
  [date: string]: {
    dots?: {color: string}[];
  };
};

interface ExtendedSchedule extends Schedule {
  userId?: string;
}

// Room 타입에서 RoomMember 타입 추출
type RoomMember = Room['members'][string];

export const useCalendarData = (
  currentRoom: Room | null,
  selectedDate: string,
  formatDate: (timestamp: any) => string | null,
  getDatesInRange: (startDate: string, endDate: string) => string[],
) => {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<
    Schedule[]
  >([]);
  const [importantSchedules, setImportantSchedules] = useState<
    ExtendedSchedule[]
  >([]);

  // 캘린더에 표시할 일정 마커 생성
  useEffect(() => {
    if (!currentRoom?.members) {
      return;
    }

    const newMarkedDates: MarkedDates = {};
    const members = currentRoom.members;

    Object.values(members).forEach((member: RoomMember) => {
      if (member.schedules && Array.isArray(member.schedules)) {
        member.schedules.forEach((schedule: Schedule) => {
          const formattedStartDate = formatDate(schedule.scheduleDate);
          const formattedEndDate = formatDate(schedule.scheduleEndDate);

          if (formattedStartDate && formattedEndDate) {
            const dateRange = getDatesInRange(
              formattedStartDate,
              formattedEndDate,
            );

            dateRange.forEach(date => {
              if (!newMarkedDates[date]) {
                newMarkedDates[date] = {
                  dots: [{color: scheduleColors[0]}],
                };
              } else {
                newMarkedDates[date].dots?.push({
                  color:
                    scheduleColors[
                      Math.floor(Math.random() * scheduleColors.length)
                    ],
                });
              }
            });
          }
        });
      }
    });

    setMarkedDates(newMarkedDates);
  }, [currentRoom?.members, formatDate, getDatesInRange]);

  // 선택한 날짜의 일정 필터링
  useEffect(() => {
    if (!currentRoom?.members || !selectedDate) {
      return;
    }

    const schedules: Schedule[] = [];
    const members = currentRoom.members;

    Object.values(members).forEach((member: RoomMember) => {
      if (member.schedules && Array.isArray(member.schedules)) {
        member.schedules.forEach((schedule: Schedule) => {
          const startDateStr = formatDate(schedule.scheduleDate);
          const endDateStr = formatDate(schedule.scheduleEndDate);

          if (startDateStr && endDateStr) {
            const dateRange = getDatesInRange(startDateStr, endDateStr);

            if (dateRange.includes(selectedDate)) {
              schedules.push({...schedule, userName: member.nickname});
            }
          }
        });
      }
    });

    setSelectedDateSchedules(schedules);
  }, [selectedDate, currentRoom?.members, formatDate, getDatesInRange]);

  // 중요 일정 필터링
  useEffect(() => {
    if (!currentRoom?.members) {
      return;
    }

    const allImportantSchedules: ExtendedSchedule[] = [];
    const members = currentRoom.members;

    Object.entries(members).forEach(
      ([userId, member]: [string, RoomMember]) => {
        if (member.schedules && Array.isArray(member.schedules)) {
          const importantUserSchedules = member.schedules
            .filter((schedule: Schedule) => schedule.isImportant)
            .map((schedule: Schedule) => ({
              ...schedule,
              userName: member.nickname,
              userId,
            }));

          allImportantSchedules.push(...importantUserSchedules);
        }
      },
    );

    allImportantSchedules.sort((a, b) => {
      const dateA = new Date(a.scheduleDate).getTime();
      const dateB = new Date(b.scheduleDate).getTime();
      return dateB - dateA;
    });

    setImportantSchedules(allImportantSchedules);
  }, [currentRoom?.members]);

  return {
    markedDates,
    selectedDateSchedules,
    importantSchedules,
  };
};
