import { SPRITES, COLORS, TILE_SPRITES, TILE_COLORS } from './sprites.js';
import { EnhancedSpriteRenderer } from './effects.js';

export class World {
    constructor() {
        this.tileSize = 32;
        this.roomWidth = 16; // tiles
        this.roomHeight = 11; // tiles
        
        // Current room data
        this.currentRoom = this.generateRoomData(0, 0);
        
        // Collectibles and enemies
        this.entities = [];
        this.generateEntities();
        
        // Enhanced world features
        this.roomThemes = ['forest', 'desert', 'cave', 'ruins'];
        this.currentTheme = 'forest';
        this.ambientTimer = 0;
    }
    
    generateRoomData(roomX, roomY) {
        // Determine room theme based on coordinates
        const themeIndex = (Math.abs(roomX) + Math.abs(roomY)) % this.roomThemes.length;
        this.currentTheme = this.roomThemes[themeIndex];
        
        const room = [];
        
        for (let y = 0; y < this.roomHeight; y++) {
            room[y] = [];
            for (let x = 0; x < this.roomWidth; x++) {
                // Walls around the edges
                if (x === 0 || x === this.roomWidth - 1 || y === 0 || y === this.roomHeight - 1) {
                    room[y][x] = 1; // Wall
                } else {
                    // Theme-based generation
                    if (this.currentTheme === 'forest') {
                        room[y][x] = Math.random() < 0.08 ? 1 : 0;
                    } else if (this.currentTheme === 'desert') {
                        room[y][x] = Math.random() < 0.05 ? 1 : 0;
                    } else if (this.currentTheme === 'cave') {
                        room[y][x] = Math.random() < 0.15 ? 1 : 0;
                    } else { // ruins
                        room[y][x] = Math.random() < 0.12 ? 1 : 0;
                    }
                }
            }
        }
        
        // Always keep center area clear for player movement
        for (let y = 4; y < 7; y++) {
            for (let x = 6; x < 10; x++) {
                room[y][x] = 0;
            }
        }
        
        // Add doorways
        room[0][8] = 0; // Top door
        room[this.roomHeight - 1][8] = 0; // Bottom door
        room[5][0] = 0; // Left door
        room[5][this.roomWidth - 1] = 0; // Right door
        
        // Add special room features
        this.addRoomFeatures(room);
        
        return room;
    }
    
    addRoomFeatures(room) {
        // Add themed decorative elements
        if (this.currentTheme === 'forest') {
            // Add tree clusters
            for (let i = 0; i < 3; i++) {
                const x = Math.floor(Math.random() * (this.roomWidth - 4)) + 2;
                const y = Math.floor(Math.random() * (this.roomHeight - 4)) + 2;
                if (room[y][x] === 0) {
                    room[y][x] = 2; // Tree tile
                }
            }
        } else if (this.currentTheme === 'desert') {
            // Add sand dunes (visual only)
            for (let i = 0; i < 5; i++) {
                const x = Math.floor(Math.random() * (this.roomWidth - 2)) + 1;
                const y = Math.floor(Math.random() * (this.roomHeight - 2)) + 1;
                if (room[y][x] === 0) {
                    room[y][x] = 3; // Sand dune
                }
            }
        }
    }
    
    generateRoom(roomX, roomY) {
        this.currentRoom = this.generateRoomData(roomX, roomY);
        this.entities = [];
        this.generateEntities();
    }
    
