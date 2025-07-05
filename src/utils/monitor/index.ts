import { memory } from "./memory";
import { resource } from "./resource";
import { role } from "./role";
import { room } from "./room";

const monitorMain = () => {
  memory();
  role();
  resource();
  room();
};

export default monitorMain;
export const monitor = {
  role,
};
