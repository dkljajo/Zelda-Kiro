// Simple working Zelda game without complex dependencies
export class SimpleZeldaGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.gameState = 'playing'; // playing, gameOver
        this.player = {
            x: 256,
            y: 224,
            width: 16,
            height: 16,
            speed: 100,
            direction: 'down',
            health: 6,
            maxHealth: 6,
            rupees: 0,
            isMoving: false,
            animFrame: 0,
            animTimer: 0
        };
        
        this.camera = { x: 0, y: 0 };
        this.keys = {};
        this.entities = [];
        this.world = this.generateWorld();
        
        this.setupInput();
        this.generateEntities();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }
    
    generateWorld() {
        const world = [];
        const roomWidth = 16;
        const roomHeight = 11;
        
        for (let y = 0; y < roomHeight; y++) {
            world[y] = [];
            for (let x = 0; x < roomWidth; x++) {
                if (x === 0 || x === roomWidth - 1 || y === 0 || y === roomHeight - 1) {
                    world[y][x] = 1; // Wall
                } else if (Math.random() < 0.1) {
                    world[y][x] = 1; // Random walls
                } else {
                    world[y][x] = 0; // Floor
                }
            }
        }
        
        // Clear center area
        for (let y = 4; y < 7; y++) {
            for (let x = 6; x < 10; x++) {
                world[y][x] = 0;
            }
        }
        
        // Add doorways
        world[0][8] = 0;
        world[roomHeight - 1][8] = 0;
        world[5][0] = 0;
        world[5][roomWidth - 1] = 0;
        
        return world;
    }
    
    generateEntities() {
        // Add rupees
        for (let i = 0; i < 5; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * 14) + 1;
                y = Math.floor(Math.random() * 9) + 1;
            } while (this.world[y][x] !== 0);
            
            this.entities.push({
                type: 'rupee',
                x: x * 32 + 16,
                y: y * 32 + 16,
                collected: false,
                animTimer: Math.random() * Math.PI * 2
            });
        }
        
        // Add hearts
        for (let i = 0; i < 2; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * 14) + 1;
                y = Math.floor(Math.random() * 9) + 1;
            } while (this.world[y][x] !== 0);
            
            this.entities.push({
                type: 'heart',
                x: x * 32 + 16,
                y: y * 32 + 16,
                collected: false,
                animTimer: 0
            });
        }
        
        // Add enemies
        for (let i = 0; i < 3; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * 12) + 2;
                y = Math.floor(Math.random() * 7) + 2;
            } while (this.world[y][x] !== 0);
            
            this.entities.push({
                type: 'enemy',
                x: x * 32,
                y: y * 32,
                health: 1,
                direction: Math.floor(Math.random() * 4),
                moveTimer: 0
            });
        }
    }
    
    update(deltaTime) {
        if (this.gameState === 'gameOver') {
            // Check for restart
            if (this.keys['KeyR']) {
                this.restart();
            }
            return;
        }
        
        this.updatePlayer(deltaTime);
        this.updateEntities(deltaTime);
        this.updateCamera();
        this.checkCollisions();
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameState = 'gameOver';
        }
    }
    
    updatePlayer(deltaTime) {
        let dx = 0, dy = 0;
        this.player.isMoving = false;
        
        if (this.keys['ArrowUp']) {
            dy = -this.player.speed * deltaTime;
            this.player.direction = 'up';
            this.player.isMoving = true;
        } else if (this.keys['ArrowDown']) {
            dy = this.player.speed * deltaTime;
            this.player.direction = 'down';
            this.player.isMoving = true;
        }
        
        if (this.keys['ArrowLeft']) {
            dx = -this.player.speed * deltaTime;
            this.player.direction = 'left';
            this.player.isMoving = true;
        } else if (this.keys['ArrowRight']) {
            dx = this.player.speed * deltaTime;
            this.player.direction = 'right';
            this.player.isMoving = true;
        }
        
        // Move player
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check wall collisions
        if (!this.checkWallCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkWallCollision(this.player.x, newY)) {
            this.player.y = newY;
        }
        
        // Update animation
        if (this.player.isMoving) {
            this.player.animTimer += deltaTime;
            if (this.player.animTimer >= 0.2) {
                this.player.animFrame = (this.player.animFrame + 1) % 2;
                this.player.animTimer = 0;
            }
        } else {
            this.player.animFrame = 0;
        }
    }
    
    checkWallCollision(x, y) {
        const tileSize = 32;
        const leftTile = Math.floor(x / tileSize);
        const rightTile = Math.floor((x + this.player.width) / tileSize);
        const topTile = Math.floor(y / tileSize);
        const bottomTile = Math.floor((y + this.player.height) / tileSize);
        
        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (ty < 0 || ty >= 11 || tx < 0 || tx >= 16) return true;
                if (this.world[ty][tx] === 1) return true;
            }
        }
        return false;
    }
    
    updateEntities(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.type === 'rupee' || entity.type === 'heart') {
                entity.animTimer += deltaTime * 3;
            } else if (entity.type === 'enemy' && entity.health > 0) {
                entity.moveTimer += deltaTime;
                if (entity.moveTimer >= 1) {
                    entity.direction = Math.floor(Math.random() * 4);
                    entity.moveTimer = 0;
                }
                
                const speed = 20;
                const dx = [0, 1, 0, -1][entity.direction] * speed * deltaTime;
                const dy = [-1, 0, 1, 0][entity.direction] * speed * deltaTime;
                
                const newX = entity.x + dx;
                const newY = entity.y + dy;
                
                const tileX = Math.floor(newX / 32);
                const tileY = Math.floor(newY / 32);
                
                if (tileX >= 0 && tileX < 16 && tileY >= 0 && tileY < 11 && this.world[tileY][tileX] === 0) {
                    entity.x = newX;
                    entity.y = newY;
                }
            }
        });
    }
    
    updateCamera() {
        this.camera.x = this.player.x - this.width / 2;
        this.camera.y = this.player.y - this.height / 2;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, 16 * 32 - this.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, 11 * 32 - this.height));
    }
    
    checkCollisions() {
        this.entities.forEach(entity => {
            if (entity.collected || entity.health <= 0) return;
            
            const dx = this.player.x + 8 - entity.x;
            const dy = this.player.y + 8 - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                if (entity.type === 'rupee') {
                    this.player.rupees++;
                    entity.collected = true;
                    console.log('Collected rupee! Total:', this.player.rupees);
                } else if (entity.type === 'heart') {
                    if (this.player.health < this.player.maxHealth) {
                        this.player.health++;
                        entity.collected = true;
                        console.log('Health restored! Health:', this.player.health);
                    }
                } else if (entity.type === 'enemy') {
                    if (this.keys['KeyZ']) {
                        entity.health = 0;
                        console.log('Enemy defeated!');
                        // Add rupee drop
                        this.entities.push({
                            type: 'rupee',
                            x: entity.x + 8,
                            y: entity.y + 8,
                            collected: false,
                            animTimer: 0
                        });
                    } else {
                        this.player.health = Math.max(0, this.player.health - 1);
                        console.log('Player hit! Health:', this.player.health);
                        if (this.player.health === 0) {
                            console.log('Game Over!');
                        }
                    }
                }
            }
        });
        
        // Remove collected entities
        this.entities = this.entities.filter(entity => !entity.collected && entity.health > 0);
    }
    
    render() {
        // Clear screen
        this.ctx.fillStyle = '#1a4a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'gameOver') {
            this.renderGameOver();
            return;
        }
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render world
        this.renderWorld();
        
        // Render entities
        this.renderEntities();
        
        // Render player
        this.renderPlayer();
        
        this.ctx.restore();
        
        // Render UI
        this.renderUI();
    }
    
    renderWorld() {
        const tileSize = 32;
        
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 16; x++) {
                const tileX = x * tileSize;
                const tileY = y * tileSize;
                
                if (this.world[y][x] === 0) {
                    // Floor
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    // Grass texture (deterministic)
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < 8; i++) {
                        const px = tileX + (i % 4) * 8 + ((x + y + i) % 4);
                        const py = tileY + Math.floor(i / 4) * 16 + ((x * y + i) % 4);
                        this.ctx.fillRect(px, py, 2, 2);
                    }
                } else {
                    // Wall
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    this.ctx.fillStyle = '#A0522D';
                    this.ctx.fillRect(tileX + 2, tileY + 2, tileSize - 4, tileSize - 4);
                    
                    this.ctx.fillStyle = '#654321';
                    this.ctx.fillRect(tileX + 4, tileY + 4, tileSize - 8, tileSize - 8);
                }
            }
        }
    }
    
    renderEntities() {
        this.entities.forEach(entity => {
            if (entity.collected || entity.health <= 0) return;
            
            if (entity.type === 'rupee') {
                const bounce = Math.sin(entity.animTimer) * 2;
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(entity.x - 6, entity.y - 8 + bounce, 12, 16);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(entity.x - 2, entity.y - 4 + bounce, 4, 8);
            } else if (entity.type === 'heart') {
                const bounce = Math.sin(entity.animTimer) * 1;
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(entity.x - 8, entity.y - 4 + bounce, 6, 6);
                this.ctx.fillRect(entity.x + 2, entity.y - 4 + bounce, 6, 6);
                this.ctx.fillRect(entity.x - 6, entity.y + 2 + bounce, 12, 6);
                this.ctx.fillRect(entity.x - 4, entity.y + 8 + bounce, 8, 4);
            } else if (entity.type === 'enemy') {
                this.ctx.fillStyle = '#FF4444';
                this.ctx.fillRect(entity.x, entity.y, 16, 16);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(entity.x + 3, entity.y + 3, 3, 3);
                this.ctx.fillRect(entity.x + 10, entity.y + 3, 3, 3);
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(entity.x + 4, entity.y + 4, 1, 1);
                this.ctx.fillRect(entity.x + 11, entity.y + 4, 1, 1);
            }
        });
    }
    
    renderPlayer() {
        // Link body
        this.ctx.fillStyle = '#00AA00';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 4, 12, 12);
        
        // Head
        this.ctx.fillStyle = '#FFDDAA';
        this.ctx.fillRect(this.player.x + 4, this.player.y, 8, 6);
        
        // Hat
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(this.player.x + 3, this.player.y, 10, 4);
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 2, 1, 1);
        this.ctx.fillRect(this.player.x + 10, this.player.y + 2, 1, 1);
        
        // Legs with animation
        this.ctx.fillStyle = '#8B4513';
        if (this.player.isMoving && this.player.animFrame === 1) {
            this.ctx.fillRect(this.player.x + 3, this.player.y + 12, 3, 4);
            this.ctx.fillRect(this.player.x + 10, this.player.y + 12, 3, 4);
        } else {
            this.ctx.fillRect(this.player.x + 4, this.player.y + 12, 3, 4);
            this.ctx.fillRect(this.player.x + 9, this.player.y + 12, 3, 4);
        }
        
        // Sword when attacking
        if (this.keys['KeyZ']) {
            this.ctx.fillStyle = '#C0C0C0';
            const swordLength = 20;
            let swordX = this.player.x + 8;
            let swordY = this.player.y + 8;
            
            switch (this.player.direction) {
                case 'up':
                    this.ctx.fillRect(swordX - 1, swordY - swordLength, 2, swordLength);
                    break;
                case 'down':
                    this.ctx.fillRect(swordX - 1, swordY + 16, 2, swordLength);
                    break;
                case 'left':
                    this.ctx.fillRect(swordX - swordLength, swordY - 1, swordLength, 2);
                    break;
                case 'right':
                    this.ctx.fillRect(swordX + 16, swordY - 1, swordLength, 2);
                    break;
            }
        }
    }
    
    renderUI() {
        // Health
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillText('LIFE', 20, 30);
        
        for (let i = 0; i < this.player.maxHealth; i++) {
            this.ctx.fillStyle = i < this.player.health ? '#FF0000' : '#333333';
            this.ctx.fillRect(80 + i * 20, 20, 16, 16);
        }
        
        // Rupees
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('RUPEES', 20, 60);
        this.ctx.fillText(this.player.rupees.toString().padStart(3, '0'), 120, 60);
        
        // Controls
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '8px monospace';
        this.ctx.fillText('ARROW KEYS: MOVE | Z: SWORD', 20, this.height - 20);
    }
    
    renderGameOver() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '24px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillText(`Final Score: ${this.player.rupees} Rupees`, this.width / 2, this.height / 2);
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 40);
        
        this.ctx.textAlign = 'left';
    }
    
    restart() {
        this.gameState = 'playing';
        this.player = {
            x: 256,
            y: 224,
            width: 16,
            height: 16,
            speed: 100,
            direction: 'down',
            health: 6,
            maxHealth: 6,
            rupees: 0,
            isMoving: false,
            animFrame: 0,
            animTimer: 0
        };
        this.entities = [];
        this.world = this.generateWorld();
        this.generateEntities();
        console.log('Game restarted!');
    }
    
    start() {
        const gameLoop = (currentTime) => {
            const deltaTime = Math.min((currentTime - (this.lastTime || 0)) / 1000, 0.016);
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
}