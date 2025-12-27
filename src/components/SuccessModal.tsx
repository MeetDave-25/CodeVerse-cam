import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface Badge {
    icon: string;
    name: string;
    description: string;
}

interface SuccessModalProps {
    isOpen: boolean;
    points: number;
    badges: Badge[];
    onContinue: () => void;
}

export const SuccessModal = ({ isOpen, points, badges, onContinue }: SuccessModalProps) => {
    useEffect(() => {
        if (isOpen) {
            // Trigger confetti animation
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            };

            const interval: any = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // Regular confetti
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            // Special badge confetti if badges earned
            if (badges.length > 0) {
                setTimeout(() => {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        colors: ['#FFD700', '#FFA500', '#FF69B4', '#00d4ff', '#ff00ff'],
                        origin: { y: 0.6 }
                    });
                }, 500);
            }

            return () => clearInterval(interval);
        }
    }, [isOpen, badges.length]);

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md bg-gradient-card border-primary/30 neon-border">
                <DialogHeader>
                    <DialogTitle className="text-center text-3xl font-bold neon-text flex items-center justify-center gap-3">
                        <Trophy className="h-8 w-8 text-accent animate-bounce" />
                        Problem Solved!
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Points Display */}
                    <div className="text-center">
                        <div className="text-6xl font-bold text-primary animate-pulse mb-2">
                            +{points}
                        </div>
                        <p className="text-muted-foreground">points earned</p>
                    </div>

                    {/* Badges Earned */}
                    {badges.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-center text-accent">
                                🎉 New Badges Earned!
                            </h3>
                            <div className="space-y-2">
                                {badges.map((badge, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-4 rounded-lg bg-gradient-neon border border-accent/30 animate-slide-up"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <span className="text-4xl animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                                            {badge.icon}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-lg">{badge.name}</p>
                                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Continue Button */}
                    <Button
                        onClick={onContinue}
                        className="w-full bg-gradient-neon hover:shadow-glow-pink text-lg py-6"
                        size="lg"
                    >
                        Continue to Problems
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
