import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Brain, ArrowLeft } from "lucide-react";

const About = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Animated Background Grid */}
            <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

            <div className="container mx-auto px-4 py-8 relative">
                <Link to="/">
                    <Button variant="ghost" className="mb-8 hover:bg-primary/10 hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>

                <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center neon-text animate-slide-up">
                    About <span className="text-primary">CodeVerse</span>
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {/* Vision Section */}
                    <div className="h-full space-y-6 animate-slide-right p-8 rounded-2xl bg-card/30 border border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
                        <div className="inline-block p-4 rounded-xl bg-primary/10 border border-primary/20 mb-2 shadow-glow-pink">
                            <Target className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">Our Vision</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            To bridge the gap between academic learning and industry requirements by creating
                            an immersive, gamified ecosystem where students strive for excellence in coding.
                            We envision a future where every student is empowered to become a top-tier developer
                            through consistent practice and healthy competition.
                        </p>
                    </div>

                    {/* Mission Section */}
                    <div className="h-full space-y-6 animate-slide-left p-8 rounded-2xl bg-card/30 border border-secondary/20 backdrop-blur-sm hover:border-secondary/50 transition-all duration-300">
                        <div className="inline-block p-4 rounded-xl bg-secondary/10 border border-secondary/20 mb-2 shadow-glow-cyan">
                            <Brain className="h-10 w-10 text-secondary" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Provide a structured, engaging, and competitive platform that nurtures problem-solving skills.
                            By integrating AI-driven insights and real-world challenges, we aim to transform the way
                            coding is taught and practiced in campuses globally, making learning an adventure rather than a chore.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
