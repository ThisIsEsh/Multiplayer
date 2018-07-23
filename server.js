var io = require('socket.io')();
const canvas = {
  height: 600,
  width: 1200
}
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
    this.playerId = null;
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
  getControls() {
    return this.controls
  }
}
class Controls {
  constructor(){
    this.direction = 'bottom'
  }
  setDirection(direction) {
    this.direction = direction
  }
}
class Game {
  constructor(io, room) {
    this.objectList = {};
    this.frameId = null;
    this.io = io
    this.room   = room
  }

  syncClient() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.io.in(this.room).emit('update', this.getState())
  }
  getState() {
    const state = {}
    for (var i in this.objectList) {
      state[i] = {
        x: this.objectList[i].x,
        y: this.objectList[i].y
      }
    }
    return state
  }

  runPhysics() {
    for (let i in this.objectList) {
      const object = this.objectList[i]
      object.sync();
    }
  }

  start(clients) {
    const Bike1 = new Bike(10, 10, 'red', new Controls());
    const Bike2 = new Bike(canvas.width - 20, 10, 'blue', new Controls())
    this.objectList[clients[0]] = Bike1;
    this.objectList[clients[1]] = Bike2;

    console.log('game started with params', this.getState())
    this.io.in(this.room).emit('start', this.getState())

    setTimeout(() => {
      this.physicsInterval = setInterval(this.runPhysics.bind(this), 15)
      this.syncInteval = setInterval(this.syncClient.bind(this), 65)
    }, 500);
  }
  stop() {
    if (this.physicsInterval) {
      clearInterval(this.physicsInterval)
      clearInterval(this.syncInteval)
    }
  }
  changeDirection(clientId, direction) {
    this.objectList[clientId].getControls().setDirection(direction)
  }
}
const games = {}
io.on('connection', function(socket){
  socket.on('join', (data, fn) => {
    socket.join(data.room)
    fn(socket.id)
    var clients = Object.keys(io.sockets.adapter.rooms[data.room].sockets);
    if (clients.length === 2) {
      const game = new Game(io, data.room);
      game.start(clients);
      games[data.room] = game
    }
  })
  socket.on('disconnect', function () {
    if (games['123']) {
      games['123'].stop()
      console.log('game stoped')
      delete games['123']
    }
  });
  socket.on('direction', (direction) => {
    if (games['123']) {
      games['123'].changeDirection(socket.id, direction)
    }
  })
});
io.listen(3001);
console.log('ready');