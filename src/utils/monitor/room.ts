import { task } from "../task";

export const room = () => {
  rooms();
};

const rooms = () => {
  if (Game.time % 50 === 0) {
    Memory.rooms = Game.rooms;
  }

  task.run();
};
