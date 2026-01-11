export class Input {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            event.preventDefault();
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            event.preventDefault();
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    update() {
        // Copy current keys to previous keys AFTER processing
        // This should be called at the END of the frame
        Object.keys(this.keys).forEach(key => {
            this.previousKeys[key] = this.keys[key];
        });
    }
    
    isPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    isJustPressed(keyCode) {
        return this.keys[keyCode] && !this.previousKeys[keyCode];
    }
    
    isJustReleased(keyCode) {
        return !this.keys[keyCode] && this.previousKeys[keyCode];
    }
}