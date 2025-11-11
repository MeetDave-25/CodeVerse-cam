import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Shield, Database } from "lucide-react";

export function SettingsView() {
  return (
    <div className="space-y-6">
      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <CardTitle>Platform Settings</CardTitle>
          </div>
          <CardDescription>Configure your platform preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Email notifications for new submissions
                </Label>
                <Switch id="email-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="user-notifications" className="cursor-pointer">
                  Notify on new user registrations
                </Label>
                <Switch id="user-notifications" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-confirm" className="cursor-pointer">
                  Auto-confirm email signups (Development)
                </Label>
                <Switch id="auto-confirm" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="rate-limiting" className="cursor-pointer">
                  Enable rate limiting
                </Label>
                <Switch id="rate-limiting" defaultChecked />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="backup" className="cursor-pointer">
                  Automatic daily backups
                </Label>
                <Switch id="backup" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics" className="cursor-pointer">
                  Enable analytics tracking
                </Label>
                <Switch id="analytics" defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
          <CardDescription>Current platform details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Platform Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Database Status</span>
            <span className="text-sm font-medium text-success">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
