import { ROOM_ID_ENUM } from "@/constant";
import { task } from "../task";

export const room = () => {
  if (Game.time % 50 === 0) {
    rooms();
    task.run();
  }
};

const rooms = () => {
  Memory.room = {
    rooms: Game.rooms,
    level: Game.rooms[ROOM_ID_ENUM.MainRoom].controller?.level ?? 1,
  };
};
