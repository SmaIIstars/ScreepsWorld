export { role2 } from './lib/role2';

type IntervalTypeOpts = Partial<{
  time: number;
}>;

export const intervalSleep = (ticks: number, fn: (...args: any[]) => any, opts: IntervalTypeOpts = {}) => {
  const { time = Game.time } = opts;
  if (time % ticks === 0) fn();
};

export const ticksPerMove = (body: BodyPartConstant[]) => {
  const fatiguePerTick = body.length;
  const fatigueRecovery = body.filter((part) => part === MOVE).length * 2;
  return Math.ceil(fatiguePerTick / fatigueRecovery);
};
