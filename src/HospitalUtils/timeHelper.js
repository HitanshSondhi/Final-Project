import { formatInTimeZone } from "date-fns-tz";

export const convertISTtoUTC = (istDateStr) => {
  const istDate = new Date(istDateStr);
  const utcTimestamp = istDate.getTime() - 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(utcTimestamp);
};


export const convertUTCtoIST = (utcDate, formatStr = "yyyy-MM-dd HH:mm:ssXXX") => {
  return formatInTimeZone(utcDate, "Asia/Kolkata", formatStr);
};
