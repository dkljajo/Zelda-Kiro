export class SpriteRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    // Simple pixel art rendering helper
    drawPixelRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }
    
    // Draw a simple sprite from a color pattern
    drawSprite(x, y, pattern, colors, scale = 1) {
        const pixelSize = scale;
        
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                const colorIndex = pattern[row][col];
                if (colorIndex > 0 && colors[colorIndex]) {
                    this.drawPixelRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize,
                        colors[colorIndex]
                    );
                }
            }
        }
    }
    
    // Draw text with pixel font style
    drawPixelText(text, x, y, color = '#FFFFFF', size = 8) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(text, x, y);
    }
}