export function safeJsonParse<T>(json: string): T | null;
export function safeJsonParse<T>(json: string, defaultValue: T): T;
export function safeJsonParse<T>(json: string, defaultValue?: T): T | null {
  try {
    return JSON.parse(json);
  } catch (error) {
    return defaultValue ?? null;
  }
}
