import { role } from "./utils/lib/role";
import monitorMain from "./utils/monitor";

const loop = () => {
  monitorMain();

  for (let name in Game.creeps) {
    let creep = Game.creeps[name];
    if (creep.memory.role == "harvester") {
      const highPriorityHarvesters =
        Object.values(Game.creeps)
          .filter((c) => c.memory.role === "harvester")
          .findIndex((c, idx) => c.name === creep.name && idx < 2) !== -1;

      role.harvester.run(creep, {
        priority: highPriorityHarvesters ? "high" : "low",
      });
    }
    if (creep.memory.role == "builder") {
      const highPriorityBuilders =
        Object.values(Game.creeps)
          .filter((c) => c.memory.role === "builder")
          .findIndex((c, idx) => c.name === creep.name && idx < 2) !== -1;
      role.builder.run(creep, {
        priority: highPriorityBuilders ? "low" : "high",
      });
    }
    if (creep.memory.role == "upgrader") {
      role.upgrader.run(creep);
    }
    if (creep.memory.role == "miner") {
      role.miner.run(creep);
    }
  }
};

export { loop };
