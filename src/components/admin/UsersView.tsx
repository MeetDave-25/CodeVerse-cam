import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users as UsersIcon, Mail, Trophy, Target, Flame } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function UsersView() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      console.log("Fetching users...");
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        // Don't fail completely if roles fail, just return profiles
        return profiles.map(profile => ({
          ...profile,
          user_roles: []
        }));
      }

      // Merge data
      return profiles.map(profile => ({
        ...profile,
        user_roles: roles.filter(r => r.user_id === profile.id)
      }));
    },
  });

  const [yearFilter, setYearFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = users?.filter(user => {
    // Year filter
    if (yearFilter !== "all") {
      if (user.college_year?.toString() !== yearFilter) {
        return false;
      }
    }

    // Role filter
    if (roleFilter !== "all") {
      const role = user.user_roles as any;
      const userRole = Array.isArray(role) && role.length > 0 ? role[0].role : 'student';
      if (userRole !== roleFilter) {
        return false;
      }
    }

    return true;
  });

  const changeUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "student" }) => {
      // First, get the current role entry
      const { data: existingRole, error: fetchError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role if it doesn't exist
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      console.error("Role update error:", error);
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });

  const stats = {
    total: users?.length || 0,
    students: users?.filter(u => {
      const role = u.user_roles as any;
      return Array.isArray(role) && role.length > 0 && role[0].role === 'student';
    }).length || 0,
    admins: users?.filter(u => {
      const role = u.user_roles as any;
      return Array.isArray(role) && role.length > 0 && role[0].role === 'admin';
    }).length || 0,
    activeToday: users?.filter((u) => {
      const today = new Date().toDateString();
      return new Date(u.created_at).toDateString() === today;
    }).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.students}</div>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Trophy className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Flame className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.activeToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="neon-border bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>View and manage registered users</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students Only</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading users: {(error as Error).message}</p>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Solved</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const role = user.user_roles as any;
                    const userRole = Array.isArray(role) && role.length > 0 ? role[0].role : "student";
                    const isAdmin = userRole === 'admin';

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {user.full_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.college_year ? `Year ${user.college_year}` : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userRole}
                            onValueChange={(newRole: "admin" | "student") =>
                              changeUserRole.mutate({ userId: user.id, newRole })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {isAdmin ? "-" : (user.total_score || 0)}
                        </TableCell>
                        <TableCell>
                          {isAdmin ? "-" : (user.problems_solved || 0)}
                        </TableCell>
                        <TableCell className="text-destructive font-medium">
                          {isAdmin ? "-" : `${user.current_streak || 0} 🔥`}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
