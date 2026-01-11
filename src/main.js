import { EnhancedZeldaGame } from './enhancedGame.js';

// Initialize the enhanced 2D Zelda game with real gameplay
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Disable image smoothing for pixel-perfect rendering
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

// Scale up the canvas for retro pixel effect
const scale = 2;
canvas.style.width = (canvas.width * scale) + 'px';
canvas.style.height = (canvas.height * scale) + 'px';

// Start the enhanced game with levels and objectives
const game = new EnhancedZeldaGame(canvas, ctx);
game.start();

console.log('Enhanced Zelda game with real gameplay started!');
console.log('Complete objectives to advance through 5 challenging levels!');