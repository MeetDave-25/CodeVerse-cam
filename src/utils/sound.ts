
// Create shared AudioContext
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

/**
 * Plays a synthesized sound based on type
 */
const playSynthSound = (type: 'success' | 'error') => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
        // Success: Ascending 5th (C -> G) with a "ping" envelope
        // Note 1
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.1); // G5

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);

        // Add a little "sparkle" with a second oscillator
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1046.50, audioContext.currentTime); // C6
        gain2.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        osc2.start();
        osc2.stop(audioContext.currentTime + 0.3);

    } else {
        // Error: Low buzzing sawtooth descending
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
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
