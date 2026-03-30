
console.log("Satori: Awakening...");

// Simple State
const state = {
    currentView: 'intro-view',
    mood: null,
    sessionDuration: 10 * 60,
    isPlaying: false
};

// Systems
let visualizer = null;
let audio = null;
let voice = null;

// DOM Elements
const views = {
    intro: document.getElementById('intro-view'),
    mood: document.getElementById('mood-view'),
    session: document.getElementById('session-view')
};

const buttons = {
    enter: document.getElementById('btn-enter'),
    exit: document.getElementById('btn-exit'),
    soundscape: document.getElementById('btn-audio-mix')
};

// Navigation Logic
function switchView(viewId) {
    Object.values(views).forEach(el => {
        el.classList.remove('active-view');
        setTimeout(() => {
            if (!el.classList.contains('active-view')) el.classList.add('hidden');
        }, 800);
    });

    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    requestAnimationFrame(() => {
        target.classList.add('active-view');
    });

    state.currentView = viewId;
}

// Timer Logic
let timerInterval = null;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} `;
}

function updateTimer() {
    const display = document.getElementById('timer-display');
    display.textContent = formatTime(state.sessionDuration);

    if (state.sessionDuration <= 0) {
        finishSession();
    }
    state.sessionDuration--;
}

function togglePlay() {
    const btn = document.getElementById('btn-play-pause');

    if (state.isPlaying) {
        // Pause
        state.isPlaying = false;
        btn.innerHTML = '&#9658;'; // Play Symbol

        clearInterval(timerInterval);
        clearInterval(timerInterval);
        visualizer.pause();
        if (audio) audio.masterGain.gain.rampToValueAtTime(0, audio.ctx.currentTime + 0.5); // Fade out master
    } else {
        // Play
        state.isPlaying = true;
        btn.innerHTML = '&#10074;&#10074;'; // Pause Symbol

        timerInterval = setInterval(updateTimer, 1000);
        visualizer.start();
        if (audio) {
            audio.resume();
            audio.masterGain.gain.rampToValueAtTime(0.5, audio.ctx.currentTime + 1); // Fade in master
        }
    }
}

function finishSession() {
    state.isPlaying = false;
    clearInterval(timerInterval);
    visualizer.stop();
    if (audio) {
        audio.stopBinaural();
        audio.stopNoise();
    }
    document.getElementById('btn-play-pause').innerHTML = '&#9658;';

    // Reset Timer
    state.sessionDuration = 10 * 60;
    document.getElementById('timer-display').textContent = formatTime(state.sessionDuration);

    // Go to "Finish" view or just alert (TODO: Add Finish View)
    switchView('intro-view'); // Back to start for now
}

// Initialization
function init() {
    visualizer = new BreathVisualizer('breath-canvas');

    visualizer.onPhaseChange = (phase) => {
        if (voice && voice.enabled) {
            // Audio Bloom
            if (audio) {
                const freq = phase === 'inhale' ? 180 : (phase === 'exhale' ? 150 : 165);
                audio.playTone(freq, 2.5);
            }

            if (phase === 'inhale') voice.speak("Inhale");
            else if (phase === 'exhale') voice.speak("Exhale");
            else voice.speak("Hold");
        }
    };

    buttons.enter.addEventListener('click', () => {
        if (!audio) audio = new AudioEngine();
        if (!voice) voice = new VoiceGuide();
        switchView('mood-view');
        initMoodGrid();
    });

    buttons.exit.addEventListener('click', () => {
        switchView('intro-view');
        state.isPlaying = true; // Hack to force togglePlay to pause
        togglePlay();
    });

    // Toggle Soundscape (Rain)
    buttons.soundscape.addEventListener('click', () => {
        if (!audio) return;
        if (audio.noise) {
            audio.stopNoise();
            buttons.soundscape.classList.remove('active');
        } else {
            audio.playNoise('pink');
            buttons.soundscape.classList.add('active');
        }
    });

    // Toggle Voice
    document.getElementById('btn-voice').addEventListener('click', () => {
        if (!voice) return;
        const isEnabled = voice.toggle();
        document.getElementById('btn-voice').textContent = isEnabled ? "Guide: On" : "Guide: Off";
        document.getElementById('btn-voice').classList.toggle('active', isEnabled);
    });

    // Play/Pause
    document.getElementById('btn-play-pause').addEventListener('click', togglePlay);

    initThoughtDissolver();
}

// Mood / Breathing Patterns Data
const moods = [
    {
        id: 'deep-calm',
        label: 'Deep Calm (Beginner Friendly)',
        color: '#4ECDC4',
        theme: 'rgba(78, 205, 196, 0.5)',
        freq: 6,
        themeName: 'ocean',
        pattern: { inhale: 5500, holdIn: 0, exhale: 5500, holdOut: 0 }
    },
    {
        id: 'stress-reset',
        label: 'Stress Reset',
        color: '#FFE66D',
        theme: 'rgba(255, 230, 109, 0.5)',
        freq: 10,
        themeName: 'forest',
        pattern: { inhale: 5500, holdIn: 2000, exhale: 5500, holdOut: 2000 }
    },
    {
        id: 'night-calm',
        label: 'Night Calm / Panic Relief',
        color: '#1A535C',
        theme: 'rgba(26, 83, 92, 0.5)',
        freq: 3,
        themeName: 'deep-space',
        pattern: { inhale: 4000, holdIn: 0, exhale: 8000, holdOut: 0 }
    },
    {
        id: 'relax-478',
        label: 'Relaxation (4-7-8)',
        color: '#FF6B6B',
        theme: 'rgba(255, 107, 107, 0.5)',
        freq: 5,
        themeName: 'sunrise',
        pattern: { inhale: 4000, holdIn: 7000, exhale: 8000, holdOut: 0 }
    }
];

function initMoodGrid() {
    const grid = document.getElementById('mood-grid');
    if (grid.children.length > 0) return;

    moods.forEach(mood => {
        const card = document.createElement('div');
        card.className = 'mood-card';
        card.textContent = mood.label;
        card.style.borderColor = mood.color;

        card.addEventListener('click', () => {
            console.log(`Selected mood: ${mood.label}`);
            state.mood = mood;
            state.sessionDuration = 10 * 60; // Reset
            document.getElementById('timer-display').textContent = formatTime(state.sessionDuration);

            // Set Theme & Pattern
            document.documentElement.style.setProperty('--accent', mood.color);
            visualizer.setTheme(mood.theme);
            visualizer.setPattern(mood.pattern);

            // Set Ambient Background
            document.body.className = '';
            document.body.classList.add(`bg-${mood.themeName || 'deep-space'}`);
            document.body.classList.add('ambient-bg');

            // Go to Thought Dissolver first
            switchView('thought-view');
            document.getElementById('thought-input').value = ""; // Clear
            document.getElementById('thought-input').focus();
        });

        grid.appendChild(card);
    });
}

// Thought Dissolver Logic
function initThoughtDissolver() {
    const btnDissolve = document.getElementById('btn-dissolve');
    const btnSkip = document.getElementById('btn-skip-thought');
    const input = document.getElementById('thought-input');

    btnDissolve.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) return;

        // Visual "Dissolve" Effect
        createSmoke(text);
        input.value = "";

        // Wait then proceed
        setTimeout(() => {
            switchView('session-view');
            startSession();
        }, 2500);
    });

    btnSkip.addEventListener('click', () => {
        switchView('session-view');
        startSession();
    });

    // Enter key support
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnDissolve.click();
    });
}

function createSmoke(text) {
    const container = document.getElementById('smoke-container');
    const particle = document.createElement('div');
    particle.className = 'smoke-particle';
    particle.textContent = text;
    // Random offset

    container.appendChild(particle);

    // Cleanup
    setTimeout(() => {
        particle.remove();
    }, 3000);
}

function startSession() {
    state.isPlaying = false;
    togglePlay();
    if (audio && state.mood) audio.playBinaural(200, state.mood.freq);
    if (voice) voice.speak("Welcome. Let us begin.");
}

// Start
document.addEventListener('DOMContentLoaded', init);
