var io = require('socket.io')();
class GameObject {
  draw() {

  }
  sync() {

  }
  remove() {
    objectList.splice(objectList.indexOf(this), 1);
  }

  changeY(diff) {
    const maxY = canvas.height - this.height;
    let y = this.y;
    y += diff;
    if (y < 0) {
      y = 0;
    }
    if (y > maxY) {
      y = maxY;
    }
    this.y = y;
  }

  changeX(diff) {
    const maxX = canvas.width - this.width;
    let x = this.x;
    x += diff;
    if (x < 0) {
      x = 0;
    }
    if (x > maxX) {
      x = maxX;
    }
    this.x = x;
  }
}
GameObject.x = 0;
GameObject.y = 0;
GameObject.width = 0;
GameObject.height = 0;

class Bike extends GameObject {
  constructor(startX, startY, color, controls) {
    super();
    this.lastSyncTime = null
    this.controls = controls;
    this.x = startX;
    this.y = startY;
    this.height = 10;
    this.width  = 10;
    this.speed = 100;
    this.color = color;
  }


  sync() {
    const currentTime = new Date().getTime()
    if (this.lastSyncTime) {
      //Дистанцию которую прошел байк с момента прошлой синхронизации
      const distance = (currentTime - this.lastSyncTime) / 1000 * this.speed;
      switch (this.controls.direction) {
        case 'top':
          this.changeY(-distance);
          break;
        case 'bottom':
          this.changeY(distance);
          break;
        case 'right':
          this.changeX(distance);
          break;
        case 'left':
          this.changeX(-distance);
          break;
      }
    }
    this.lastSyncTime = currentTime
  }

  draw() {

  }
}

io.on('connection', function(socket){
  socket.on('join', (data) => {
    socket.join(data.room)
    var clients = io.sockets.adapter.rooms[data.room].sockets;
    if (Object.keys(clients).length === 2) {
      io.to(data.room).emit('start')
    }
  })
});
io.listen(3000);
console.log('ready');