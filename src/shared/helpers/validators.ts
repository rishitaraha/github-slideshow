export const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const isMultiple = (x: number, y: number): boolean => {
  const result = (Math.round((x / y) * 100) / 100) % 1;
  return result === 0;
};
