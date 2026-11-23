type Level = "debug" | "info" | "warn" | "error";
type Context = { request_id?: string; user_id?: string };

export type Logger = Record<Level, (message: string) => void>;

export function getLogger(context: Context = {}): Logger {
  const write = (level: Level) => (message: string) => {
    console[level](JSON.stringify({ level, message, ...context }));
  };
  return { debug: write("debug"), info: write("info"), warn: write("warn"), error: write("error") };
}
