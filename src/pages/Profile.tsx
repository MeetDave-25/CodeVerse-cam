import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Award, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProfileData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: badgesData } = await supabase
        .from("user_badges")
        .select(`
          *,
          badges (*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      setBadges(badgesData || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const collegeYear = formData.get("collegeYear") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          college_year: collegeYear ? parseInt(collegeYear) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchProfileData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <User className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 neon-text">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your achievements</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="md:col-span-2 bg-gradient-card border-border/50 neon-border animate-slide-up" style={{animationDelay: '0.1s'}}>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={profile?.full_name || ""}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collegeYear">College Year</Label>
                  <Select name="collegeYear" defaultValue={profile?.college_year?.toString() || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-gradient-neon hover:shadow-glow-pink" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Card className="bg-gradient-card border-primary/20 neon-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Problems Solved</p>
                  <p className="text-2xl font-bold">{profile?.problems_solved || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold text-primary">{profile?.total_score || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">🔥 {profile?.current_streak || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                  <p className="text-2xl font-bold">{profile?.longest_streak || 0} days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Badges */}
        <Card className="mt-6 bg-gradient-card border-border/50 neon-border animate-slide-up" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Your Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((userBadge) => (
                  <div 
                    key={userBadge.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-glow-pink transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{userBadge.badges.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{userBadge.badges.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {userBadge.badges.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No badges earned yet</p>
                <Button variant="outline" onClick={() => navigate("/problems")}>
                  Start Solving Problems
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
