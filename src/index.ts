import { role } from "./utils/lib/role";
import { runTowers } from "./utils/lib/tower";
import monitorMain from "./utils/monitor";

const loop = () => {
  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      monitorMain();
      for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if (creep.memory.role == "harvester") {
          const highPriorityHarvesters =
            Object.values(Game.creeps)
              .filter((c) => c.memory.role === "harvester")
              .findIndex((c, idx) => c.name === creep.name && idx < 1) !== -1;

          role.harvester.run(creep, {
            priority: highPriorityHarvesters ? "high" : "low",
          });
        }
        if (creep.memory.role == "builder") {
          const highPriorityBuilders =
            Object.values(Game.creeps)
              .filter((c) => c.memory.role === "builder")
              .findIndex((c, idx) => c.name === creep.name && idx < 3) !== -1;

          role.builder.run(creep, {
            priority: highPriorityBuilders ? "high" : "low",
          });
        }

        if (creep.memory.role) {
          role[creep.memory.role]?.run(creep);
        }
      }

      runTowers(room);
    }
  }
};

export { loop };
