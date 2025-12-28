
/**
 * Plays a sound effect based on the type.
 * @param type - The type of sound to play ('success' | 'error')
 */
export const playSound = (type: 'success' | 'error') => {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch((error) => {
        console.warn("Audio playback failed:", error);
    });
};
