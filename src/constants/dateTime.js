// The backend uses Asia/Ho_Chi_Minh local date-times without an offset.
// Display those wall-clock values unchanged; convert explicit UTC/offset timestamps to this zone.
export const DATE_TIME = Object.freeze({
  locale: 'en-GB',
  timeZone: 'Asia/Ho_Chi_Minh',
  date: 'DD/MM/YYYY',
  time: 'HH:mm',
  dateTime: 'DD/MM/YYYY HH:mm',
  dateApi: 'YYYY-MM-DD',
  timeStepMinutes: 15
});
