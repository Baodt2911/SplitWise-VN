import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

export const formatTimeAgo = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatDate = (
  date: string | Date,
  format: string = "DD/MM/YYYY",
): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (
  date: string | Date,
  format: string = "DD/MM/YYYY HH:mm",
): string => {
  return dayjs(date).format(format);
};

export const getRelativeDateLabel = (date: string | Date): string => {
  const d = dayjs(date);
  const now = dayjs();

  if (d.isSame(now, "day")) {
    return "Hôm nay";
  }

  if (d.isSame(now.subtract(1, "day"), "day")) {
    return "Hôm qua";
  }

  return d.format("dddd, DD/MM");
};

// Re-export dayjs for custom usage if needed
export { dayjs };
