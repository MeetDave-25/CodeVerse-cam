
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
        // DIGITAL SYSTEM FAIL: "Access Denied" (Double Low Beep)
        // Sound like a futuristic UI blocking an action

        const playLowBeep = (startTime: number) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.type = 'sawtooth'; // Slightly buzzy

            // Pitch drop effect
            osc.frequency.setValueAtTime(150, startTime);
            osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.15);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        };

        // Play twice
        playLowBeep(now);
        playLowBeep(now + 0.15);
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
