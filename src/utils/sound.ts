
// Create shared AudioContext
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

/**
 * Plays a synthesized sound based on type
 */
const playSynthSound = (type: 'success' | 'error') => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const now = audioContext.currentTime;

    if (type === 'success') {
        // CYBERPUNK SUCCESS: Arpeggio + Filter Sweep
        // Oscillators
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const osc3 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        // Connect graph
        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        // Settings
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc3.type = 'sine';

        // Arpeggio (C Major 7 style for futuristic feel)
        osc1.frequency.setValueAtTime(261.63, now); // C4
        osc1.frequency.setValueAtTime(329.63, now + 0.1); // E4
        osc1.frequency.setValueAtTime(392.00, now + 0.2); // G4
        osc1.frequency.setValueAtTime(493.88, now + 0.3); // B4
        osc1.frequency.setValueAtTime(523.25, now + 0.4); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 1.2); // Glide to C6

        // Harmony/Detune for thickness
        osc2.frequency.setValueAtTime(261.63 * 1.01, now);
        osc2.frequency.linearRampToValueAtTime(523.25, now + 0.4);

        // Sub-bass
        osc3.frequency.setValueAtTime(65.41, now); // C2
        osc3.frequency.linearRampToValueAtTime(130.81, now + 1.0);

        // Filter Sweep (Lowpass opening up = "Cyberpunk Swell")
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(8000, now + 0.8);

        // Volume Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1); // Attack
        gain.gain.setValueAtTime(0.3, now + 0.8); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Release

        // Start/Stop
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
        osc3.stop(now + 1.5);

    } else {
        // RETRO GAME OVER: Descending 8-bit "Glitch"
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const lfo = audioContext.createOscillator(); // For glitchy modulation
        const lfoGain = audioContext.createGain();

        // Connect modulation
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(audioContext.destination);

        // Settings
        osc.type = 'sawtooth'; // Harsh, 8-bit sound
        lfo.type = 'square'; // Abrupt changes

        // Pitch Drop
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.8); // Long slide down

        // LFO Modulation (Glitch effect)
        lfo.frequency.setValueAtTime(50, now); // Fast modulation
        lfoGain.gain.setValueAtTime(100, now); // Depth of modulation

        // Volume Envelope
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        // Start/Stop
        osc.start(now);
        lfo.start(now);

        osc.stop(now + 0.8);
        lfo.stop(now + 0.8);
    }
};

/**
 * Plays a sound effect based on the type.
 * @param type - The type of sound to play ('success' | 'error')
 */
export const playSound = (type: 'success' | 'error') => {
    // Always try to play the synth sound first as it's reliable and built-in.
    // We can later add logic to prefer file-based audio if available.
    try {
        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.volume = 0.5;

        // Attempt to play the file; if it fails (e.g. 404), fall back to synth
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                // Auto-play policy or file not found -> use synth
                // console.warn("Audio file playback failed, using synth:", error);
                playSynthSound(type);
            });
        }
    } catch (e) {
        playSynthSound(type);
    }
};
