Instruction Manual: "The $100 Tech Queue" Development

1. Role & Context
You are a Senior Game Developer specializing in Phaser.js and Creative Coding.

Project: "The $100 Tech Queue", a budget-management Snake game for the Buk Arcade Challenge.

Hard Constraint: NO EXTERNAL ASSETS. Everything (graphics, textures, audio) must be generated via code using Phaser.GameObjects.Graphics, generateTexture, and Web Audio API.

Hardware Target: Arcade machine (Joystick + 2 Buttons).

2. Development Protocol
Iterative Stages: Complete one stage at a time.

Commitment: At the end of each stage, provide the Full Updated Code (simulating a commit).

Validation: Wait for my approval before proceeding to the next stage.

Style: Minimalist, high-performance, and bug-free code.

3. Stages of Development
Stage 1: Core Movement & Cyber-Minimalist Aesthetic
Goal: Setup the grid, the player, and the basic movement.

Visuals: * Background: #0A0B10.

Grid: Subtle 32x32 lines (#1A1C26).

Player Head: Rounded square (0x00F0FF) with 2px stroke.

Logic: Basic 4-way Snake movement on the grid using Arrow Keys.

Commit 1: Deliver a playable "Head-only" movement demo with the background grid.

Stage 2: The Queue & Budget Mechanics
Goal: Implement the tail growth and the logic of items.

Logic:

Spawn "Value Boxes" (rounded rectangles) with values: $1, $2, $5, $10, $20.

Color Logic: Lime (0xBDFF00) for low prices, Cyber Pink (0xFF0055) for high prices.

Collection: Adding an item grows the tail and updates the totalBudget.

Fail Condition: If totalBudget > 100, it's Game Over.

Commit 2: Full gameplay loop (Snake growing and budget tracking).

Stage 3: Procedural Audio Engine
Goal: Create a soundscape using only code (Web Audio API).

Implementation:

Heartbeat: A low-frequency pulse every 500ms that accelerates as the budget gets closer to $100.

SFX: High-pitch chirps for pickup, descending sweeps for Game Over.

Commit 3: Integration of dynamic audio with gameplay.

Stage 4: Visual Polish & Post-Processing
Goal: Make it look like a premium arcade machine.

Effects:

Apply PostFX.Glow to the items and the player.

Create a "Scanline" effect using a graphics overlay to simulate a CRT monitor.

Add a "Speed Boost" mechanic on Space/Button 1 that creates a small particle trail (using generateTexture for particles).

Commit 4: Final visual layer and juice.

Stage 5: The "Digital Receipt" & Scoreboard
Goal: The Game Over experience.

UI: * Design a "Receipt" screen showing the list of items "purchased".

Final Score calculation: (Budget / 100) * TimeAlive.

Visual: Use Monospace fonts and a minimalist layout.

Commit 5: Final polished game with High Score system.

4. Technical Specifications for the AI
Resolution: 800x600 (Arcade Standard).

Input Mapping: * Joystick = Cursor Keys.

Button 1 = Space (Speed Boost).

Button 2 = Shift (Action/Restart).

Asset Generation: Use scene.textures.generateCanvas or scene.make.graphics to create reusable textures for the snake segments and items.

[STOP] Please acknowledge this plan. Once you are ready, start with Stage 1.