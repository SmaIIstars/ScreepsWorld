const main = () => {
  RoomPosition.prototype.getPosition = function () {
    return `${this.roomName}/${this.x}/${this.y}`;
  };
};

export default main;
