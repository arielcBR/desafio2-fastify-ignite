export function getExpireDate(): Date {
  const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + sevenDaysInMilliseconds);
}