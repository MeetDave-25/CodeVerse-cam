
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
        // LONG MUSICAL ERROR - "Reflective" Minor Chord
        // A pleasant but slightly sad sound that lasts 2-3 seconds

        // A Minor Chord (A3 - C4 - E4) with a slow fade
        const tones = [
            { freq: 220.00, type: 'triangle' }, // A3
            { freq: 261.63, type: 'sine' },     // C4 (Minor 3rd)
            { freq: 329.63, type: 'sine' }      // E4
        ];

        const duration = 2.5; // 2.5 seconds long

        tones.forEach((tone, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.type = tone.type as OscillatorType;
            osc.frequency.setValueAtTime(tone.freq, now);

            // Soft swell and long fade
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1 + (i * 0.05)); // Staggered soft attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Add a deep bass undertone for "weight"
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        bass.connect(bassGain);
        bassGain.connect(audioContext.destination);

        bass.type = 'sine';
        bass.frequency.setValueAtTime(110.00, now); // A2

        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.1, now + 0.2);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.5); // Lasts slightly longer

        bass.start(now);
        bass.stop(now + duration + 0.5);
    }
};

/**
 * Plays a sound effect based on the type.
 * @param type - The type of sound to play ('success' | 'error')
 */
export const playSound = (type: 'success' | 'error') => {
    // Use synthesized sounds directly for reliability
    try {
        playSynthSound(type);
    } catch (e) {
        console.warn("Sound playback failed:", e);
    }
};
