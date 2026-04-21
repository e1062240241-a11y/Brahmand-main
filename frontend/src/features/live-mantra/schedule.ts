export type MantraWindow = {
  startHour: number;
  endHour: number;
};

const SCHEDULE_WINDOWS: MantraWindow[] = [
  { startHour: 8, endHour: 10 },
  { startHour: 16, endHour: 17 },
];

export const isWithinGayatriMantraWindow = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return SCHEDULE_WINDOWS.some(({ startHour, endHour }) => {
    if (hours < startHour || hours >= endHour) {
      return false;
    }
    if (hours === endHour && minutes > 0) {
      return false;
    }
    return true;
  });
};

export const getCurrentGayatriEnd = (date = new Date()) => {
  const current = SCHEDULE_WINDOWS.find(({ startHour, endHour }) => {
    const hours = date.getHours();
    return hours >= startHour && hours < endHour;
  });

  if (!current) return null;

  const end = new Date(date);
  end.setHours(current.endHour, 0, 0, 0);
  return end;
};

export const getNextGayatriStart = (date = new Date()) => {
  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();

  for (const window of SCHEDULE_WINDOWS) {
    if (currentHours < window.startHour || (currentHours === window.startHour && currentMinutes === 0)) {
      const next = new Date(date);
      next.setHours(window.startHour, 0, 0, 0);
      return next;
    }
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(SCHEDULE_WINDOWS[0].startHour, 0, 0, 0);
  return tomorrow;
};

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getScheduleWindows = () =>
  SCHEDULE_WINDOWS.map((window) => ({
    label: `${formatHour(window.startHour)} - ${formatHour(window.endHour)}`,
    startHour: window.startHour,
    endHour: window.endHour,
  }));

const formatHour = (hour: number) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return formatTime(date);
};
