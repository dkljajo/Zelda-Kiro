// Enhanced Zelda game with real gameplay, levels, and objectives
export class EnhancedZeldaGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game progression
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.levelObjectives = {
            1: { enemies: 3, rupees: 5, description: "Defeat 3 enemies and collect 5 rupees" },
            2: { enemies: 5, rupees: 8, description: "Defeat 5 enemies and collect 8 rupees" },
            3: { enemies: 7, rupees: 12, description: "Defeat 7 enemies and collect 12 rupees" },
            4: { enemies: 10, rupees: 15, description: "Defeat 10 enemies and collect 15 rupees" },
            5: { enemies: 15, rupees: 20, description: "Final Boss Level - Defeat all enemies!" }
        };
        
        // Game state
        this.gameState = 'playing'; // playing, levelComplete, gameWon, gameOver
        this.enemiesDefeated = 0;
        this.rupeesCollected = 0;
        
        this.player = {
            x: 256,
            y: 224,
            width: 16,
            height: 16,
            speed: 120, // Faster movement
            direction: 'down',
            health: 6,
            maxHealth: 6,
            rupees: 0,
            isMoving: false,
            animFrame: 0,
            animTimer: 0,
            // Combat improvements
            isAttacking: false,
            attackTimer: 0,
            attackDuration: 0.3,
            attackCooldown: 0,
            invulnerable: false,
            invulnerabilityTimer: 0
        };
        
        this.camera = { x: 0, y: 0 };
        this.keys = {};
        this.entities = [];
        this.world = this.generateWorld();
        
        this.setupInput();
        this.generateLevel();
        
        console.log(`Level ${this.currentLevel} started!`);
        console.log(`Objective: ${this.levelObjectives[this.currentLevel].description}`);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Also store by key for easier access
            this.keys[e.key.toLowerCase()] = true;
            
            // Debug: log key presses to help with combat
            if (e.key.toLowerCase() === 'z' || e.code === 'KeyZ') {
                console.log('Z key pressed for combat! Key:', e.key, 'Code:', e.code);
            }
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
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
                } else if (Math.random() < 0.08) {
                    world[y][x] = 1; // Random walls
                } else {
                    world[y][x] = 0; // Floor
                }
            }
        }
        
        // Clear center area for player spawn
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
    
    generateLevel() {
        this.entities = [];
        const objective = this.levelObjectives[this.currentLevel];
        
        // Generate enemies based on level
        const enemyCount = objective.enemies;
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * 12) + 2;
                y = Math.floor(Math.random() * 7) + 2;
            } while (this.world[y][x] !== 0 || (x >= 6 && x <= 9 && y >= 4 && y <= 6));
            
            // Different enemy types based on level
            const enemyType = this.currentLevel >= 3 ? (Math.random() < 0.5 ? 'octorok' : 'moblin') : 'octorok';
            
            this.entities.push({
                type: enemyType,
                x: x * 32,
                y: y * 32,
                health: enemyType === 'moblin' ? 2 : 1,
                maxHealth: enemyType === 'moblin' ? 2 : 1,
                direction: Math.floor(Math.random() * 4),
                moveTimer: 0,
                speed: enemyType === 'moblin' ? 40 : 60,
                attackTimer: 0,
                chaseRange: 80,
                isChasing: false
            });
        }
        
        // Generate rupees
        const rupeeCount = objective.rupees;
        for (let i = 0; i < rupeeCount; i++) {
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
        
        // Add heart containers (fewer than rupees)
        const heartCount = Math.max(1, Math.floor(this.currentLevel / 2));
        for (let i = 0; i < heartCount; i++) {
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
    }
    
    update(deltaTime) {
        if (this.gameState === 'gameOver') {
            if (this.keys['r'] || this.keys['KeyR']) {
                this.restart();
            }
            return;
        }
        
        if (this.gameState === 'levelComplete') {
            if (this.keys[' '] || this.keys['Space']) {
                this.nextLevel();
            }
            return;
        }
        
        if (this.gameState === 'gameWon') {
            if (this.keys['r'] || this.keys['KeyR']) {
                this.restart();
            }
            return;
        }
        
        this.updatePlayer(deltaTime);
        this.updateEntities(deltaTime);
        this.updateCamera();
        this.checkCollisions();
        this.checkLevelComplete();
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameState = 'gameOver';
        }
    }
    
    updatePlayer(deltaTime) {
        // Update attack cooldown
        if (this.player.attackCooldown > 0) {
            this.player.attackCooldown -= deltaTime;
        }
        
        // Update attack state
        if (this.player.isAttacking) {
            this.player.attackTimer += deltaTime;
            if (this.player.attackTimer >= this.player.attackDuration) {
                this.player.isAttacking = false;
                this.player.attackTimer = 0;
            }
        }
        
        // Update invulnerability
        if (this.player.invulnerable) {
            this.player.invulnerabilityTimer += deltaTime;
            if (this.player.invulnerabilityTimer >= 1.0) {
                this.player.invulnerable = false;
                this.player.invulnerabilityTimer = 0;
            }
        }
        
        // Handle attack input - check for both 'z' key and 'KeyZ' code
        if ((this.keys['z'] || this.keys['KeyZ']) && !this.player.isAttacking && this.player.attackCooldown <= 0) {
            this.player.isAttacking = true;
            this.player.attackTimer = 0;
            this.player.attackCooldown = 0.5; // Prevent spam
            console.log('Attack initiated!');
        }
        
        // Movement (can move while attacking)
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
        
        // Move player with collision
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (!this.checkWallCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkWallCollision(this.player.x, newY)) {
            this.player.y = newY;
        }
        
        // Update animation
        if (this.player.isMoving) {
            this.player.animTimer += deltaTime;
            if (this.player.animTimer >= 0.15) {
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
            } else if ((entity.type === 'octorok' || entity.type === 'moblin') && entity.health > 0) {
                // Enhanced AI
                const dx = this.player.x - entity.x;
                const dy = this.player.y - entity.y;
                const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
                
                // Chase behavior
                if (distanceToPlayer < entity.chaseRange) {
                    entity.isChasing = true;
                    // Move towards player
                    if (Math.abs(dx) > Math.abs(dy)) {
                        entity.direction = dx > 0 ? 1 : 3; // right : left
                    } else {
                        entity.direction = dy > 0 ? 2 : 0; // down : up
                    }
                } else {
                    entity.isChasing = false;
                    // Random movement
                    entity.moveTimer += deltaTime;
                    if (entity.moveTimer >= 1.5) {
                        entity.direction = Math.floor(Math.random() * 4);
                        entity.moveTimer = 0;
                    }
                }
                
                // Move enemy
                const speed = entity.isChasing ? entity.speed * 1.5 : entity.speed;
                const moveX = [0, 1, 0, -1][entity.direction] * speed * deltaTime;
                const moveY = [-1, 0, 1, 0][entity.direction] * speed * deltaTime;
                
                const newX = entity.x + moveX;
                const newY = entity.y + moveY;
                
                // Check collision with walls
                const tileX = Math.floor(newX / 32);
                const tileY = Math.floor(newY / 32);
                
                if (tileX >= 0 && tileX < 16 && tileY >= 0 && tileY < 11 && this.world[tileY][tileX] === 0) {
                    entity.x = newX;
                    entity.y = newY;
                } else if (entity.isChasing) {
                    // Try alternative direction when chasing
                    entity.direction = (entity.direction + 1) % 4;
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
            if (entity.collected || (entity.health !== undefined && entity.health <= 0)) return;
            
            // Calculate distance between player center and entity center
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            const entityCenterX = entity.x;
            const entityCenterY = entity.y;
            
            const dx = playerCenterX - entityCenterX;
            const dy = playerCenterY - entityCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Different collision distances for different entity types
            let collisionDistance = 20;
            if (entity.type === 'rupee' || entity.type === 'heart') {
                collisionDistance = 30; // Even larger collision area for collectibles
            }
            
            // Debug logging for rupee collision attempts
            if (entity.type === 'rupee' && distance < 40) {
                console.log(`Near rupee - Distance: ${distance.toFixed(1)}, Threshold: ${collisionDistance}, Player: (${playerCenterX.toFixed(1)}, ${playerCenterY.toFixed(1)}), Rupee: (${entityCenterX.toFixed(1)}, ${entityCenterY.toFixed(1)})`);
            }
            
            if (distance < collisionDistance) {
                if (entity.type === 'rupee') {
                    this.player.rupees++;
                    this.rupeesCollected++;
                    entity.collected = true;
                    console.log(`✅ RUPEE COLLECTED! Progress: ${this.rupeesCollected}/${this.levelObjectives[this.currentLevel].rupees}`);
                    console.log(`Final distance was: ${distance.toFixed(1)}`);
                } else if (entity.type === 'heart') {
                    if (this.player.health < this.player.maxHealth) {
                        this.player.health++;
                        entity.collected = true;
                        console.log('❤️ Health restored!');
                    }
                } else if (entity.type === 'octorok' || entity.type === 'moblin') {
                    if (this.player.isAttacking) {
                        // Player attacks enemy
                        entity.health--;
                        if (entity.health <= 0) {
                            this.enemiesDefeated++;
                            console.log(`⚔️ Enemy defeated! Progress: ${this.enemiesDefeated}/${this.levelObjectives[this.currentLevel].enemies}`);
                            
                            // Drop rupee
                            this.entities.push({
                                type: 'rupee',
                                x: entity.x,
                                y: entity.y,
                                collected: false,
                                animTimer: 0
                            });
                        }
                    } else if (!this.player.invulnerable) {
                        // Enemy attacks player
                        this.player.health--;
                        this.player.invulnerable = true;
                        this.player.invulnerabilityTimer = 0;
                        console.log(`💔 Player hit! Health: ${this.player.health}`);
                        
                        if (this.player.health === 0) {
                            console.log('💀 Game Over!');
                        }
                    }
                }
            }
        });
        
        // Remove collected entities and dead enemies
        this.entities = this.entities.filter(entity => !entity.collected && (entity.health === undefined || entity.health > 0));
    }
    
    checkLevelComplete() {
        const objective = this.levelObjectives[this.currentLevel];
        
        if (this.enemiesDefeated >= objective.enemies && this.rupeesCollected >= objective.rupees) {
            this.gameState = 'levelComplete';
            console.log(`Level ${this.currentLevel} completed!`);
        }
    }
    
    nextLevel() {
        if (this.currentLevel >= this.maxLevel) {
            this.gameState = 'gameWon';
            console.log('Game completed! You won!');
            return;
        }
        
        this.currentLevel++;
        this.enemiesDefeated = 0;
        this.rupeesCollected = 0;
        this.gameState = 'playing';
        
        // Restore some health for next level
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
        
        // Reset player position
        this.player.x = 256;
        this.player.y = 224;
        
        // Generate new level
        this.world = this.generateWorld();
        this.generateLevel();
        
        console.log(`Level ${this.currentLevel} started!`);
        console.log(`Objective: ${this.levelObjectives[this.currentLevel].description}`);
    }
    
    render() {
        // Clear screen
        this.ctx.fillStyle = '#1a4a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'gameOver') {
            this.renderGameOver();
            return;
        }
        
        if (this.gameState === 'levelComplete') {
            this.renderLevelComplete();
            return;
        }
        
        if (this.gameState === 'gameWon') {
            this.renderGameWon();
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
            } else if (entity.type === 'octorok') {
                // Red octorok
                this.ctx.fillStyle = entity.isChasing ? '#FF6666' : '#FF4444';
                this.ctx.fillRect(entity.x, entity.y, 16, 16);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(entity.x + 3, entity.y + 3, 3, 3);
                this.ctx.fillRect(entity.x + 10, entity.y + 3, 3, 3);
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(entity.x + 4, entity.y + 4, 1, 1);
                this.ctx.fillRect(entity.x + 11, entity.y + 4, 1, 1);
            } else if (entity.type === 'moblin') {
                // Blue moblin (stronger enemy)
                this.ctx.fillStyle = entity.isChasing ? '#6666FF' : '#4444AA';
                this.ctx.fillRect(entity.x, entity.y, 16, 20);
                
                // Head
                this.ctx.fillStyle = '#6666CC';
                this.ctx.fillRect(entity.x + 2, entity.y - 4, 12, 8);
                
                // Eyes
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(entity.x + 4, entity.y - 2, 2, 2);
                this.ctx.fillRect(entity.x + 10, entity.y - 2, 2, 2);
                
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(entity.x + 5, entity.y - 1, 1, 1);
                this.ctx.fillRect(entity.x + 11, entity.y - 1, 1, 1);
                
                // Health indicator
                if (entity.health < entity.maxHealth) {
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(entity.x, entity.y - 8, 16, 2);
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(entity.x, entity.y - 8, (entity.health / entity.maxHealth) * 16, 2);
                }
            }
        });
    }
    
    renderPlayer() {
        // Flash when invulnerable
        const alpha = (this.player.invulnerable && Math.floor(this.player.invulnerabilityTimer * 10) % 2) ? 0.5 : 1.0;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
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
        
        this.ctx.restore();
        
        // Sword when attacking
        if (this.player.isAttacking) {
            this.ctx.fillStyle = '#C0C0C0';
            const swordLength = 24;
            let swordX = this.player.x + 8;
            let swordY = this.player.y + 8;
            
            // Sword swing animation
            const swingProgress = this.player.attackTimer / this.player.attackDuration;
            const swingOffset = Math.sin(swingProgress * Math.PI) * 6;
            
            switch (this.player.direction) {
                case 'up':
                    this.ctx.fillRect(swordX - 1, swordY - swordLength + swingOffset, 3, swordLength);
                    break;
                case 'down':
                    this.ctx.fillRect(swordX - 1, swordY + 16 - swingOffset, 3, swordLength);
                    break;
                case 'left':
                    this.ctx.fillRect(swordX - swordLength + swingOffset, swordY - 1, swordLength, 3);
                    break;
                case 'right':
                    this.ctx.fillRect(swordX + 16 - swingOffset, swordY - 1, swordLength, 3);
                    break;
            }
            
            // Sword hilt
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(swordX - 2, swordY - 2, 5, 5);
        }
    }
    
    renderUI() {
        // Level info
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.fillText(`LEVEL ${this.currentLevel}`, 20, 25);
        
        // Health
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillText('LIFE', 20, 45);
        
        for (let i = 0; i < this.player.maxHealth; i++) {
            this.ctx.fillStyle = i < this.player.health ? '#FF0000' : '#333333';
            this.ctx.fillRect(70 + i * 18, 35, 14, 14);
        }
        
        // Objectives
        const objective = this.levelObjectives[this.currentLevel];
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.fillText(`ENEMIES: ${this.enemiesDefeated}/${objective.enemies}`, 20, 65);
        this.ctx.fillText(`RUPEES: ${this.rupeesCollected}/${objective.rupees}`, 20, 80);
        
        // Controls and debug info
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.font = '6px monospace';
        this.ctx.fillText('ARROWS: MOVE | z: ATTACK', 20, this.height - 10);
        
        // Show if Z key is being pressed (for debugging)
        if (this.keys['z'] || this.keys['KeyZ']) {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillText('Z PRESSED!', 200, this.height - 10);
        }
    }
    
    renderLevelComplete() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL ${this.currentLevel}`, this.width / 2, this.height / 2 - 60);
        this.ctx.fillText('COMPLETE!', this.width / 2, this.height / 2 - 30);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillText(`Enemies Defeated: ${this.enemiesDefeated}`, this.width / 2, this.height / 2);
        this.ctx.fillText(`Rupees Collected: ${this.rupeesCollected}`, this.width / 2, this.height / 2 + 20);
        
        if (this.currentLevel < this.maxLevel) {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillText('Press SPACE for Next Level', this.width / 2, this.height / 2 + 50);
        } else {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillText('Final Level Complete!', this.width / 2, this.height / 2 + 50);
            this.ctx.fillText('Press SPACE to Continue', this.width / 2, this.height / 2 + 70);
        }
        
        this.ctx.textAlign = 'left';
    }
    
    renderGameWon() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VICTORY!', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillText('You completed all levels!', this.width / 2, this.height / 2);
        this.ctx.fillText(`Total Rupees: ${this.player.rupees}`, this.width / 2, this.height / 2 + 20);
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillText('Press R to Play Again', this.width / 2, this.height / 2 + 50);
        
        this.ctx.textAlign = 'left';
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
        this.ctx.fillText(`Reached Level: ${this.currentLevel}`, this.width / 2, this.height / 2);
        this.ctx.fillText(`Final Score: ${this.player.rupees} Rupees`, this.width / 2, this.height / 2 + 20);
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 50);
        
        this.ctx.textAlign = 'left';
    }
    
    restart() {
        this.currentLevel = 1;
        this.enemiesDefeated = 0;
        this.rupeesCollected = 0;
        this.gameState = 'playing';
        
        this.player = {
            x: 256,
            y: 224,
            width: 16,
            height: 16,
            speed: 120,
            direction: 'down',
            health: 6,
            maxHealth: 6,
            rupees: 0,
            isMoving: false,
            animFrame: 0,
            animTimer: 0,
            isAttacking: false,
            attackTimer: 0,
            attackDuration: 0.3,
            attackCooldown: 0,
            invulnerable: false,
            invulnerabilityTimer: 0
        };
        
        this.entities = [];
        this.world = this.generateWorld();
        this.generateLevel();
        
        console.log('Game restarted!');
        console.log(`Level ${this.currentLevel} started!`);
        console.log(`Objective: ${this.levelObjectives[this.currentLevel].description}`);
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