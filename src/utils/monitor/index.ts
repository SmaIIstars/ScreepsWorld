import { memory } from "./memory";
import { resource } from "./resource";
import { role } from "./role";

const monitorMain = () => {
  memory();
  role();
  resource();
};

export default monitorMain;
export const monitor = {
  role,
};
