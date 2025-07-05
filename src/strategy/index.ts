import defaultRoleMonitor from "./default";
import level1 from "./level1";
import level2 from "./level2";

export type StrategyType = {
  roleMonitor: Record<
    CustomRoleType,
    { count: number; body: BodyPartConstant[] }
  >;
};

const strategy = {
  level1,
  level2,
};

export const getStrategy = (level: number) => {
  if (level === 1) {
    return level1;
  } else if (level === 2) {
    return level2;
  }

  return defaultRoleMonitor;
};

export default strategy;
