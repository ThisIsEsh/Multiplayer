const canvas = document.getElementById("main");
const ctx=canvas.getContext("2d");

const staticCanvas = document.getElementById("static");
const staticCtx = staticCanvas.getContext("2d");

const leftScore = 0;
const rightScore = 0;
const leftCounter = document.getElementById('leftCounter');
const rightCounter = document.getElementById('rightCounter');



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

class Controls {
  constructor(upCode, downCode, leftCode, rightCode) {
    const codesToDirections = {
      [upCode]:    'top',
      [downCode]:  'bottom',
      [leftCode]:  'left',
      [rightCode]: 'right',
    }
    const horizontalDirections = new Set(['left', 'right'])

    this.direction = 'bottom'
    document.addEventListener('keydown', (e) => {
      e = e || window.event;
      if (codesToDirections[e.keyCode]) {
        //Переходим только в разные направления
        if (horizontalDirections.has(this.direction) !== horizontalDirections.has(codesToDirections[e.keyCode])) {
          this.direction = codesToDirections[e.keyCode]
        }
      }
    });
  }
}

class RemoteControls {
  constructor() {
    this.direction = 'bottom'
  }
}

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

    this.prevDrawX = this.x;
    this.prevDrawY = this.y;
  }

  checkCollision(x, y, width, height) {
    return !(
      this.x + this.width < x ||
      this.x > x + width||
      this.y + this.height < y ||
      this.y > y + height
    );
  }

  sync() {
    if (!this.controls) {
      return;
    } else {
      return this.controls.direction
    }
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

  drawTail(currentDrawX, currentDrawY) {
    staticCtx.beginPath();
    staticCtx.strokeStyle = this.color;
    staticCtx.lineWidth = 4;
    staticCtx.moveTo(currentDrawX + 5, currentDrawY + 5)
    staticCtx.lineTo(this.prevDrawX + 5, this.prevDrawY + 5)
    staticCtx.stroke()
    this.prevDrawX = currentDrawX
    this.prevDrawY = currentDrawY
  }

  draw() {
    const currentDrawX = Math.round(this.x);
    const currentDrawY = Math.round(this.y);
    this.drawTail(currentDrawX, currentDrawY);
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.fillRect(currentDrawX, currentDrawY, this.width, this.height)
    ctx.closePath();
  }
}


class Game {
  constructor() {
    this.objectList = {};
    this.frameId = null;

    var socket = io('http://localhost:3001');
    this.playerId = null;
    socket.on('connect', () => {
      socket.emit('join', {room: 123}, (playerId) => {
        this.playerId = playerId
      });
    });

    socket.on('disconnect', function(){});
    socket.on('start', (state) => {
      this.start(state)
      });
      socket.on('update', (state) => {
        this.update(state)
      });
    this.socket = socket;
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i in this.objectList) {
      this.objectList[i].draw();
    }
    this.frameId = window.requestAnimationFrame(this.render.bind(this))
  }

  runPhysics() {
    const direction = this.objectList[this.playerId].sync();
    this.socket.emit('direction', direction)
    // for (let i in this.objectList) {
    //   const object = this.objectList[i]
    //   object.sync();
    //
    // }
  }

  start(state) {
    staticCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.objectList = {}
    for (let playerId in state) {
      const color = playerId === this.playerId ? 'blue' : 'red'
      const controls = playerId === this.playerId ? new Controls(38, 40, 37, 39) : undefined
      const BikeInstance = new Bike(state[playerId].x, state[playerId].y, color, controls);
      this.objectList[playerId] = BikeInstance
      BikeInstance.draw()
    }
    setInterval(this.runPhysics.bind(this), 15);
    this.render()
  }
  update(state) {
    for (let playerId in state) {
      this.objectList[playerId].x = state[playerId].x
      this.objectList[playerId].y = state[playerId].y
    }
  }
}
// let paused = true;
// const titleElem = document.getElementById('title');
const game = (new Game());
// document.addEventListener('keydown', function (e) {
//   e = e || window.event;
//   if (e.keyCode == 32) {
//     paused = false
//     if (paused) {
//       titleElem.innerHTML = 'Press "SPACE" to continue!';
//     } else {
//       game.start()
//       titleElem.innerHTML = '';
//     }
//   }
// });

