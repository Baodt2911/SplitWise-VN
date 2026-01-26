import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Convert Date bất kỳ → UTC Date (an toàn)
 */
export const toUTCDate = (date: Date | string) => {
  return dayjs.utc(date).toDate();
};
