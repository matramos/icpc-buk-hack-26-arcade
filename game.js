// The $100 Tech Queue - Budget Snake Arcade Game
// Collect tech deals, stay under $100!

var ARCADE_CONTROLS = {
  'P1U': ['w', 'ArrowUp'], 'P1D': ['s', 'ArrowDown'],
  'P1L': ['a', 'ArrowLeft'], 'P1R': ['d', 'ArrowRight'],
  'P1A': ['u', ' '], 'P1B': ['i', 'Shift'],
  'START1': ['1', 'Enter'], 'START2': ['2']
};
var KEYBOARD_TO_ARCADE = {};
for (var code in ARCADE_CONTROLS) {
  ARCADE_CONTROLS[code].forEach(function (k) { KEYBOARD_TO_ARCADE[k] = code; });
}

var GS = 32, COLS = 25, ROWS = 18;
var VALUES = [1, 2, 5, 10, 20];
var COLORS = {};
COLORS[1] = 0xBDFF00; COLORS[2] = 0x99DD00;
COLORS[5] = 0xFFAA00; COLORS[10] = 0xFF5533; COLORS[20] = 0xFF0055;

var scene, gfx, scanGfx, keys = {};
var state = 'menu';
var snake, dir, nextDir, moveTimer, moveDelay;
var items, budget, collected, timeAlive, startTime;
var highScore = 0;
var boosting = false, boostCooldown = 0;
var particles = [];
var heartbeatTimer = 0;
var audioCtx = null;

try { highScore = parseFloat(localStorage.getItem('tq_hs')) || 0; } catch (e) { }

var config = {
  type: Phaser.AUTO,
  width: 800, height: 600,
  backgroundColor: '#0A0B10',
  scene: { create: create, update: update }
};
var game = new Phaser.Game(config);

function create() {
  scene = this;
  gfx = this.add.graphics();
  scanGfx = this.add.graphics();
  drawScanlines();
  this.input.keyboard.on('keydown', function (e) {
    var k = KEYBOARD_TO_ARCADE[e.key] || e.key;
    keys[k] = true;
    if (state === 'menu') {
      if (k === 'START1' || k === 'P1A') startGame();
    } else if (state === 'gameover') {
      if (k === 'START1' || k === 'P1B') { state = 'menu'; }
    }
    if (state === 'playing') {
      if (k === 'P1U' && dir !== 'down') nextDir = 'up';
      if (k === 'P1D' && dir !== 'up') nextDir = 'down';
      if (k === 'P1L' && dir !== 'right') nextDir = 'left';
      if (k === 'P1R' && dir !== 'left') nextDir = 'right';
    }
  });
  this.input.keyboard.on('keyup', function (e) {
    var k = KEYBOARD_TO_ARCADE[e.key] || e.key;
    keys[k] = false;
  });
}

function startGame() {
  state = 'playing';
  snake = [{ x: 12, y: 9 }];
  dir = 'right'; nextDir = 'right';
  moveTimer = 0;
  moveDelay = 150;
  items = [];
  budget = 0;
  collected = [];
  timeAlive = 0;
  startTime = Date.now();
  boosting = false; boostCooldown = 0;
  particles = [];
  spawnItem();
  spawnItem();
}

function spawnItem() {
  var tries = 0, x, y, ok;
  do {
    x = 1 + Math.floor(Math.random() * (COLS - 2));
    y = 2 + Math.floor(Math.random() * (ROWS - 3));
    ok = true;
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === x && snake[i].y === y) { ok = false; break; }
    }
    for (var j = 0; j < items.length; j++) {
      if (items[j].x === x && items[j].y === y) { ok = false; break; }
    }
    tries++;
  } while (!ok && tries < 100);
  var v = VALUES[Math.floor(Math.random() * VALUES.length)];
  items.push({ x: x, y: y, val: v, pulse: 0 });
}

function calcScore() {
  timeAlive = (Date.now() - startTime) / 1000;
  return Math.floor((budget / 100) * timeAlive * 10) / 10;
}

function update(time, delta) {
  gfx.clear();
  if (state === 'menu') drawMenu();
  else if (state === 'playing') { updatePlaying(delta); drawPlaying(time); }
  else if (state === 'gameover') drawReceipt();
}

