import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users as UsersIcon, Mail, Trophy, Target, Flame, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UsersView() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", college_year: "" });

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      console.log("Fetching users...");
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) {
        return profiles.map(profile => ({
          ...profile,
          user_roles: []
        }));
      }

      return profiles.map(profile => ({
        ...profile,
        user_roles: roles.filter(r => r.user_id === profile.id)
      }));
    },
  });

  const [yearFilter, setYearFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = users?.filter(user => {
    if (yearFilter !== "all" && user.college_year?.toString() !== yearFilter) return false;
    
    if (roleFilter !== "all") {
      const role = user.user_roles as any;
      const userRole = Array.isArray(role) && role.length > 0 ? role[0].role : 'student';
      if (userRole !== roleFilter) return false;
    }

    return true;
  });

  const changeUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "student" }) => {
      const { data: existingRole, error: fetchError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
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
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });

  const updateUserProfile = useMutation({
    mutationFn: async (data: { id: string; full_name: string; college_year: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: data.full_name,
          college_year: data.college_year
        })
        .eq("id", data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
      toast.success("User profile updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles (Cascades should handle other tables usually, but we implement what we can)
      // Note: This does NOT delete from auth.users (requires edge function/admin api)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeletingUser(null);
      toast.success("User deleted (Profile removed)");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`);
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

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      college_year: user.college_year?.toString() || ""
    });
  };

  return (
    <div className="space-y-6">
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
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                            <SelectTrigger className="w-28 h-8">
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
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:text-primary"
                              onClick={() => handleEditClick(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:text-destructive text-destructive/70"
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Make changes to the user's profile information here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Select
                value={editForm.college_year}
                onValueChange={(val) => setEditForm({...editForm, college_year: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateUserProfile.mutate({
                id: editingUser.id,
                full_name: editForm.full_name,
                college_year: parseInt(editForm.college_year)
              })}
              disabled={updateUserProfile.isPending}
            >
              {updateUserProfile.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              <span className="font-semibold text-foreground"> {deletingUser?.email} </span>
              and remove their data from the public database.
              <br /><br />
              <span className="text-yellow-500 text-xs">Note: This only removes the public profile. Authentication access must be revoked separately if needed.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteUser.mutate(deletingUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
