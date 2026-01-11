// Visual effects system for enhanced retro gaming experience
export class EffectsManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.flashEffect = { active: false, color: '#FFFFFF', alpha: 0, duration: 0 };
        this.transitions = [];
    }
    
    update(deltaTime) {
        this.updateParticles(deltaTime);
        this.updateScreenShake(deltaTime);
        this.updateFlash(deltaTime);
        this.updateTransitions(deltaTime);
    }
    
    // Screen shake effect for impacts
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            const shake = this.screenShake.intensity * (this.screenShake.duration / 0.3);
            this.screenShake.x = (Math.random() - 0.5) * shake;
            this.screenShake.y = (Math.random() - 0.5) * shake;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }
    
    // Flash effect for damage/special events
    addFlash(color = '#FFFFFF', intensity = 0.5, duration = 0.1) {
        this.flashEffect.active = true;
        this.flashEffect.color = color;
        this.flashEffect.alpha = intensity;
        this.flashEffect.duration = duration;
        this.flashEffect.maxDuration = duration;
    }
    
    updateFlash(deltaTime) {
        if (this.flashEffect.active) {
            this.flashEffect.duration -= deltaTime;
            this.flashEffect.alpha = (this.flashEffect.duration / this.flashEffect.maxDuration) * 0.5;
            
            if (this.flashEffect.duration <= 0) {
                this.flashEffect.active = false;
            }
        }
    }
    
    // Particle system for various effects
    addParticle(x, y, type, options = {}) {
        const particle = {
            x, y,
            vx: options.vx || (Math.random() - 0.5) * 100,
            vy: options.vy || (Math.random() - 0.5) * 100,
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            size: options.size || 2,
            color: options.color || '#FFFFFF',
            type: type,
            gravity: options.gravity || 0,
            fade: options.fade !== false
        };
        this.particles.push(particle);
    }
    
    // Specific particle effects
    addRupeePickupEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.addParticle(x, y, 'sparkle', {
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.5,
                color: '#00FF00',
                size: 3
            });
        }
    }
    
    addHeartPickupEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            this.addParticle(x, y, 'heart', {
                vx: (Math.random() - 0.5) * 100,
                vy: -Math.random() * 80 - 20,
                life: 1.0,
                color: '#FF69B4',
                size: 2,
                gravity: 50
            });
        }
    }
    
    addSwordSlashEffect(x, y, direction) {
        const angles = {
            'up': -Math.PI/2,
            'down': Math.PI/2,
            'left': Math.PI,
            'right': 0
        };
        
        const angle = angles[direction];
        for (let i = 0; i < 5; i++) {
            const offsetAngle = angle + (Math.random() - 0.5) * 0.5;
            this.addParticle(x, y, 'slash', {
                vx: Math.cos(offsetAngle) * 120,
                vy: Math.sin(offsetAngle) * 120,
                life: 0.3,
                color: '#C0C0C0',
                size: 4
            });
        }
    }
    
    addEnemyDeathEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            this.addParticle(x, y, 'explosion', {
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.8,
                color: i % 2 ? '#FF4444' : '#FFAA00',
                size: 3 + Math.random() * 2
            });
        }
        this.addScreenShake(8, 0.2);
        this.addFlash('#FF4444', 0.3, 0.15);
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += particle.gravity * deltaTime;
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(camera) {
        this.ctx.save();
        
        // Apply screen shake
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Render particles
        this.particles.forEach(particle => {
            const alpha = particle.fade ? (particle.life / particle.maxLife) : 1;
            this.ctx.globalAlpha = alpha;
            
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'sparkle') {
                this.renderSparkle(particle);
            } else if (particle.type === 'heart') {
                this.renderHeartParticle(particle);
            } else if (particle.type === 'slash') {
                this.renderSlashParticle(particle);
            } else {
                this.ctx.fillRect(
                    particle.x - particle.size/2,
                    particle.y - particle.size/2,
                    particle.size,
                    particle.size
                );
            }
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
        
        // Render flash effect (not affected by camera)
        if (this.flashEffect.active) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flashEffect.alpha;
            this.ctx.fillStyle = this.flashEffect.color;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.restore();
        }
    }
    
    renderSparkle(particle) {
        const size = particle.size;
        this.ctx.fillRect(particle.x - size/2, particle.y - 1, size, 2);
        this.ctx.fillRect(particle.x - 1, particle.y - size/2, 2, size);
    }
    
    renderHeartParticle(particle) {
        const size = particle.size;
        this.ctx.fillRect(particle.x - size, particle.y - size/2, size, size);
        this.ctx.fillRect(particle.x, particle.y - size/2, size, size);
        this.ctx.fillRect(particle.x - size/2, particle.y, size, size/2);
    }
    
    renderSlashParticle(particle) {
        const size = particle.size;
        this.ctx.fillRect(particle.x - size/2, particle.y - 1, size, 2);
    }
}

// Enhanced sprite renderer with effects
export class EnhancedSpriteRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    drawSprite(x, y, spriteData, colors, scale = 1, flipX = false, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        if (flipX) {
            this.ctx.scale(-1, 1);
            x = -x - spriteData[0].length * scale;
        }
        
        for (let row = 0; row < spriteData.length; row++) {
            for (let col = 0; col < spriteData[row].length; col++) {
                const colorIndex = spriteData[row][col];
                if (colorIndex > 0 && colors[colorIndex]) {
                    this.ctx.fillStyle = colors[colorIndex];
                    this.ctx.fillRect(
                        Math.floor(x + col * scale),
                        Math.floor(y + row * scale),
                        scale,
                        scale
                    );
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawSpriteWithOutline(x, y, spriteData, colors, outlineColor = '#000000', scale = 1) {
        // Draw outline
        this.ctx.fillStyle = outlineColor;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx !== 0 || dy !== 0) {
                    this.drawSprite(x + dx, y + dy, spriteData, colors, scale, false, 0.5);
                }
            }
        }
        
        // Draw main sprite
        this.drawSprite(x, y, spriteData, colors, scale);
    }
    
    drawAnimatedSprite(x, y, spriteFrames, colors, frameIndex, scale = 1, flipX = false) {
        const sprite = spriteFrames[frameIndex % spriteFrames.length];
        this.drawSprite(x, y, sprite, colors, scale, flipX);
    }
}