// --- MENU ---
function drawMenu() {
  drawGrid();
  gfx.fillStyle(0x00F0FF, 0.15);
  gfx.fillRect(0, 0, 800, 600);
  gfx.fillStyle(0x00F0FF);
  drawText(gfx, 'THE', 400, 100, 3);
  gfx.fillStyle(0xFFFFFF);
  drawText(gfx, '$100', 400, 160, 5);
  gfx.fillStyle(0x00F0FF);
  drawText(gfx, 'TECH QUEUE', 400, 240, 2.5);
  gfx.fillStyle(0xBDFF00);
  drawText(gfx, 'COLLECT DEALS', 400, 330, 1.5);
  gfx.fillStyle(0xFF0055);
  drawText(gfx, 'STAY UNDER $100', 400, 370, 1.5);
  gfx.fillStyle(0x888888);
  drawText(gfx, 'JOYSTICK TO MOVE', 400, 440, 1.2);
  drawText(gfx, 'BTN1 SPEED BOOST', 400, 470, 1.2);
  gfx.fillStyle(0xFFFF00);
  var blink = Math.sin(Date.now() * 0.005) > 0;
  if (blink) drawText(gfx, 'PRESS START', 400, 540, 2);
  if (highScore > 0) {
    gfx.fillStyle(0xFF0055);
    drawText(gfx, 'HI ' + highScore.toFixed(1), 700, 20, 1.2);
  }
}

// --- PLAYING ---
function updatePlaying(delta) {
  // Boost
  if (boostCooldown > 0) boostCooldown -= delta;
  if (keys['P1A'] && boostCooldown <= 0) {
    boosting = true;
  } else {
    boosting = false;
  }

  var spd = boosting ? moveDelay * 0.45 : moveDelay;
  moveTimer += delta;
  if (moveTimer < spd) return;
  moveTimer = 0;

  dir = nextDir;
  var head = { x: snake[0].x, y: snake[0].y };
  if (dir === 'up') head.y--;
  if (dir === 'down') head.y++;
  if (dir === 'left') head.x--;
  if (dir === 'right') head.x++;

  // Wrap
  if (head.x < 0) head.x = COLS - 1;
  if (head.x >= COLS) head.x = 0;
  if (head.y < 1) head.y = ROWS - 1;
  if (head.y >= ROWS) head.y = 1;

  // Self collision
  for (var i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver(); return;
    }
  }

  snake.unshift(head);

  // Check items
  var ate = false;
  for (var j = items.length - 1; j >= 0; j--) {
    if (items[j].x === head.x && items[j].y === head.y) {
      budget += items[j].val;
      collected.push({ val: items[j].val, color: COLORS[items[j].val] });
      playPickup();
      createParticles(head.x * GS + GS / 2, head.y * GS + GS / 2, COLORS[items[j].val], 12);
      items.splice(j, 1);
      ate = true;
      if (budget > 100) { gameOver(); return; }
      spawnItem();
      // Speed up slightly
      moveDelay = Math.max(80, moveDelay - 2);
      break;
    }
  }
  if (!ate) snake.pop();

  // Boost particles
  if (boosting && snake.length > 0) {
    var tail = snake[snake.length - 1];
    createParticles(tail.x * GS + GS / 2, tail.y * GS + GS / 2, 0x00F0FF, 3);
  }

  // Heartbeat
  heartbeatTimer += delta + moveTimer;
  var hbInterval = 500 - (budget / 100) * 350;
  if (heartbeatTimer > hbInterval) {
    heartbeatTimer = 0;
    playHeartbeat();
  }
}

function gameOver() {
  state = 'gameover';
  timeAlive = (Date.now() - startTime) / 1000;
  var sc = calcScore();
  if (sc > highScore) {
    highScore = sc;
    try { localStorage.setItem('tq_hs', highScore.toString()); } catch (e) { }
  }
  playGameOver();
}

