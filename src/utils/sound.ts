
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
        // "BOOP-BOOP" ERROR SOUND - Friendly but clear "Wrong Answer"
        // Two distinct descending tones to denote error without being harsh

        // Tone 1: High Boop
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(450, now); // Slightly higher start

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc1.start(now);
        osc1.stop(now + 0.15);

        // Tone 2: Low Boop (Descending interval)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, now + 0.18); // Clear drop in pitch

        gain2.gain.setValueAtTime(0, now + 0.18);
        gain2.gain.linearRampToValueAtTime(0.2, now + 0.20);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc2.start(now + 0.18);
        osc2.stop(now + 0.4);
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
