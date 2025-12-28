
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
        // MAGICAL SUCCESS: Ascending Major Chord with "Shimmer"
        // We'll play a rapid arpeggio that blurs into a chord: C5 - E5 - G5 - C6
        const frequencies = [523.25, 659.25, 783.99, 1046.50];

        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            // Use mixture of waves for a "bell" like tone
            osc.type = index % 2 === 0 ? 'sine' : 'triangle';

            osc.frequency.setValueAtTime(freq, now + (index * 0.05)); // Staggered entry

            // Bell Envelope: Quick attack, long exponential decay
            const startTime = now + (index * 0.05);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02); // Attack
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5); // Long Decay

            osc.start(startTime);
            osc.stop(startTime + 1.5);
        });

        // Add a tiny bit of high-pitch sparkle
        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(audioContext.destination);

        sparkle.type = 'sine';
        sparkle.frequency.setValueAtTime(2093.00, now + 0.2); // C7
        sparkleGain.gain.setValueAtTime(0, now + 0.2);
        sparkleGain.gain.linearRampToValueAtTime(0.05, now + 0.25);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        sparkle.start(now + 0.2);
        sparkle.stop(now + 0.6);

    } else {
        // ANGRY ANIMAL GROWL
        // We'll use Frequency Modulation (FM) to create a rough, vocal texture

        // Carrier (The "voice")
        const carrier = audioContext.createOscillator();
        const carrierGain = audioContext.createGain();

        // Modulator (The "roughness" or "throatiness")
        const modulator = audioContext.createOscillator();
        const modulatorGain = audioContext.createGain();

        // Filter to dampen the harshness and make it sound more organic
        const filter = audioContext.createBiquadFilter();

        // Patch bay
        modulator.connect(modulatorGain);
        modulatorGain.connect(carrier.frequency); // FM Synthesis
        carrier.connect(filter);
        filter.connect(carrierGain);
        carrierGain.connect(audioContext.destination);

        // Settings
        carrier.type = 'sawtooth'; // Rich in harmonics
        modulator.type = 'sawtooth'; // Harsh modulator

        // Pitch Envelope (The "Growl" contour)
        const startFreq = 150;
        carrier.frequency.setValueAtTime(startFreq, now);
        carrier.frequency.linearRampToValueAtTime(80, now + 0.6); // Drop in pitch

        // Roughness Envelope (Modulation amount)
        modulator.frequency.setValueAtTime(40, now); // Fast modulation (roughness)
        modulatorGain.gain.setValueAtTime(500, now); // Intense modulation
        modulatorGain.gain.linearRampToValueAtTime(200, now + 0.6); // Less intense as it fades

        // Filter Envelope (Closing mouth)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(200, now + 0.6);
        filter.Q.value = 1; // Slight resonance

        // Amplitude Envelope
        carrierGain.gain.setValueAtTime(0, now);
        carrierGain.gain.linearRampToValueAtTime(0.4, now + 0.1); // Attack
        carrierGain.gain.linearRampToValueAtTime(0.3, now + 0.4); // Sustain
        carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Release

        // Start/Stop
        carrier.start(now);
        modulator.start(now);

        carrier.stop(now + 0.8);
        modulator.stop(now + 0.8);
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
