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
var COLOR_STR = {};
COLOR_STR[1] = '#BDFF00'; COLOR_STR[2] = '#99DD00';
COLOR_STR[5] = '#FFAA00'; COLOR_STR[10] = '#FF5533'; COLOR_STR[20] = '#FF0055';

var scene, gfx, scanGfx, keys = {};
var state = 'menu';
var snake, dir, nextDir, moveTimer, moveDelay;
var items, budget, collected, timeAlive, startTime;
var highScore = 0;
var boosting = false, boostCooldown = 0;
var particles = [];
var heartbeatTimer = 0;
var audioCtx = null;
var musicInterval = null;
var musicStep = 0;
var menuMusicInterval = null;
var menuMusicStep = 0;
var menuMusicPlaying = false;

// Text object pools
var textPool = [];
var itemTexts = [];

try { highScore = parseFloat(localStorage.getItem('tq_hs')) || 0; } catch (e) { }

var FONT = '"Consolas", "SF Mono", "Fira Mono", "Lucida Console", monospace';

function makeText(x, y, str, size, color, origin) {
  var t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: size + 'px',
    color: color || '#ffffff',
    fontStyle: 'bold'
  });
  if (origin !== undefined) t.setOrigin(origin);
  else t.setOrigin(0.5, 0);
  t.setDepth(500);
  textPool.push(t);
  return t;
}

function clearTexts() {
  for (var i = 0; i < textPool.length; i++) {
    textPool[i].destroy();
  }
  textPool = [];
  itemTexts = [];
}

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
  stopMenuMusic();
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
  startMusic();
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

var lastState = '';

function update(time, delta) {
  gfx.clear();

  // Clear texts when state changes
  if (state !== lastState) {
    clearTexts();
    if (state === 'menu' && !menuMusicPlaying) startMenuMusic();
    lastState = state;
  }

  if (state === 'menu') drawMenu();
  else if (state === 'playing') { updatePlaying(delta); drawPlaying(time); }
  else if (state === 'gameover') drawReceipt();
}

// --- MENU ---
function drawMenu() {
  drawGrid();
  gfx.fillStyle(0x00F0FF, 0.15);
  gfx.fillRect(0, 0, 800, 600);

  if (textPool.length === 0) {
    makeText(400, 80, 'THE', 28, '#00F0FF');
    makeText(400, 115, '$100', 52, '#ffffff');
    makeText(400, 185, 'TECH QUEUE', 30, '#00F0FF');
    makeText(400, 260, 'COLLECT DEALS', 16, '#BDFF00');
    makeText(400, 290, 'STAY UNDER $100', 16, '#FF0055');
    makeText(400, 350, 'JOYSTICK TO MOVE', 13, '#888888');
    makeText(400, 375, 'BTN1 SPEED BOOST', 13, '#888888');
    // index 7 = press start (blink)
    makeText(400, 440, 'PRESS START', 24, '#FFFF00');
    // index 8 = high score
    makeText(700, 10, highScore > 0 ? ('HI ' + highScore.toFixed(1)) : '', 14, '#FF0055');
  }
  // Blink PRESS START
  var blink = Math.sin(Date.now() * 0.005) > 0;
  textPool[7].setVisible(blink);
}

