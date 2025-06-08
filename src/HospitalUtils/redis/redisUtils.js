export const parseEnvToSeconds = (envVal) => {
  const unit = envVal.slice(-1);
  const value = parseInt(envVal.slice(0, -1));
  if (unit === "m") return value * 60;
  if (unit === "h") return value * 60 * 60;
  if (unit === "d") return value * 60 * 60 * 24;
  return 900; // default 15min
};