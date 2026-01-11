export class UI {
    constructor() {
        this.heartsContainer = document.getElementById('hearts');
        this.rupeeCount = document.getElementById('rupeeCount');
        this.keyCount = document.getElementById('keyCount');
        
        this.lastHealth = -1;
        this.lastMaxHealth = -1;
        this.lastRupees = -1;
        this.lastKeys = -1;
    }
    
    render(ctx, player) {
        // Update UI elements only when values change
        if (player.health !== this.lastHealth || player.maxHealth !== this.lastMaxHealth) {
            this.updateHearts(player.health, player.maxHealth);
            this.lastHealth = player.health;
            this.lastMaxHealth = player.maxHealth;
        }
        
        if (player.rupees !== this.lastRupees) {
            this.updateRupees(player.rupees);
            this.lastRupees = player.rupees;
        }
        
        if (player.keys !== this.lastKeys) {
            this.updateKeys(player.keys);
            this.lastKeys = player.keys;
        }
    }
    
    updateHearts(health, maxHealth) {
        this.heartsContainer.innerHTML = '';
        
        for (let i = 0; i < maxHealth; i++) {
            const heart = document.createElement('div');
            heart.className = i < health ? 'heart' : 'heart empty';
            this.heartsContainer.appendChild(heart);
        }
    }
    
    updateRupees(rupees) {
        this.rupeeCount.textContent = rupees.toString().padStart(3, '0');
    }
    
    updateKeys(keys) {
        this.keyCount.textContent = keys.toString().padStart(2, '0');
    }
    
    showMessage(message, duration = 2000) {
        // Create a temporary message overlay
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border: 2px solid #fff;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            text-align: center;
            z-index: 1000;
            pointer-events: none;
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, duration);
    }
}