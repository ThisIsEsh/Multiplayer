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
    this.objectList = [];
    this.frameId = null;

    var socket = io('http://localhost:3000');

    socket.on('connect', () => {
      socket.emit('join', {room: 123});
    });
    socket.on('disconnect', function(){});
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i in this.objectList) {
      this.objectList[i].draw();
    }
    this.frameId = window.requestAnimationFrame(this.render.bind(this))
  }

  runPhysics() {
    for (let i in this.objectList) {
      const object = this.objectList[i]
      object.sync();

    }
  }

  start() {
    const Bike1 = new Bike(10, 10, 'red', new Controls(87, 83, 65, 68));
    const Bike2 = new Bike(canvas.width - 20, 10, 'blue', new Controls(38, 40, 37, 39))
    this.objectList.push(Bike1);
    this.objectList.push(Bike2);
    for (let i in this.objectList) {
      this.objectList[i].draw();
    }
    setInterval(this.runPhysics.bind(this), 15);
    this.render()
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

