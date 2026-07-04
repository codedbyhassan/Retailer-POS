export const requestLogger = (req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
};

export const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
};