function drawPlaying(time) {
  drawGrid();

  // Items with glow + pulse
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    it.pulse = (it.pulse || 0) + 0.05;
    var px = it.x * GS, py = it.y * GS;
    var c = COLORS[it.val];
    var pulseS = 1 + Math.sin(it.pulse) * 0.1;
    // Glow
    gfx.fillStyle(c, 0.15);
    gfx.fillRoundedRect(px - 4, py - 4, GS + 8, GS + 8, 6);
    gfx.fillStyle(c, 0.8);
    gfx.fillRoundedRect(px + 2, py + 2, GS - 4, GS - 4, 4);
    // Dollar text
    gfx.fillStyle(0x000000);
    drawText(gfx, '$' + it.val, px + GS / 2, py + 6, 1.2);
  }

  // Snake body
  for (var j = snake.length - 1; j >= 0; j--) {
    var seg = snake[j];
    var sx = seg.x * GS, sy = seg.y * GS;
    if (j === 0) {
      // Head glow
      gfx.fillStyle(0x00F0FF, 0.2);
      gfx.fillRoundedRect(sx - 3, sy - 3, GS + 6, GS + 6, 8);
      // Head
      gfx.fillStyle(0x00F0FF);
      gfx.fillRoundedRect(sx + 1, sy + 1, GS - 2, GS - 2, 6);
      gfx.lineStyle(2, 0xFFFFFF, 0.7);
      gfx.strokeRoundedRect(sx + 1, sy + 1, GS - 2, GS - 2, 6);
      // Eyes
      var ex = dir === 'left' ? -4 : dir === 'right' ? 4 : 0;
      var ey = dir === 'up' ? -4 : dir === 'down' ? 4 : 0;
      gfx.fillStyle(0x000000);
      gfx.fillCircle(sx + 11 + ex, sy + 12 + ey, 3);
      gfx.fillCircle(sx + 21 + ex, sy + 12 + ey, 3);
      gfx.fillStyle(0xFFFFFF);
      gfx.fillCircle(sx + 11 + ex, sy + 11 + ey, 1.5);
      gfx.fillCircle(sx + 21 + ex, sy + 11 + ey, 1.5);
    } else {
      // Body segment color based on collected item
      var bColor = 0x00B8CC;
      if (j - 1 < collected.length) bColor = collected[j - 1].color;
      var alpha = 0.9 - (j / snake.length) * 0.3;
      gfx.fillStyle(bColor, alpha);
      gfx.fillRoundedRect(sx + 2, sy + 2, GS - 4, GS - 4, 4);
      gfx.lineStyle(1, 0xFFFFFF, 0.15);
      gfx.strokeRoundedRect(sx + 2, sy + 2, GS - 4, GS - 4, 4);
    }
  }

  // Particles
  updateParticles();

  // HUD
  drawHUD();
}

function drawHUD() {
  // Top bar background
  gfx.fillStyle(0x000000, 0.7);
  gfx.fillRect(0, 0, 800, 30);
  gfx.lineStyle(1, 0x1A1C26);
  gfx.strokeRect(0, 0, 800, 30);

  // Budget bar
  var pct = Math.min(budget / 100, 1);
  var barW = 300;
  gfx.fillStyle(0x1A1C26);
  gfx.fillRect(20, 8, barW, 14);
  var barColor = pct < 0.5 ? 0xBDFF00 : pct < 0.8 ? 0xFFAA00 : 0xFF0055;
  gfx.fillStyle(barColor, 0.8);
  gfx.fillRect(20, 8, barW * pct, 14);
  gfx.lineStyle(1, 0x00F0FF, 0.4);
  gfx.strokeRect(20, 8, barW, 14);

  // Budget text
  gfx.fillStyle(0xFFFFFF);
  drawText(gfx, '$' + budget, 340 + 30, 8, 1.3);
  gfx.fillStyle(0x888888);
  drawText(gfx, '/$100', 340 + 80, 8, 1.3);

  // Time
  var t = ((Date.now() - startTime) / 1000).toFixed(1);
  gfx.fillStyle(0x00F0FF);
  drawText(gfx, t + 'S', 700, 8, 1.3);

  // Items count
  gfx.fillStyle(0xBDFF00);
  drawText(gfx, 'x' + collected.length, 600, 8, 1.3);

  // Boost indicator
  if (boosting) {
    gfx.fillStyle(0x00F0FF, 0.3);
    gfx.fillRect(0, 30, 800, 2);
  }
}

