import { role } from "./utils/lib/role";
import monitorMain from "./utils/monitor";

const loop = () => {
  monitorMain();
  // printMain();

  for (let name in Game.creeps) {
    let creep = Game.creeps[name];
    if (creep.memory.role == "harvester") {
      const highPriorityHarvesters =
        Object.values(Game.creeps)
          .filter((c) => c.memory.role === "harvester")
          .findIndex((c, idx) => c.name === creep.name && idx < 4) !== -1;

      role.harvester.run(creep, {
        priority: highPriorityHarvesters ? "high" : "low",
      });
    }
    if (creep.memory.role == "builder") {
      role.builder.run(creep, { priority: "low" });
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
