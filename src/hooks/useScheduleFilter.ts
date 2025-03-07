import { useCallback, useState } from 'react';
import { Schedule } from '../types/type';

type ScheduleFilter = 'next' | 'previous' | 'all';

const filterLabels = {
  next: '앞으로의 일정',
  previous: '지난 일정',
  all: '전체',
};

export const useScheduleFilter = () => {
  const [selectedCase, setSelectedCase] = useState<ScheduleFilter>('next');

  const filterOptions = [
    { key: 'next', value: filterLabels.next },
    { key: 'previous', value: filterLabels.previous },
    { key: 'all', value: filterLabels.all },
  ];

  const filterSchedules = useCallback(
    (schedules: Schedule[], filterType: ScheduleFilter = selectedCase) => {
      return schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.scheduleDate);
        scheduleDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

      switch (filterType) {
        case 'next':
          return scheduleDate >= today;
        case 'previous':
          return scheduleDate < today;
        case 'all':
          return true;
        default:
          return false;
      }
      });
    },
    [selectedCase],
  );

  return {
    selectedCase,
    setSelectedCase,
    filterSchedules,
    filterOptions,
    filterLabels,
  };
};
