export const getFlagEmoji = (countryCode: string) => {
  const flag = String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
  );
  return flag;
};