// --- PLAYING ---
var wasBoosting = false;
function updatePlaying(delta) {
  if (boostCooldown > 0) boostCooldown -= delta;
  var prevBoosting = boosting;
  if (keys['P1A'] && boostCooldown <= 0) {
    boosting = true;
  } else {
    boosting = false;
  }
  // Play boost sound on activation
  if (boosting && !prevBoosting) playBoost();

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
  stopMusic();
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

  // Sync item label texts
  // Destroy old item texts
  for (var ti = 0; ti < itemTexts.length; ti++) {
    itemTexts[ti].destroy();
  }
  itemTexts = [];

  // Items with glow + pulse
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    it.pulse = (it.pulse || 0) + 0.05;
    var px = it.x * GS, py = it.y * GS;
    var c = COLORS[it.val];
    // Glow
    gfx.fillStyle(c, 0.15);
    gfx.fillRoundedRect(px - 4, py - 4, GS + 8, GS + 8, 6);
    gfx.fillStyle(c, 0.8);
    gfx.fillRoundedRect(px + 2, py + 2, GS - 4, GS - 4, 4);
    // Dollar label
    var label = scene.add.text(px + GS / 2, py + GS / 2, '$' + it.val, {
      fontFamily: FONT, fontSize: '13px', color: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(501);
    itemTexts.push(label);
  }

  // Snake body
  for (var j = snake.length - 1; j >= 0; j--) {
    var seg = snake[j];
    var sx = seg.x * GS, sy = seg.y * GS;
    if (j === 0) {
      gfx.fillStyle(0x00F0FF, 0.2);
      gfx.fillRoundedRect(sx - 3, sy - 3, GS + 6, GS + 6, 8);
      gfx.fillStyle(0x00F0FF);
      gfx.fillRoundedRect(sx + 1, sy + 1, GS - 2, GS - 2, 6);
      gfx.lineStyle(2, 0xFFFFFF, 0.7);
      gfx.strokeRoundedRect(sx + 1, sy + 1, GS - 2, GS - 2, 6);
      var ex = dir === 'left' ? -4 : dir === 'right' ? 4 : 0;
      var ey = dir === 'up' ? -4 : dir === 'down' ? 4 : 0;
      gfx.fillStyle(0x000000);
      gfx.fillCircle(sx + 11 + ex, sy + 12 + ey, 3);
      gfx.fillCircle(sx + 21 + ex, sy + 12 + ey, 3);
      gfx.fillStyle(0xFFFFFF);
      gfx.fillCircle(sx + 11 + ex, sy + 11 + ey, 1.5);
      gfx.fillCircle(sx + 21 + ex, sy + 11 + ey, 1.5);
    } else {
      var bColor = 0x00B8CC;
      if (j - 1 < collected.length) bColor = collected[j - 1].color;
      var alpha = 0.9 - (j / snake.length) * 0.3;
      gfx.fillStyle(bColor, alpha);
      gfx.fillRoundedRect(sx + 2, sy + 2, GS - 4, GS - 4, 4);
      gfx.lineStyle(1, 0xFFFFFF, 0.15);
      gfx.strokeRoundedRect(sx + 2, sy + 2, GS - 4, GS - 4, 4);
    }
  }

  updateParticles();
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

  // HUD text objects: create once, update each frame
  // indices in textPool: 0=budget, 1=of100, 2=time, 3=count
  if (textPool.length === 0) {
    makeText(340, 5, '$0', 16, '#ffffff', 0);
    makeText(395, 5, '/$100', 16, '#888888', 0);
    makeText(730, 5, '0.0s', 16, '#00F0FF', 0);
    makeText(600, 5, 'x0', 16, '#BDFF00', 0);
  }
  // Update values
  textPool[0].setText('$' + budget);
  var t = ((Date.now() - startTime) / 1000).toFixed(1);
  textPool[2].setText(t + 's');
  textPool[3].setText('x' + collected.length);

  // Boost indicator
  if (boosting) {
    gfx.fillStyle(0x00F0FF, 0.3);
    gfx.fillRect(0, 30, 800, 2);
  }
}

// --- RECEIPT (Game Over) ---
function drawReceipt() {
  gfx.fillStyle(0x000000, 0.85);
  gfx.fillRect(0, 0, 800, 600);

  gfx.fillStyle(0x0D0E14);
  gfx.fillRoundedRect(200, 30, 400, 540, 8);
  gfx.lineStyle(2, 0x00F0FF, 0.5);
  gfx.strokeRoundedRect(200, 30, 400, 540, 8);

  if (textPool.length === 0) {
    var yy = 50;
    makeText(400, yy, 'DIGITAL RECEIPT', 24, '#00F0FF'); yy += 40;

    // Items list
    var maxShow = Math.min(collected.length, 14);
    for (var i = 0; i < maxShow; i++) {
      var ci = collected[i];
      gfx.fillStyle(ci.color);
      gfx.fillRoundedRect(230, yy + 2, 14, 14, 2);
      makeText(252, yy, 'ITEM ' + (i + 1), 14, '#CCCCCC', 0);
      makeText(560, yy, '$' + ci.val, 14, COLOR_STR[ci.val] || '#ffffff', 1);
      yy += 22;
    }
    if (collected.length > maxShow) {
      makeText(400, yy, '+ ' + (collected.length - maxShow) + ' MORE', 13, '#888888');
      yy += 22;
    }

    yy += 15;
    var overBudget = budget > 100;
    makeText(400, yy, 'TOTAL  $' + budget, 22, overBudget ? '#FF0055' : '#BDFF00');
    if (overBudget) {
      yy += 30;
      makeText(400, yy, 'OVER BUDGET!', 18, '#FF0055');
    }
    yy += 35;

    var sc = calcScore();
    makeText(400, yy, 'TIME ' + timeAlive.toFixed(1) + 's', 14, '#ffffff'); yy += 25;
    makeText(400, yy, 'SCORE ' + sc.toFixed(1), 26, '#00F0FF'); yy += 35;

    if (sc >= highScore && sc > 0) {
      makeText(400, yy, 'NEW HIGH SCORE!', 18, '#FFFF00'); yy += 25;
    }
    makeText(400, yy, 'HI ' + highScore.toFixed(1), 14, '#FF0055'); yy += 40;

    // Blink text — store index for blinking
    makeText(400, 530, 'PRESS START', 20, '#888888');
  }

  // Receipt divider lines (drawn each frame since gfx clears)
  gfx.fillStyle(0x333333);
  gfx.fillRect(220, 88, 360, 1);
  var maxShow2 = Math.min(collected.length, 14);
  var divY = 90 + maxShow2 * 22 + (collected.length > maxShow2 ? 22 : 0) + 10;
  gfx.fillRect(220, divY, 360, 1);

  // Colored boxes for receipt items
  var boxY = 92;
  for (var bi = 0; bi < Math.min(collected.length, 14); bi++) {
    gfx.fillStyle(collected[bi].color);
    gfx.fillRoundedRect(230, boxY + 2, 14, 14, 2);
    boxY += 22;
  }

  // Blink last text
  var blink = Math.sin(Date.now() * 0.004) > 0;
  textPool[textPool.length - 1].setVisible(blink);
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

function playBoost() {
  // Rising whoosh — three quick ascending tones
  playTone(300, 0.08, 0.1, 'sawtooth');
  setTimeout(function () { playTone(500, 0.08, 0.12, 'sawtooth'); }, 40);
  setTimeout(function () { playTone(800, 0.12, 0.1, 'sine'); }, 80);
}

// --- MENU MUSIC ---
// Fast, driving arpeggiator to build urgency and attract players
var MENU_ARP = [220, 329, 440, 523, 659, 523, 440, 329]; // Am tense climb
var MENU_BASS2 = [55, 55, 58.3, 55, 73.4, 69.3, 55, 55]; // dissonant bass movement

function startMenuMusic() {
  stopMenuMusic();
  menuMusicStep = 0;
  menuMusicPlaying = true;
  scheduleMenuNote();
}

function stopMenuMusic() {
  if (menuMusicInterval) {
    clearTimeout(menuMusicInterval);
    menuMusicInterval = null;
  }
  menuMusicPlaying = false;
}

function scheduleMenuNote() {
  if (state !== 'menu') { menuMusicPlaying = false; return; }
  playMenuNote();
  menuMusicStep++;
  menuMusicInterval = setTimeout(scheduleMenuNote, 150);
}

function playMenuNote() {
  try {
    var ctx = getAudioCtx(); if (!ctx) return;
    var step8 = menuMusicStep % 8;
    var step16 = menuMusicStep % 16;

    // Aggressive pulsing bass — sawtooth
    if (menuMusicStep % 2 === 0) {
      var bOsc = ctx.createOscillator();
      var bGain = ctx.createGain();
      bOsc.connect(bGain); bGain.connect(ctx.destination);
      bOsc.frequency.value = MENU_BASS2[step8];
      bOsc.type = 'sawtooth';
      bGain.gain.setValueAtTime(0.06, ctx.currentTime);
      bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      bOsc.start(ctx.currentTime);
      bOsc.stop(ctx.currentTime + 0.15);
    }

    // Fast square wave arpeggios — edgy and driving
    var aOsc = ctx.createOscillator();
    var aGain = ctx.createGain();
    aOsc.connect(aGain); aGain.connect(ctx.destination);
    aOsc.frequency.value = MENU_ARP[step8];
    aOsc.type = 'square';
    aGain.gain.setValueAtTime(0.035, ctx.currentTime);
    aGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    aOsc.start(ctx.currentTime);
    aOsc.stop(ctx.currentTime + 0.1);

    // Tension stab — sawtooth screech every 8 steps
    if (step16 === 0) {
      var sOsc = ctx.createOscillator();
      var sGain = ctx.createGain();
      sOsc.connect(sGain); sGain.connect(ctx.destination);
      sOsc.frequency.value = 880;
      sOsc.type = 'sawtooth';
      sGain.gain.setValueAtTime(0.04, ctx.currentTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      sOsc.start(ctx.currentTime);
      sOsc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) { }
}

// --- BACKGROUND MUSIC ENGINE ---
// Dark minor-key arpeggiator + bass that accelerates with budget
var BASS_NOTES = [55, 55, 65.4, 73.4, 55, 55, 82.4, 73.4]; // A1, A1, C2, D2...
var ARP_PATTERN = [
  [220, 261, 329], // Am chord tones
  [220, 329, 392],
  [261, 329, 440],
  [329, 392, 523],
  [261, 329, 440],
  [220, 329, 392],
  [220, 261, 329],
  [196, 261, 329]  // resolve down
];

function startMusic() {
  stopMusic();
  musicStep = 0;
  scheduleMusicStep();
}

function stopMusic() {
  if (musicInterval) {
    clearTimeout(musicInterval);
    musicInterval = null;
  }
}

function scheduleMusicStep() {
  if (state !== 'playing') return;
  var intensity = Math.min(budget / 100, 1);
  // Tempo: 180ms at start → 90ms near $100
  var tempo = 180 - intensity * 90;

  playMusicNote();
  musicStep++;

  musicInterval = setTimeout(scheduleMusicStep, tempo);
}

function playMusicNote() {
  try {
    var ctx = getAudioCtx(); if (!ctx) return;
    var intensity = Math.min(budget / 100, 1);
    var step8 = musicStep % 8;
    var step3 = musicStep % 3;

    // Bass — low sub pulse on every other step
    if (musicStep % 2 === 0) {
      var bassFreq = BASS_NOTES[step8];
      // Detune slightly as intensity rises for unease
      bassFreq *= (1 + intensity * 0.02);
      var bOsc = ctx.createOscillator();
      var bGain = ctx.createGain();
      bOsc.connect(bGain); bGain.connect(ctx.destination);
      bOsc.frequency.value = bassFreq;
      bOsc.type = 'triangle';
      var bVol = 0.06 + intensity * 0.04;
      bGain.gain.setValueAtTime(bVol, ctx.currentTime);
      bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      bOsc.start(ctx.currentTime);
      bOsc.stop(ctx.currentTime + 0.2);
    }

    // Arpeggiator — cycle through chord tones
    var arpChord = ARP_PATTERN[step8];
    var arpFreq = arpChord[step3];
    // Shift octave up as intensity grows
    if (intensity > 0.6) arpFreq *= 2;
    var aOsc = ctx.createOscillator();
    var aGain = ctx.createGain();
    aOsc.connect(aGain); aGain.connect(ctx.destination);
    aOsc.frequency.value = arpFreq;
    aOsc.type = 'square';
    var aVol = 0.03 + intensity * 0.02;
    aGain.gain.setValueAtTime(aVol, ctx.currentTime);
    aGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    aOsc.start(ctx.currentTime);
    aOsc.stop(ctx.currentTime + 0.12);

    // High tension stab every 8 steps at high intensity
    if (intensity > 0.5 && step8 === 0) {
      var sOsc = ctx.createOscillator();
      var sGain = ctx.createGain();
      sOsc.connect(sGain); sGain.connect(ctx.destination);
      sOsc.frequency.value = 660 + intensity * 200;
      sOsc.type = 'sawtooth';
      sGain.gain.setValueAtTime(0.04, ctx.currentTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      sOsc.start(ctx.currentTime);
      sOsc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) { }
}
