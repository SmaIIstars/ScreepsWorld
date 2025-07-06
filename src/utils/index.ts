export * from "./lib/role";

export const intervalTime = (ticks: number, fn: (...args: any[]) => any) => {
  if (Game.time % ticks === 0) fn();
};
