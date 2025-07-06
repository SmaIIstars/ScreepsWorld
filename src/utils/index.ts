export * from "./lib/role";

type IntervalTypeOpts = Partial<{
  time: number;
}>;
export const intervalTime = (
  ticks: number,
  fn: (...args: any[]) => any,
  opts: IntervalTypeOpts = {}
) => {
  const { time = Game.time } = opts;
  if (time % ticks === 0) fn();
};
