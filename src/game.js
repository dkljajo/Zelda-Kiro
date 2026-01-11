import { Player } from './player.js';
import { World } from './world.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { SpriteRenderer } from './spriteRenderer.js';
import { EffectsManager, EnhancedSpriteRenderer } from './effects.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.input = new Input();
        this.spriteRenderer = new EnhancedSpriteRenderer(ctx);
        this.effects = new EffectsManager(ctx);
        this.ui = new UI();
        
        this.camera = { x: 0, y: 0 };
        this.world = new World();
        this.player = new Player(256, 224); // Center of screen
        
        this.lastTime = 0;
        this.gameRunning = false;
        
        // Game state
        this.currentRoom = { x: 0, y: 0 };
        this.transitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 0.5;
        
        // Enhanced features
        this.gameState = 'playing'; // playing, paused, gameOver
        this.score = 0;
        this.playTime = 0;
    }
    
    start() {
        this.gameRunning = true;
        this.gameLoop(0);
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Handle pause
        if (this.input.isJustPressed('Enter')) {
            this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
        }
        
        if (this.gameState !== 'playing') {
            this.input.update(); // Update input even when paused
            return;
        }
        
        this.playTime += deltaTime;
        
        if (!this.transitioning) {
            this.player.update(deltaTime, this.input, this.world, this.effects);
            this.updateCamera();
            this.checkRoomTransition();
        } else {
            this.updateTransition(deltaTime);
        }
        
        this.world.update(deltaTime, this.player, this.effects);
        this.effects.update(deltaTime);
        
        // Check collisions
        this.world.checkCollisions(this.player, this.effects);
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameState = 'gameOver';
        }
        
        // Update input at the end of the frame
        this.input.update();
    }
    
    updateCamera() {
        // Smooth camera following with slight offset based on player direction
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        
        // Add directional offset for better view ahead
        const directionOffset = 32;
        let offsetX = 0, offsetY = 0;
        
        switch (this.player.direction) {
            case 'up': offsetY = -directionOffset; break;
            case 'down': offsetY = directionOffset; break;
            case 'left': offsetX = -directionOffset; break;
            case 'right': offsetX = directionOffset; break;
        }
        
        // Smooth camera movement
        this.camera.x += (targetX + offsetX - this.camera.x) * 0.1;
        this.camera.y += (targetY + offsetY - this.camera.y) * 0.1;
        
        // Clamp camera to room boundaries
        const roomWidth = 16 * 32;
        const roomHeight = 11 * 32;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, roomWidth - this.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, roomHeight - this.height));
    }
    
    checkRoomTransition() {
        const roomWidth = 16 * 32;
        const roomHeight = 11 * 32;
        const buffer = 8; // Pixels from edge to trigger transition
        
        let transitionDirection = null;
        
        if (this.player.x < buffer) {
            transitionDirection = { dx: -1, dy: 0 };
        } else if (this.player.x > roomWidth - buffer) {
            transitionDirection = { dx: 1, dy: 0 };
        } else if (this.player.y < buffer) {
            transitionDirection = { dx: 0, dy: -1 };
        } else if (this.player.y > roomHeight - buffer) {
            transitionDirection = { dx: 0, dy: 1 };
        }
        
        if (transitionDirection) {
            this.startRoomTransition(transitionDirection.dx, transitionDirection.dy);
        }
    }
    
    startRoomTransition(dx, dy) {
        this.transitioning = true;
        this.transitionTimer = 0;
        this.transitionDirection = { dx, dy };
        
        // Add screen transition effect
        this.effects.addFlash('#000000', 0.8, this.transitionDuration);
    }
    
    updateTransition(deltaTime) {
        this.transitionTimer += deltaTime;
        
        if (this.transitionTimer >= this.transitionDuration / 2 && !this.roomChanged) {
            // Change room at halfway point
            this.currentRoom.x += this.transitionDirection.dx;
            this.currentRoom.y += this.transitionDirection.dy;
            
            // Move player to opposite side of new room
            const roomWidth = 16 * 32;
            const roomHeight = 11 * 32;
            
            if (this.transitionDirection.dx !== 0) {
                this.player.x = this.transitionDirection.dx > 0 ? 32 : roomWidth - 32;
            }
            if (this.transitionDirection.dy !== 0) {
                this.player.y = this.transitionDirection.dy > 0 ? 32 : roomHeight - 32;
            }
            
            // Generate new room
            this.world.generateRoom(this.currentRoom.x, this.currentRoom.y);
            this.roomChanged = true;
        }
        
        if (this.transitionTimer >= this.transitionDuration) {
            this.transitioning = false;
            this.roomChanged = false;
        }
    }
    
    render() {
        // Clear screen with theme-appropriate background
        const bgColor = this.getBackgroundColor();
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Save context for camera transform
            this.ctx.save();
            this.ctx.translate(-this.camera.x, -this.camera.y);
            
            // Render world
            this.world.render(this.ctx, this.spriteRenderer, this.camera, this.effects);
            
            // Render player
            this.player.render(this.ctx, this.spriteRenderer, this.effects);
            
            // Render effects (particles, screen shake, etc.)
            this.effects.render(this.camera);
            
            // Restore context
            this.ctx.restore();
            
            // Render UI (not affected by camera)
            this.ui.render(this.ctx, this.player);
            
            // Render pause overlay
            if (this.gameState === 'paused') {
                this.renderPauseOverlay();
            }
        } else if (this.gameState === 'gameOver') {
            this.renderGameOverScreen();
        }
        
        // Debug info (remove in production)
        if (false) { // Set to true for debugging
            this.renderDebugInfo();
        }
    }
    
    getBackgroundColor() {
        // Theme-based background colors
        const themeColors = {
            forest: '#1a4a1a',
            desert: '#8B7355',
            cave: '#2F2F2F',
            ruins: '#3a3a3a'
        };
        return themeColors[this.world.currentTheme] || themeColors.forest;
    }
    
    renderPauseOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 20);
        
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.fillText('Press ENTER to continue', this.width / 2, this.height / 2 + 20);
        
        this.ctx.restore();
    }
    
    renderGameOverScreen() {
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2);
        this.ctx.fillText(`Time: ${Math.floor(this.playTime)}s`, this.width / 2, this.height / 2 + 20);
        this.ctx.fillText(`Rupees: ${this.player.rupees}`, this.width / 2, this.height / 2 + 40);
        
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.fillText('Refresh to play again', this.width / 2, this.height / 2 + 80);
        
        this.ctx.restore();
    }
    
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, this.height - 100, 200, 90);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '8px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `Player: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
            `Room: ${this.currentRoom.x}, ${this.currentRoom.y}`,
            `Theme: ${this.world.currentTheme}`,
            `Entities: ${this.world.entities.length}`,
            `Particles: ${this.effects.particles.length}`,
            `Health: ${this.player.health}/${this.player.maxHealth}`,
            `Rupees: ${this.player.rupees}`
        ];
        
        debugInfo.forEach((line, index) => {
            this.ctx.fillText(line, 15, this.height - 85 + index * 12);
        });
        
        this.ctx.restore();
    }
}