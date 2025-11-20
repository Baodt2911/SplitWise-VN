export const isValidString = (value: any): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isValidNumber = (value: any): boolean => {
  return Number.isFinite(value);
};

export const isValidDate = (value: any): boolean => {
  if (!isValidString(value)) return false;
  const dateRegex = /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;
  if (!dateRegex.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};
