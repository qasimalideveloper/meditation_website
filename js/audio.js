class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;

        this.binaural = null;
        this.noise = null;
    }

    async resume() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    playBinaural(baseFreq = 200, beatFreq = 5) { // 5Hz = Theta (Deep meditation)
        this.stopBinaural();
        this.resume();

        const leftOsc = this.ctx.createOscillator();
        const rightOsc = this.ctx.createOscillator();
        const merger = this.ctx.createChannelMerger(2);

        leftOsc.frequency.value = baseFreq;
        rightOsc.frequency.value = baseFreq + beatFreq;

        // Stereo Separation
        leftOsc.connect(merger, 0, 0); // Input 0 to Output 0 (Left)
        rightOsc.connect(merger, 0, 1); // Input 0 to Output 1 (Right)

        const gain = this.ctx.createGain();
        gain.gain.value = 0; // Start silent for fade-in

        merger.connect(gain);
        gain.connect(this.masterGain);

        leftOsc.start();
        rightOsc.start();

        // Fade In
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2);

        this.binaural = { leftOsc, rightOsc, gain };
    }

    stopBinaural() {
        if (this.binaural) {
            const { leftOsc, rightOsc, gain } = this.binaural;
            // Fade Out
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
            setTimeout(() => {
                leftOsc.stop();
                rightOsc.stop();
            }, 2000);
            this.binaural = null;
        }
    }

    playNoise(type = 'pink') {
        this.stopNoise();
        this.resume();

        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        // Pink Noise Generation (approx)
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        // Lowpass filter to make it sound more like rain/soft wind
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 3);

        this.noise = { source: noise, gain };
    }

    stopNoise() {
        if (this.noise) {
            const { source, gain } = this.noise;
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
            setTimeout(() => {
                source.stop();
            }, 2000);
            this.noise = null;
        }
    }

    // Play a soft "bloom" tone (Sine wave swell)
    playTone(freq = 200, duration = 2) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.value = freq;
        osc.type = 'sine';

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + duration / 2); // Attack
        gain.gain.linearRampToValueAtTime(0, now + duration); // Release

        osc.start(now);
        osc.stop(now + duration);
    }
}
