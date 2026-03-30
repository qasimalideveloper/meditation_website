class VoiceGuide {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = false;
        this.utterance = new SpeechSynthesisUtterance();
        this.utterance.rate = 0.5; // Very slow, meditative
        this.utterance.pitch = 0.8; // Slightly deeper, more neutral if base is female
        this.utterance.volume = 0.6; // Soft but audible

        // Select a good voice if available
        this.selectVoice();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.selectVoice();
        }
    }

    selectVoice() {
        const voices = this.synth.getVoices();
        // Try to find a specific neutral sounding voice, or fall back to Samantha/Google US
        // "Microsoft Zira" is good on Windows, "Samantha" on Mac.
        const preferred = voices.find(v => v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'));
        if (preferred) this.utterance.voice = preferred;
    }

    speak(text) {
        if (!this.enabled) return;
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.utterance.text = text;
        this.synth.speak(this.utterance);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.speak("Guidance enabled");
        return this.enabled;
    }
}
