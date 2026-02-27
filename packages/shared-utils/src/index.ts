export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const maskEmail = (email: string): string => {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }
  const maskedName = name.length <= 2 ? "*".repeat(name.length) : `${name[0]}***${name[name.length - 1]}`;
  return `${maskedName}@${domain}`;
};

export const toEpochSeconds = (date: Date): number =>
  Math.floor(date.getTime() / 1000);
