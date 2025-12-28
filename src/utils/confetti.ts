import confetti from 'canvas-confetti';

/**
 * Trigger confetti animation for problem solve success
 */
export const celebrateProblemSolved = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Burst from left
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#ff00ff', '#00d4ff', '#9333ea', '#06b6d4'],
        });

        // Burst from right
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#ff00ff', '#00d4ff', '#9333ea', '#06b6d4'],
        });
    }, 250);
};

/**
 * Trigger special confetti animation for badge earning
 */
export const celebrateBadgeEarned = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;

    // Fireworks effect
    const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        confetti({
            particleCount: 100,
            startVelocity: 30,
            spread: 360,
            origin: {
                x: Math.random(),
                y: Math.random() - 0.2,
            },
            colors: ['#FFD700', '#FFA500', '#ff00ff', '#00d4ff', '#9333ea'],
            shapes: ['star', 'circle'],
            scalar: 1.2,
            zIndex: 9999,
        });
    }, 400);

    // Add emoji confetti
    setTimeout(() => {
        confetti({
            particleCount: 30,
            spread: 100,
            origin: { y: 0.6 },
            shapes: ['circle'],
            colors: ['#FFD700', '#FFA500'],
            scalar: 2,
            zIndex: 9999,
        });
    }, 200);
};

/**
 * Quick confetti burst from center
 */
export const quickCelebration = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff00ff', '#00d4ff', '#9333ea', '#06b6d4'],
        zIndex: 9999,
    });
};