// --- RECEIPT (Game Over) ---
function drawReceipt() {
  // Dark overlay
  gfx.fillStyle(0x000000, 0.85);
  gfx.fillRect(0, 0, 800, 600);

  // Receipt box
  gfx.fillStyle(0x0D0E14);
  gfx.fillRoundedRect(200, 30, 400, 540, 8);
  gfx.lineStyle(2, 0x00F0FF, 0.5);
  gfx.strokeRoundedRect(200, 30, 400, 540, 8);

  gfx.fillStyle(0x00F0FF);
  drawText(gfx, 'DIGITAL RECEIPT', 400, 50, 2);

  gfx.fillStyle(0x333333);
  gfx.fillRect(220, 85, 360, 1);

  // Items list
  var yy = 100;
  var maxShow = Math.min(collected.length, 14);
  for (var i = 0; i < maxShow; i++) {
    var ci = collected[i];
    gfx.fillStyle(ci.color);
    gfx.fillRoundedRect(230, yy, 14, 14, 2);
    gfx.fillStyle(0xCCCCCC);
    drawText(gfx, 'ITEM ' + (i + 1), 290, yy + 1, 1);
    gfx.fillStyle(ci.color);
    drawText(gfx, '$' + ci.val, 540, yy + 1, 1);
    yy += 22;
  }
  if (collected.length > maxShow) {
    gfx.fillStyle(0x888888);
    drawText(gfx, '+ ' + (collected.length - maxShow) + ' MORE', 400, yy, 1);
    yy += 22;
  }

  gfx.fillStyle(0x333333);
  gfx.fillRect(220, yy + 5, 360, 1);
  yy += 20;

  // Total
  var overBudget = budget > 100;
  gfx.fillStyle(overBudget ? 0xFF0055 : 0xBDFF00);
  drawText(gfx, 'TOTAL  $' + budget, 400, yy, 1.8);
  if (overBudget) {
    yy += 30;
    gfx.fillStyle(0xFF0055);
    drawText(gfx, 'OVER BUDGET', 400, yy, 1.5);
  }
  yy += 35;

  // Score
  var sc = calcScore();
  gfx.fillStyle(0xFFFFFF);
  drawText(gfx, 'TIME ' + timeAlive.toFixed(1) + 'S', 400, yy, 1.2);
  yy += 25;
  gfx.fillStyle(0x00F0FF);
  drawText(gfx, 'SCORE ' + sc.toFixed(1), 400, yy, 2);
  yy += 35;

  if (sc >= highScore && sc > 0) {
    gfx.fillStyle(0xFFFF00);
    drawText(gfx, 'NEW HIGH SCORE', 400, yy, 1.5);
    yy += 25;
  }
  gfx.fillStyle(0xFF0055);
  drawText(gfx, 'HI ' + highScore.toFixed(1), 400, yy, 1.2);

  // Restart hint
  gfx.fillStyle(0x888888);
  var blink = Math.sin(Date.now() * 0.004) > 0;
  if (blink) drawText(gfx, 'PRESS START', 400, 545, 1.5);
}

// --- GRID ---
function drawGrid() {
  gfx.lineStyle(1, 0x1A1C26, 0.5);
  for (var x = 0; x <= 800; x += GS) {
    gfx.moveTo(x, 0); gfx.lineTo(x, 600);
  }
  for (var y = 0; y <= 600; y += GS) {
    gfx.moveTo(0, y); gfx.lineTo(800, y);
  }
  gfx.strokePath();
}

// --- SCANLINES ---
function drawScanlines() {
  scanGfx.setDepth(1000);
  scanGfx.fillStyle(0x000000, 0.06);
  for (var y = 0; y < 600; y += 3) {
    scanGfx.fillRect(0, y, 800, 1);
  }
}

// --- PARTICLES ---
function createParticles(x, y, color, count) {
  for (var i = 0; i < count; i++) {
    var a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    var spd = 1.5 + Math.random() * 3;
    particles.push({
      x: x, y: y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      color: color, size: 1.5 + Math.random() * 2,
      life: 18 + Math.random() * 12
    });
  }
}

function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.life--;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    var a = p.life / 30;
    gfx.fillStyle(p.color, a);
    gfx.fillCircle(p.x, p.y, p.size * (p.life / 30));
  }
}

