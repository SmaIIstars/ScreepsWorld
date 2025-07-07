import { role } from './lib/role';

type IntervalTypeOpts = Partial<{
  time: number;
}>;
export const intervalSleep = (ticks: number, fn: (...args: any[]) => any, opts: IntervalTypeOpts = {}) => {
  const { time = Game.time } = opts;
  if (time % ticks === 0) fn();
};

export { role };
