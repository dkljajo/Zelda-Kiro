import { SpriteRenderer } from './spriteRenderer.js';
import { SPRITES, COLORS } from './sprites.js';
import { EnhancedSpriteRenderer } from './effects.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.speed = 100; // Increased speed for better feel
        
        // Player stats
        this.health = 6; // More health for better gameplay
        this.maxHealth = 6;
        this.rupees = 0;
        this.keys = 0;
        
        // Animation
        this.direction = 'down'; // up, down, left, right
        this.isMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.15; // Faster animation
        
        // Combat
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 0.25; // Snappier attacks
        this.attackCooldown = 0;
        
        // Invincibility frames
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 1.5;
        
        // Enhanced movement
        this.momentum = { x: 0, y: 0 };
        this.friction = 0.85;
        
        // Visual effects
        this.walkDustTimer = 0;
        this.lastFootstep = 0;
    }
    
    update(deltaTime, input, world, effects) {
        this.handleInput(input, deltaTime);
        this.updateAnimation(deltaTime);
        this.updateCombat(deltaTime, effects);
        this.updateInvulnerability(deltaTime);
        this.updateMovement(deltaTime);
        this.checkCollisions(world);
        this.updateEffects(deltaTime, effects);
    }
    
    handleInput(input, deltaTime) {
        if (this.isAttacking) return;
        
        let inputX = 0;
        let inputY = 0;
        this.isMoving = false;
        
        // 8-directional movement with priority system
        if (input.isPressed('ArrowUp')) {
            inputY = -1;
            this.direction = 'up';
            this.isMoving = true;
        } else if (input.isPressed('ArrowDown')) {
            inputY = 1;
            this.direction = 'down';
            this.isMoving = true;
        }
        
        if (input.isPressed('ArrowLeft')) {
            inputX = -1;
            if (!this.isMoving) this.direction = 'left';
            this.isMoving = true;
        } else if (input.isPressed('ArrowRight')) {
            inputX = 1;
            if (!this.isMoving) this.direction = 'right';
            this.isMoving = true;
        }
        
        // Apply momentum-based movement
        if (this.isMoving) {
            const moveSpeed = this.speed * deltaTime;
            // Diagonal movement compensation
            if (inputX !== 0 && inputY !== 0) {
                inputX *= 0.707; // sqrt(2)/2
                inputY *= 0.707;
            }
            
            this.momentum.x += inputX * moveSpeed * 2;
            this.momentum.y += inputY * moveSpeed * 2;
        }
        
        // Attack with cooldown
        if (input.isJustPressed('KeyZ') && this.attackCooldown <= 0) {
            this.attack();
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
    
    attack() {
        if (this.isAttacking) return;
        
        this.isAttacking = true;
        this.attackTimer = 0;
        this.attackCooldown = 0.4; // Prevent spam clicking
    }
    
    updateMovement(deltaTime) {
        // Apply momentum
        this.x += this.momentum.x * deltaTime;
        this.y += this.momentum.y * deltaTime;
        
        // Apply friction
        this.momentum.x *= this.friction;
        this.momentum.y *= this.friction;
        
        // Stop very small movements
        if (Math.abs(this.momentum.x) < 1) this.momentum.x = 0;
        if (Math.abs(this.momentum.y) < 1) this.momentum.y = 0;
    }
    
    updateAnimation(deltaTime) {
        if (this.isMoving) {
            this.animTimer += deltaTime;
            if (this.animTimer >= this.animSpeed) {
                this.animFrame = (this.animFrame + 1) % 2;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }
    
    updateCombat(deltaTime, effects) {
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            
            // Add sword slash effect at start of attack
            if (this.attackTimer < 0.05) {
                const swordX = this.x + 8 + (this.direction === 'right' ? 20 : this.direction === 'left' ? -20 : 0);
                const swordY = this.y + 8 + (this.direction === 'down' ? 20 : this.direction === 'up' ? -20 : 0);
                effects.addSwordSlashEffect(swordX, swordY, this.direction);
                
                // Play sword sound
                if (window.game && window.game.audioManager) {
                    window.game.audioManager.playSound('swordSlash');
                }
            }
            
            if (this.attackTimer >= this.attackDuration) {
                this.isAttacking = false;
                this.attackTimer = 0;
            }
        }
    }
    
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerabilityTimer += deltaTime;
            if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
                this.invulnerable = false;
                this.invulnerabilityTimer = 0;
            }
        }
    }
    
    updateEffects(deltaTime, effects) {
        // Walking dust particles
        if (this.isMoving && Math.abs(this.momentum.x) + Math.abs(this.momentum.y) > 20) {
            this.walkDustTimer += deltaTime;
            if (this.walkDustTimer > 0.2) {
                effects.addParticle(
                    this.x + 8 + (Math.random() - 0.5) * 16,
                    this.y + 14,
                    'dust',
                    {
                        vx: (Math.random() - 0.5) * 20,
                        vy: -Math.random() * 10,
                        life: 0.3,
                        color: '#8B7355',
                        size: 1
                    }
                );
                this.walkDustTimer = 0;
            }
        }
    }
    
    checkCollisions(world) {
        const tileSize = 32;
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width) / tileSize);
        const topTile = Math.floor(this.y / tileSize);
        const bottomTile = Math.floor((this.y + this.height) / tileSize);
        
        // Enhanced collision with momentum consideration
        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                const tile = world.getTile(tx, ty);
                if (tile === 1) {
                    const tileX = tx * tileSize;
                    const tileY = ty * tileSize;
                    
                    const overlapX = Math.min(this.x + this.width - tileX, tileX + tileSize - this.x);
                    const overlapY = Math.min(this.y + this.height - tileY, tileY + tileSize - this.y);
                    
                    if (overlapX < overlapY) {
                        if (this.x < tileX) {
                            this.x = tileX - this.width;
                        } else {
                            this.x = tileX + tileSize;
                        }
                        this.momentum.x = 0; // Stop horizontal momentum
                    } else {
                        if (this.y < tileY) {
                            this.y = tileY - this.height;
                        } else {
                            this.y = tileY + tileSize;
                        }
                        this.momentum.y = 0; // Stop vertical momentum
                    }
                }
            }
        }
    }
    
    takeDamage(amount = 1, effects) {
        if (this.invulnerable) return false;
        
        this.health -= amount;
        this.invulnerable = true;
        this.invulnerabilityTimer = 0;
        
        // Visual feedback
        effects.addScreenShake(6, 0.3);
        effects.addFlash('#FF0000', 0.4, 0.2);
        
        // Play sound if audio manager is available
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playSound('playerHurt');
        }
        
        // Knockback effect
        this.momentum.x += (Math.random() - 0.5) * 100;
        this.momentum.y += (Math.random() - 0.5) * 100;
        
        if (this.health <= 0) {
            this.health = 0;
            // Game over logic here
        }
        
        return true;
    }
    
    heal(amount = 1, effects) {
        if (this.health >= this.maxHealth) return false;
        
        this.health = Math.min(this.maxHealth, this.health + amount);
        effects.addHeartPickupEffect(this.x + 8, this.y + 8);
        // Play sound if audio manager is available
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playSound('heartPickup');
        }
        return true;
    }
    
    addRupees(amount, effects) {
        this.rupees += amount;
        effects.addRupeePickupEffect(this.x + 8, this.y + 8);
        // Play sound if audio manager is available
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playSound('rupeePickup');
        }
    }
    
    addKeys(amount = 1) {
        this.keys += amount;
    }
    
    render(ctx, spriteRenderer, effects) {
        // Flash when invulnerable
        const alpha = (this.invulnerable && Math.floor(this.invulnerabilityTimer * 12) % 2) ? 0.3 : 1.0;
        
        // Get appropriate sprite based on direction and animation
        let sprite;
        switch (this.direction) {
            case 'up': sprite = SPRITES.LINK_UP; break;
            case 'down': sprite = SPRITES.LINK_DOWN; break;
            case 'left': sprite = SPRITES.LINK_LEFT; break;
            case 'right': sprite = SPRITES.LINK_RIGHT; break;
            default: sprite = SPRITES.LINK_DOWN;
        }
        
        // Draw Link with enhanced sprite renderer
        if (spriteRenderer instanceof EnhancedSpriteRenderer) {
            spriteRenderer.drawSprite(this.x, this.y, sprite, COLORS, 1, false, alpha);
        } else {
            // Fallback to simple rendering
            this.drawLinkSimple(ctx, alpha);
        }
        
        // Draw sword when attacking
        if (this.isAttacking) {
            this.drawSword(ctx, alpha);
        }
    }
    
    drawLinkSimple(ctx, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#00AA00'; // Green tunic
        ctx.fillRect(this.x + 2, this.y + 4, 12, 12);
        
        // Head
        ctx.fillStyle = '#FFDDAA'; // Skin color
        ctx.fillRect(this.x + 4, this.y, 8, 6);
        
        // Hat
        ctx.fillStyle = '#228B22'; // Dark green
        ctx.fillRect(this.x + 3, this.y, 10, 4);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 2, 1, 1);
        ctx.fillRect(this.x + 10, this.y + 2, 1, 1);
        
        // Legs with animation
        ctx.fillStyle = '#8B4513'; // Brown
        if (this.isMoving && this.animFrame === 1) {
            ctx.fillRect(this.x + 3, this.y + 12, 3, 4);
            ctx.fillRect(this.x + 10, this.y + 12, 3, 4);
        } else {
            ctx.fillRect(this.x + 4, this.y + 12, 3, 4);
            ctx.fillRect(this.x + 9, this.y + 12, 3, 4);
        }
        
        ctx.restore();
    }
    
    drawSword(ctx, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#C0C0C0'; // Silver sword
        
        const swordLength = 24; // Longer sword
        let swordX = this.x + 8;
        let swordY = this.y + 8;
        
        // Sword position based on attack progress
        const attackProgress = this.attackTimer / this.attackDuration;
        const swingOffset = Math.sin(attackProgress * Math.PI) * 4;
        
        switch (this.direction) {
            case 'up':
                ctx.fillRect(swordX - 1, swordY - swordLength + swingOffset, 3, swordLength);
                // Sword tip
                ctx.fillRect(swordX, swordY - swordLength + swingOffset - 2, 1, 2);
                break;
            case 'down':
                ctx.fillRect(swordX - 1, swordY + 16 - swingOffset, 3, swordLength);
                ctx.fillRect(swordX, swordY + 16 + swordLength - swingOffset, 1, 2);
                break;
            case 'left':
                ctx.fillRect(swordX - swordLength + swingOffset, swordY - 1, swordLength, 3);
                ctx.fillRect(swordX - swordLength + swingOffset - 2, swordY, 2, 1);
                break;
            case 'right':
                ctx.fillRect(swordX + 16 - swingOffset, swordY - 1, swordLength, 3);
                ctx.fillRect(swordX + 16 + swordLength - swingOffset, swordY, 2, 1);
                break;
        }
        
        // Sword hilt
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.fillRect(swordX - 2, swordY - 2, 5, 5);
        
        // Sword guard
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillRect(swordX - 3, swordY - 1, 7, 2);
        
        ctx.restore();
    }
}