// --- PIXEL TEXT ---
function drawText(g, text, x, y, size) {
  var chars = {
    'A': [0x7C, 0x92, 0x92, 0x7C, 0x92], 'B': [0xFE, 0x92, 0x92, 0x6C, 0x00],
    'C': [0x7C, 0x82, 0x82, 0x44, 0x00], 'D': [0xFE, 0x82, 0x82, 0x7C, 0x00],
    'E': [0xFE, 0x92, 0x92, 0x82, 0x00], 'F': [0xFE, 0x12, 0x12, 0x02, 0x00],
    'G': [0x7C, 0x82, 0x92, 0x74, 0x00], 'H': [0xFE, 0x10, 0x10, 0xFE, 0x00],
    'I': [0x00, 0x82, 0xFE, 0x82, 0x00], 'J': [0x40, 0x80, 0x80, 0x7E, 0x00],
    'K': [0xFE, 0x10, 0x28, 0xC6, 0x00], 'L': [0xFE, 0x80, 0x80, 0x80, 0x00],
    'M': [0xFE, 0x04, 0x18, 0x04, 0xFE], 'N': [0xFE, 0x08, 0x10, 0x20, 0xFE],
    'O': [0x7C, 0x82, 0x82, 0x7C, 0x00], 'P': [0xFE, 0x12, 0x12, 0x0C, 0x00],
    'Q': [0x7C, 0x82, 0xA2, 0x7C, 0x80], 'R': [0xFE, 0x12, 0x32, 0xCC, 0x00],
    'S': [0x64, 0x92, 0x92, 0x4C, 0x00], 'T': [0x02, 0x02, 0xFE, 0x02, 0x02],
    'U': [0x7E, 0x80, 0x80, 0x7E, 0x00], 'V': [0x3E, 0x40, 0x80, 0x40, 0x3E],
    'W': [0x7E, 0x80, 0x70, 0x80, 0x7E], 'X': [0xC6, 0x28, 0x10, 0x28, 0xC6],
    'Y': [0x06, 0x08, 0xF0, 0x08, 0x06], 'Z': [0xC2, 0xA2, 0x92, 0x8E, 0x00],
    '0': [0x7C, 0xA2, 0x92, 0x8A, 0x7C], '1': [0x00, 0x84, 0xFE, 0x80, 0x00],
    '2': [0xC4, 0xA2, 0x92, 0x8C, 0x00], '3': [0x44, 0x92, 0x92, 0x6C, 0x00],
    '4': [0x1E, 0x10, 0xFE, 0x10, 0x00], '5': [0x4E, 0x8A, 0x8A, 0x72, 0x00],
    '6': [0x7C, 0x92, 0x92, 0x64, 0x00], '7': [0x02, 0xE2, 0x12, 0x0E, 0x00],
    '8': [0x6C, 0x92, 0x92, 0x6C, 0x00], '9': [0x4C, 0x92, 0x92, 0x7C, 0x00],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00], '-': [0x10, 0x10, 0x10, 0x10, 0x00],
    '$': [0x4C, 0xFE, 0x92, 0x64, 0x00], '.': [0x00, 0x00, 0x80, 0x00, 0x00],
    '/': [0xC0, 0x20, 0x10, 0x08, 0x06], '+': [0x10, 0x10, 0x7C, 0x10, 0x10],
    'x': [0xC6, 0x28, 0x10, 0x28, 0xC6]
  };
  var spacing = 7 * size;
  var startX = x - (text.length * spacing) / 2;
  text = text.toUpperCase();
  for (var ci = 0; ci < text.length; ci++) {
    var data = chars[text[ci]];
    if (data) {
      for (var col = 0; col < 5; col++) {
        for (var row = 0; row < 8; row++) {
          if (data[col] & (1 << row)) {
            g.fillRect(startX + col * size, y + row * size, size - 0.5, size - 0.5);
          }
        }
      }
    }
    startX += spacing;
  }
}

// --- AUDIO (Web Audio API) ---
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = scene.sound.context; } catch (e) { }
  }
  return audioCtx;
}

function playTone(freq, dur, vol, type) {
  try {
    var ctx = getAudioCtx(); if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type || 'square';
    gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) { }
}

function playHeartbeat() {
  var intensity = Math.min(budget / 100, 1);
  playTone(40 + intensity * 30, 0.15, 0.06 + intensity * 0.08, 'sine');
  setTimeout(function () {
    playTone(35 + intensity * 25, 0.1, 0.04 + intensity * 0.06, 'sine');
  }, 120);
}

function playPickup() {
  playTone(880, 0.06, 0.12, 'square');
  setTimeout(function () { playTone(1100, 0.08, 0.1, 'square'); }, 50);
  setTimeout(function () { playTone(1320, 0.1, 0.08, 'sine'); }, 100);
}

function playGameOver() {
  var freqs = [600, 500, 400, 300, 200, 120];
  freqs.forEach(function (f, i) {
    setTimeout(function () { playTone(f, 0.25, 0.15, 'sawtooth'); }, i * 120);
  });
}
