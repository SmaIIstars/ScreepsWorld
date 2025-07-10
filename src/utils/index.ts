export { role2 } from './lib/role2';

type IntervalTypeOpts = Partial<{
  time: number;
}>;

export const intervalSleep = (ticks: number, fn: (...args: any[]) => any, opts: IntervalTypeOpts = {}) => {
  const { time = Game.time } = opts;
  if (time % ticks === 0) fn();
};

export const ticksPerMove = (
  bodyArr: BodyPartConstant[],
  terrain: Exclude<Terrain, 'wall'> | 'road',
  carryLoad: boolean = true
) => {
  // 地形疲劳系数
  const fatigueMap: Record<Exclude<Terrain, 'wall'> | 'road', number> = { road: 1, plain: 2, swamp: 10 };

  // 统计各部件数量
  let moveCount = 0;
  let fatigueParts = 0;
  for (const part of bodyArr) {
    if (part === MOVE) {
      moveCount++;
    } else if (part === CARRY && !carryLoad) {
      // 空载 CARRY 不产生疲劳
      continue;
    } else {
      fatigueParts++;
    }
  }

  // 每 tick 产生疲劳
  const fatiguePerTick = fatigueParts * fatigueMap[terrain];
  // 每 tick 恢复疲劳
  const fatigueRecover = moveCount * 2;

  // 每 tick 实际移动距离
  const movePerTick = fatigueRecover / (fatiguePerTick || 1); // 避免除0
  // 每移动一格需要多少 tick（向上取整）
  const ticksPerMove = Math.ceil(1 / movePerTick);

  return {
    movePerTick: Math.min(movePerTick, 1), // 最大为1
    ticksPerMove,
    fatiguePerTick,
    fatigueRecover,
    moveCount,
    fatigueParts,
  };
};
