export function logger(level, message, data = {}) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, level, message, ...data }));
}
