// 作为Miner专用的存储的creep, 跟随Miner移动, 并存储能量，当周围有其他单位时, 将能量转移给其他单位
import EMOJI from "@/constant/emoji";
import { intervalTime } from "@/utils";
import { baseRole } from "../../base/role";

const run: BaseRole["run"] = (creep: Creep) => {
  const needyTransferUnits = creep.pos
    .findInRange(FIND_MY_CREEPS, 1)
    .filter(
      (unit) => unit.store.getFreeCapacity() > 0 && unit.memory.role !== "miner"
    );

  for (let unit of needyTransferUnits) {
    const transferResult = creep.transfer(unit, RESOURCE_ENERGY);
    if (transferResult === OK)
      intervalTime(5, () => creep.say(EMOJI.transferring));
  }

  return;
};
// Game.spawns['Spawn1'].spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE], 'MinerStore-1', {memory:{role:'minerStore'}});
// TODO: 先手动控制
const create: BaseRole["create"] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      CARRY,
      MOVE,
    ],
    role: "minerStore",
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