    generateEntities() {
        // Theme-based entity generation
        const rupeeCount = this.currentTheme === 'desert' ? 8 : 5;
        const enemyCount = this.currentTheme === 'cave' ? 5 : 3;
        
        // Add rupees with different colors based on theme
        for (let i = 0; i < rupeeCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.roomWidth - 2)) + 1;
                y = Math.floor(Math.random() * (this.roomHeight - 2)) + 1;
            } while (this.getTile(x, y) !== 0);
            
            const rupeeType = this.currentTheme === 'desert' ? 'blue' : 'green';
            const value = rupeeType === 'blue' ? 5 : 1;
            
            this.entities.push({
                type: 'rupee',
                subtype: rupeeType,
                x: x * this.tileSize + 8,
                y: y * this.tileSize + 8,
                value: value,
                collected: false,
                animTimer: Math.random() * Math.PI * 2,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Add heart containers (less frequent)
        if (Math.random() < 0.4) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.roomWidth - 2)) + 1;
                y = Math.floor(Math.random() * (this.roomHeight - 2)) + 1;
            } while (this.getTile(x, y) !== 0);
            
            this.entities.push({
                type: 'heart',
                x: x * this.tileSize + 8,
                y: y * this.tileSize + 8,
                collected: false,
                animTimer: 0,
                pulseTimer: 0
            });
        }
        
        // Add keys occasionally
        if (Math.random() < 0.2) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.roomWidth - 2)) + 1;
                y = Math.floor(Math.random() * (this.roomHeight - 2)) + 1;
            } while (this.getTile(x, y) !== 0);
            
            this.entities.push({
                type: 'key',
                x: x * this.tileSize + 8,
                y: y * this.tileSize + 8,
                collected: false,
                animTimer: 0,
                sparkleTimer: 0
            });
        }
        
        // Add themed enemies
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.roomWidth - 4)) + 2;
                y = Math.floor(Math.random() * (this.roomHeight - 4)) + 2;
            } while (this.getTile(x, y) !== 0);
            
            const enemyType = this.getEnemyTypeForTheme();
            
            this.entities.push({
                type: enemyType,
                x: x * this.tileSize,
                y: y * this.tileSize,
                health: enemyType === 'moblin' ? 3 : 1,
                maxHealth: enemyType === 'moblin' ? 3 : 1,
                direction: Math.floor(Math.random() * 4),
                moveTimer: 0,
                moveInterval: 1 + Math.random() * 2,
                speed: enemyType === 'moblin' ? 15 : 25,
                attackTimer: 0,
                stunTimer: 0,
                lastPlayerDistance: 999
            });
        }
    }
    
    getEnemyTypeForTheme() {
        switch (this.currentTheme) {
            case 'forest': return Math.random() < 0.7 ? 'octorok' : 'moblin';
            case 'desert': return 'octorok';
            case 'cave': return 'moblin';
            case 'ruins': return Math.random() < 0.5 ? 'octorok' : 'moblin';
            default: return 'octorok';
        }
    }
    
    getTile(x, y) {
        if (x < 0 || x >= this.roomWidth || y < 0 || y >= this.roomHeight) {
            return 1; // Wall outside bounds
        }
        return this.currentRoom[y][x];
    }
    
    update(deltaTime, player, effects) {
        this.ambientTimer += deltaTime;
        
        // Update entities with enhanced AI
        this.entities.forEach(entity => {
            if (entity.type === 'rupee' || entity.type === 'heart' || entity.type === 'key') {
                entity.animTimer += deltaTime * 3;
                if (entity.type === 'heart') {
                    entity.pulseTimer += deltaTime * 5;
                }
                if (entity.type === 'key') {
                    entity.sparkleTimer += deltaTime * 8;
                }
            } else if (entity.type === 'octorok' || entity.type === 'moblin') {
                this.updateEnemy(entity, deltaTime, player, effects);
            }
        });
        
        // Remove collected items and dead enemies
        this.entities = this.entities.filter(entity => !entity.collected && entity.health > 0);
        
        // Add ambient effects
        if (this.ambientTimer > 2.0) {
            this.addAmbientEffects(effects);
            this.ambientTimer = 0;
        }
    }
    
    updateEnemy(entity, deltaTime, player, effects) {
        // Calculate distance to player
        const dx = player.x - entity.x;
        const dy = player.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Update timers
        entity.moveTimer += deltaTime;
        if (entity.attackTimer > 0) entity.attackTimer -= deltaTime;
        if (entity.stunTimer > 0) entity.stunTimer -= deltaTime;
        
        // Enhanced AI behavior
        if (entity.stunTimer <= 0) {
            if (distance < 80 && distance > 20) {
                // Chase player
                entity.direction = this.getDirectionToPlayer(entity, player);
                entity.moveInterval = 0.3; // Faster when chasing
            } else if (entity.moveTimer >= entity.moveInterval) {
                // Random movement
                entity.direction = Math.floor(Math.random() * 4);
                entity.moveTimer = 0;
                entity.moveInterval = 1 + Math.random() * 2;
            }
            
            // Move enemy
            const speed = entity.speed * (distance < 80 ? 1.5 : 1); // Speed up when chasing
            const dx = [0, 1, 0, -1][entity.direction] * speed * deltaTime;
            const dy = [-1, 0, 1, 0][entity.direction] * speed * deltaTime;
            
            const newX = entity.x + dx;
            const newY = entity.y + dy;
            
            // Check collision with walls
            const tileX = Math.floor(newX / this.tileSize);
            const tileY = Math.floor(newY / this.tileSize);
            
            if (this.getTile(tileX, tileY) === 0) {
                entity.x = newX;
                entity.y = newY;
            } else {
                // Hit wall, change direction
                entity.direction = (entity.direction + 2) % 4;
            }
        }
        
        entity.lastPlayerDistance = distance;
    }
    
    getDirectionToPlayer(entity, player) {
        const dx = player.x - entity.x;
        const dy = player.y - entity.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 1 : 3; // right : left
        } else {
            return dy > 0 ? 2 : 0; // down : up
        }
    }
    
    addAmbientEffects(effects) {
        if (this.currentTheme === 'forest') {
            // Falling leaves
            for (let i = 0; i < 2; i++) {
                effects.addParticle(
                    Math.random() * 512,
                    -10,
                    'leaf',
                    {
                        vx: (Math.random() - 0.5) * 20,
                        vy: Math.random() * 30 + 20,
                        life: 3.0,
                        color: Math.random() < 0.5 ? '#228B22' : '#8B4513',
                        size: 2
                    }
                );
            }
        } else if (this.currentTheme === 'desert') {
            // Sand particles
            for (let i = 0; i < 3; i++) {
                effects.addParticle(
                    Math.random() * 512,
                    Math.random() * 448,
                    'sand',
                    {
                        vx: Math.random() * 40 + 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 2.0,
                        color: '#DEB887',
                        size: 1
                    }
                );
            }
        }
    }
    
    render(ctx, spriteRenderer, camera, effects) {
        // Render tiles with enhanced graphics
        for (let y = 0; y < this.roomHeight; y++) {
            for (let x = 0; x < this.roomWidth; x++) {
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                // Only render tiles visible on screen
                if (tileX + this.tileSize < camera.x || tileX > camera.x + 512 ||
                    tileY + this.tileSize < camera.y || tileY > camera.y + 448) {
                    continue;
                }
                
                const tile = this.currentRoom[y][x];
                this.renderTile(ctx, spriteRenderer, tileX, tileY, tile);
            }
        }
        
        // Render entities with enhanced sprites
        this.entities.forEach(entity => {
            if (entity.type === 'rupee') {
                this.renderRupee(ctx, spriteRenderer, entity);
            } else if (entity.type === 'heart') {
                this.renderHeart(ctx, spriteRenderer, entity);
            } else if (entity.type === 'key') {
                this.renderKey(ctx, spriteRenderer, entity);
            } else if (entity.type === 'octorok') {
                this.renderOctorok(ctx, spriteRenderer, entity);
            } else if (entity.type === 'moblin') {
                this.renderMoblin(ctx, spriteRenderer, entity);
            }
        });
    }
    
    renderTile(ctx, spriteRenderer, x, y, tileType) {
        if (spriteRenderer instanceof EnhancedSpriteRenderer) {
            // Use enhanced sprite rendering
            if (tileType === 0) {
                spriteRenderer.drawSprite(x, y, TILE_SPRITES.GRASS, TILE_COLORS, 2);
            } else if (tileType === 1) {
                spriteRenderer.drawSprite(x, y, TILE_SPRITES.WALL, TILE_COLORS, 2);
            }
        } else {
            // Fallback rendering with enhanced textures
            if (tileType === 0) {
                this.renderGrassTile(ctx, x, y);
            } else if (tileType === 1) {
                this.renderWallTile(ctx, x, y);
            }
        }
    }
    
    renderGrassTile(ctx, x, y) {
        // Base grass color
        ctx.fillStyle = this.getThemeColor('grass');
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Add texture details
        ctx.fillStyle = this.getThemeColor('grassDetail');
        for (let i = 0; i < 12; i++) {
            const px = x + (i % 4) * 8 + Math.random() * 4;
            const py = y + Math.floor(i / 4) * 8 + Math.random() * 4;
            ctx.fillRect(px, py, 2, 2);
        }
        
        // Add small grass blades
        ctx.fillStyle = this.getThemeColor('grassBlade');
        for (let i = 0; i < 6; i++) {
            const px = x + Math.random() * this.tileSize;
            const py = y + Math.random() * this.tileSize;
            ctx.fillRect(px, py, 1, 3);
        }
    }
    
    renderWallTile(ctx, x, y) {
        // Base wall color
        ctx.fillStyle = this.getThemeColor('wall');
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Add stone texture
        ctx.fillStyle = this.getThemeColor('wallHighlight');
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        
        ctx.fillStyle = this.getThemeColor('wallShadow');
        ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
        
        // Add stone blocks pattern
        ctx.fillStyle = this.getThemeColor('wallDetail');
        ctx.fillRect(x + 8, y + 4, 16, 2);
        ctx.fillRect(x + 4, y + 16, 24, 2);
        ctx.fillRect(x + 12, y + 28, 16, 2);
    }
    
    getThemeColor(element) {
        const themes = {
            forest: {
                grass: '#228B22',
                grassDetail: '#32CD32',
                grassBlade: '#006400',
                wall: '#8B4513',
                wallHighlight: '#A0522D',
                wallShadow: '#654321',
                wallDetail: '#5D4E37'
            },
            desert: {
                grass: '#DEB887',
                grassDetail: '#F5DEB3',
                grassBlade: '#D2B48C',
                wall: '#CD853F',
                wallHighlight: '#DAA520',
                wallShadow: '#B8860B',
                wallDetail: '#8B7355'
            },
            cave: {
                grass: '#696969',
                grassDetail: '#808080',
                grassBlade: '#556B2F',
                wall: '#2F4F4F',
                wallHighlight: '#708090',
                wallShadow: '#191970',
                wallDetail: '#483D8B'
            },
            ruins: {
                grass: '#9ACD32',
                grassDetail: '#ADFF2F',
                grassBlade: '#6B8E23',
                wall: '#696969',
                wallHighlight: '#A9A9A9',
                wallShadow: '#2F2F2F',
                wallDetail: '#8B7D6B'
            }
        };
        
        return themes[this.currentTheme][element] || themes.forest[element];
    }
    
    renderRupee(ctx, spriteRenderer, rupee) {
        const bounce = Math.sin(rupee.animTimer + rupee.floatOffset) * 3;
        const x = rupee.x - 8;
        const y = rupee.y - 8 + bounce;
        
        if (spriteRenderer instanceof EnhancedSpriteRenderer) {
            spriteRenderer.drawSprite(x, y, SPRITES.RUPEE, COLORS);
        } else {
            // Enhanced fallback rendering
            const color = rupee.subtype === 'blue' ? '#0000FF' : '#00FF00';
            const highlight = rupee.subtype === 'blue' ? '#4169E1' : '#32CD32';
            
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y, 12, 16);
            
            // Diamond shape
            ctx.fillStyle = highlight;
            ctx.fillRect(x + 4, y + 2, 8, 12);
            
            // Shine effect
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 6, y + 3, 2, 3);
            
            // Sparkle effect
            if (Math.sin(rupee.animTimer * 2) > 0.5) {
                ctx.fillRect(x - 2, y + 8, 2, 2);
                ctx.fillRect(x + 16, y + 4, 2, 2);
            }
        }
    }
    
    renderHeart(ctx, spriteRenderer, heart) {
        const bounce = Math.sin(heart.animTimer) * 1;
        const pulse = 1 + Math.sin(heart.pulseTimer) * 0.2;
        const x = heart.x - 8;
        const y = heart.y - 8 + bounce;
        
        if (spriteRenderer instanceof EnhancedSpriteRenderer) {
            ctx.save();
            ctx.translate(x + 8, y + 8);
            ctx.scale(pulse, pulse);
            ctx.translate(-8, -8);
            spriteRenderer.drawSprite(0, 0, SPRITES.HEART, COLORS);
            ctx.restore();
        } else {
            // Enhanced heart rendering
            ctx.save();
            ctx.translate(x + 8, y + 8);
            ctx.scale(pulse, pulse);
            ctx.translate(-8, -8);
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 4, 6, 6);
            ctx.fillRect(10, 4, 6, 6);
            ctx.fillRect(2, 10, 12, 6);
            ctx.fillRect(4, 16, 8, 2);
            
            // Shine
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(2, 6, 3, 3);
            
            ctx.restore();
        }
    }
    
    renderKey(ctx, spriteRenderer, key) {
        const sparkle = Math.sin(key.sparkleTimer) > 0.7;
        const x = key.x - 8;
        const y = key.y - 8;
        
        // Key body
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 4, y + 2, 8, 4);
        ctx.fillRect(x + 6, y + 6, 4, 8);
        
        // Key teeth
        ctx.fillRect(x + 10, y + 10, 4, 2);
        ctx.fillRect(x + 10, y + 13, 2, 2);
        
        // Sparkle effect
        if (sparkle) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x - 2, y + 8, 2, 2);
            ctx.fillRect(x + 16, y + 4, 2, 2);
            ctx.fillRect(x + 8, y - 2, 2, 2);
            ctx.fillRect(x + 8, y + 18, 2, 2);
        }
    }
    
    renderOctorok(ctx, spriteRenderer, octorok) {
        const x = octorok.x;
        const y = octorok.y;
        
        if (spriteRenderer instanceof EnhancedSpriteRenderer) {
            const flipX = octorok.direction === 3; // Flip when moving left
            spriteRenderer.drawSprite(x, y, SPRITES.OCTOROK, COLORS, 1, flipX);
        } else {
            // Enhanced octorok rendering
            const stunned = octorok.stunTimer > 0;
            const color = stunned ? '#FF8888' : '#FF4444';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 16, 16);
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 3, y + 3, 3, 3);
            ctx.fillRect(x + 10, y + 3, 3, 3);
            
            ctx.fillStyle = '#000000';
            const eyeOffset = stunned ? 1 : 0;
            ctx.fillRect(x + 4 + eyeOffset, y + 4, 1, 1);
            ctx.fillRect(x + 11 + eyeOffset, y + 4, 1, 1);
            
            // Tentacles with direction
            ctx.fillStyle = '#FF6666';
            switch (octorok.direction) {
                case 0: // up
                    ctx.fillRect(x + 6, y - 4, 4, 4);
                    break;
                case 1: // right
                    ctx.fillRect(x + 16, y + 6, 4, 4);
                    break;
                case 2: // down
                    ctx.fillRect(x + 6, y + 16, 4, 4);
                    break;
                case 3: // left
                    ctx.fillRect(x - 4, y + 6, 4, 4);
                    break;
            }
        }
    }
    
    renderMoblin(ctx, spriteRenderer, moblin) {
        const x = moblin.x;
        const y = moblin.y;
        const stunned = moblin.stunTimer > 0;
        const damaged = moblin.health < moblin.maxHealth;
        
        // Moblin body (larger than octorok)
        ctx.fillStyle = stunned ? '#8888FF' : (damaged ? '#6666AA' : '#4444AA');
        ctx.fillRect(x, y, 16, 20);
        
        // Head
        ctx.fillStyle = stunned ? '#AAAAFF' : '#6666CC';
        ctx.fillRect(x + 2, y - 4, 12, 8);
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 4, y - 2, 2, 2);
        ctx.fillRect(x + 10, y - 2, 2, 2);
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 5, y - 1, 1, 1);
        ctx.fillRect(x + 11, y - 1, 1, 1);
        
        // Weapon (spear)
        ctx.fillStyle = '#8B4513';
        switch (moblin.direction) {
            case 0: // up
                ctx.fillRect(x + 7, y - 12, 2, 12);
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(x + 6, y - 16, 4, 4);
                break;
            case 1: // right
                ctx.fillRect(x + 16, y + 8, 12, 2);
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(x + 28, y + 6, 4, 4);
                break;
            case 2: // down
                ctx.fillRect(x + 7, y + 20, 2, 12);
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(x + 6, y + 32, 4, 4);
                break;
            case 3: // left
                ctx.fillRect(x - 12, y + 8, 12, 2);
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(x - 16, y + 6, 4, 4);
                break;
        }
    }
    
    checkCollisions(player, effects) {
        this.entities.forEach(entity => {
            if (entity.collected) return;
            
            const dx = player.x + 8 - entity.x;
            const dy = player.y + 8 - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                if (entity.type === 'rupee') {
                    player.addRupees(entity.value, effects);
                    entity.collected = true;
                } else if (entity.type === 'heart') {
                    if (player.heal(1, effects)) {
                        entity.collected = true;
                    }
                } else if (entity.type === 'key') {
                    player.addKeys(1);
                    entity.collected = true;
                    effects.addParticle(entity.x, entity.y, 'sparkle', {
                        vx: 0, vy: -50, life: 1.0, color: '#FFD700', size: 4
                    });
                } else if (entity.type === 'octorok' || entity.type === 'moblin') {
                    if (player.isAttacking && entity.stunTimer <= 0) {
                        // Player hits enemy
                        entity.health--;
                        entity.stunTimer = 0.5;
                        
                        if (entity.health <= 0) {
                            effects.addEnemyDeathEffect(entity.x + 8, entity.y + 8);
                            // Drop rupee on death
                            this.entities.push({
                                type: 'rupee',
                                subtype: 'green',
                                x: entity.x + 8,
                                y: entity.y + 8,
                                value: entity.type === 'moblin' ? 5 : 1,
                                collected: false,
                                animTimer: 0,
                                floatOffset: 0
                            });
                        } else {
                            effects.addScreenShake(4, 0.15);
                            effects.addFlash('#FFFF00', 0.2, 0.1);
                        }
                    } else if (!player.isAttacking && !player.invulnerable && entity.stunTimer <= 0) {
                        // Enemy hits player
                        if (player.takeDamage(1, effects)) {
                            entity.attackTimer = 1.0; // Prevent immediate re-attack
                        }
                    }
                }
            }
        });
    }
}