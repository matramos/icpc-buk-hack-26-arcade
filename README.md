# 🎮 ICPC: Arcade Challenge

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](README.es.md)

Buk is sponsoring the [ICPC](https://icpc.global/regionals/finder/TCP) and bringing an Arcade.
But this time the challenge isn't to use it: it's to create the video game that will be available during the event.

**Your mission:** Build the best arcade game using Phaser 3 (JS game library) that will run on our physical arcade machine!

---

## 🏆 Prizes

### First Place
- **$100 USD** Apple Gift Card
- Your game will be available on the arcade machine during the event

### Second Place
- Your game will be available on the arcade machine during the event

---

## 📋 Restrictions

Your game must comply with these technical restrictions:

### Size Limit
- ✅ **Maximum 50KB after minification** (before gzip)
- Game code is minified automatically - focus on writing good code

### Code Restrictions
- ✅ **Pure vanilla JavaScript only** - No `import` or `require`
- ✅ **No external URLs** - No `http://`, `https://`, or `//` (except `data:` URIs for base64)
- ✅ **No network calls** - No `fetch`, `XMLHttpRequest`, or similar APIs
- ✅ **Sandboxed environment** - Game runs in an iframe without internet access

### What You CAN Use
- ✅ **Phaser 3** (v3.87.0) - Loaded externally via CDN (doesn't count towards size limit)
- ✅ **Base64-encoded images** - Using `data:` URIs
- ✅ **Procedurally generated graphics** - Using Phaser's Graphics API
- ✅ **Generated audio tones** - Using Phaser's Web Audio API
- ✅ **Canvas-based rendering and effects**

# 🕹️ Controls

Your game will run on a real arcade cabinet with physical joysticks and buttons!

## Arcade Button Mapping

The arcade cabinet sends specific key codes when buttons are pressed:

**Player 1:**
- **Joystick**: `P1U`, `P1D`, `P1L`, `P1R` (Up, Down, Left, Right)
- **Joystick Diagonals**: `P1DL`, `P1DR` (Down-Left, Down-Right)
- **Action Buttons**: `P1A`, `P1B`, `P1C` (top row) / `P1X`, `P1Y`, `P1Z` (bottom row)
- **Start**: `START1`

**Player 2:**
- **Joystick**: `P2U`, `P2D`, `P2L`, `P2R`
- **Joystick Diagonals**: `P2DL`, `P2DR`
- **Action Buttons**: `P2A`, `P2B`, `P2C` / `P2X`, `P2Y`, `P2Z`
- **Start**: `START2`

## Local Testing

For local testing, you can map these arcade buttons to keyboard keys. The mapping supports **multiple keys per arcade button** (useful for alternatives like WASD + Arrow keys). See `game.js` for the complete `ARCADE_CONTROLS` mapping template.

By default:
- Player 1 uses **WASD** (joystick) and **U/I/O/J/K/L** (action buttons)
- Player 2 uses **Arrow keys** (joystick) and **R/T/Y/F/G/H** (action buttons)

💡 **Tip**: Keep controls simple - design for joystick + 1-2 action buttons for the best arcade experience!

---

## ⭐ Evaluation Criteria

Want to know how games will be evaluated? Check out the complete **Evaluation Criteria** at:

👉 **[https://buk-arcade-challenge.icpc.cl/criterios](https://buk-arcade-challenge.icpc.cl/criterios)**

Learn what aspects such as arcade feel, replayability, entertainment, visual clarity, polish and creativity will be considered when evaluating your game.

---

## ⏰ Deadline and Submission

**Deadline:** February 25, 2026 at 11:59 PM (Chile time)

### How to Submit

Submitting your project is easy:

1. **Save your changes** - Make sure `game.js`, `metadata.json` and `cover.png` are ready
   - **Important:** Your game must include a custom `cover.png` file showcasing your game
2. **Git push** - Upload your code to your repository:
   ```bash
   git add .
   git commit -m "Final submission"
   git push
   ```

That's it! 🎉

**Your game will automatically appear at:** [https://buk-arcade-challenge.icpc.cl/](https://buk-arcade-challenge.icpc.cl/)

The system automatically syncs template forks and publishes them to the site.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
This starts a server at `http://localhost:3000` with live restriction checking.

### 3. Build Your Game
- **Edit `game.js`** - Write your arcade game code
- **Update `metadata.json`** - Define your game's name and description
- **Create `cover.png`** - Design a PNG cover image for your game
- **Watch the development server** - Shows live updates of file size and restrictions

---

## 🤖 Vibecode Your Game

This challenge is designed for **vibecoding** - building your game with AI assistance!

### What We've Set Up For You

- **`AGENTS.md`** - Pre-configured instructions so your IDE (Cursor, Windsurf, etc.) understands the challenge
- **`docs/phaser-quick-start.md`** - Quick reference guide for Phaser 3
- **`docs/phaser-api.md`** - Complete Phaser 3 API documentation

Your AI agent already knows:
- ✅ All challenge restrictions
- ✅ How to use Phaser 3 effectively
- ✅ Best practices for staying under 50KB
- ✅ Which files to edit (only `game.js` and `metadata.json`)

### How to Vibecode

Simply tell your AI assistant what game you want to build! For example:

> "Create a Space Invaders clone with colorful enemies"
> 
> "Build a flappy bird style game with procedural graphics"
> 
> "Make a breakout game with power-ups"

Your AI will handle the implementation, keeping everything within the restrictions automatically!
