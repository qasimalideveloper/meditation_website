class BreathVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;

        // Configuration
        this.baseRadius = 50;
        this.maxRadius = 150;
        this.color = '#ffffff';
        this.glowColor = 'rgba(180, 160, 229, 0.5)';

        // Breathing State (Default: Coherent)
        this.inhaleDuration = 5500;
        this.holdInDuration = 0;
        this.exhaleDuration = 5500;
        this.holdOutDuration = 0;
        this.cycleDuration = 11000;

        this.phase = 'inhale';
        this.startTime = 0;
        this.onPhaseChange = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setPattern(config) {
        this.inhaleDuration = config.inhale || 5500;
        this.holdInDuration = config.holdIn || 0;
        this.exhaleDuration = config.exhale || 5500;
        this.holdOutDuration = config.holdOut || 0;
        this.cycleDuration = this.inhaleDuration + this.holdInDuration + this.exhaleDuration + this.holdOutDuration;
        this.startTime = 0; // Reset timing to sync pattern start
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.render();
    }

    stop() {
        this.isRunning = false;
        this.startTime = 0;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    pause() {
        this.isRunning = false;
    }

    render(timestamp) {
        if (!this.isRunning) return;

        if (!this.startTime) this.startTime = timestamp;
        const elapsed = (timestamp - this.startTime) % this.cycleDuration;

        // Calculate Phase & Progress
        let currentPhase = 'inhale';
        let phaseProgress = 0;

        if (elapsed < this.inhaleDuration) {
            currentPhase = 'inhale';
            phaseProgress = elapsed / this.inhaleDuration;
        } else if (elapsed < this.inhaleDuration + this.holdInDuration) {
            currentPhase = 'hold_in';
            phaseProgress = 1.0;
        } else if (elapsed < this.inhaleDuration + this.holdInDuration + this.exhaleDuration) {
            currentPhase = 'exhale';
            phaseProgress = (elapsed - (this.inhaleDuration + this.holdInDuration)) / this.exhaleDuration;
        } else {
            currentPhase = 'hold_out';
            phaseProgress = 1.0;
        }

        // Clear
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color') || '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate Radius
        let currentRadius = 0;
        if (currentPhase === 'inhale') {
            currentRadius = this.baseRadius + (this.maxRadius - this.baseRadius) * phaseProgress;
        } else if (currentPhase === 'hold_in') {
            currentRadius = this.maxRadius;
        } else if (currentPhase === 'exhale') {
            currentRadius = this.maxRadius - (this.maxRadius - this.baseRadius) * phaseProgress;
        } else {
            currentRadius = this.baseRadius;
        }

        if (this.phase !== currentPhase) {
            this.phase = currentPhase;
            if (this.onPhaseChange) this.onPhaseChange(currentPhase);

            // Update Text
            const textEl = document.getElementById('breathing-text');
            if (textEl) {
                if (currentPhase === 'inhale') textEl.textContent = 'Inhale';
                else if (currentPhase === 'exhale') textEl.textContent = 'Exhale';
                else textEl.textContent = 'Hold';
            }
        }

        const normalizedWave = currentPhase === 'inhale' ? phaseProgress : (currentPhase === 'exhale' ? (1 - phaseProgress) : (currentPhase === 'hold_in' ? 1 : 0));

        // Draw Guides
        this.ctx.setLineDash([5, 15]);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';

        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.baseRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.maxRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Draw Circle
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, currentRadius, 0, Math.PI * 2);

        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = this.glowColor;
        this.ctx.fill();
        this.ctx.restore();

        // Ripple
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - (0.1 * normalizedWave)})`;
        this.ctx.lineWidth = 2;
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, currentRadius + 20, 0, Math.PI * 2);
        this.ctx.stroke();

        requestAnimationFrame((t) => this.render(t));
    }

    setTheme(themeColor) {
        this.glowColor = themeColor;
    }
}
