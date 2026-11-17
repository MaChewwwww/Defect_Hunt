"use client";

import React, { useState } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSandbox } from "@/lib/store/sandbox-store";

function SettingsContent() {
  const {
    session,
    currentUserRecord,
    theme,
    setTheme,
    updateProfile,
    changePassword,
    toggleLowAllotmentAlerts,
  } = useSandbox();

  const [fullName, setFullName] = useState(
    currentUserRecord?.name || session?.name || ""
  );
  const [email, setEmail] = useState(
    currentUserRecord?.email || session?.email || ""
  );
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const alertsEnabled = currentUserRecord?.lowAllotmentAlerts !== false;

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = updateProfile(fullName, email);
    if (res.ok) {
      setProfileMsg("Profile settings saved.");
    } else {
      setProfileMsg(res.error || "Unable to save profile.");
    }
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    const res = changePassword(currentPw, newPw, confirmPw);
    if (!res.ok) {
      setPwError(res.error || "Unable to change password.");
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwSuccess("Password updated successfully.");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl">Workspace Settings</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Manage your profile, password, theme, and allotment notifications
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your display name and staff contact email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileMsg && (
                <div className="mb-4 rounded-lg bg-[var(--status-success-bg)] px-3 py-2 text-xs text-[var(--status-success-fg)]">
                  {profileMsg}
                </div>
              )}
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="set-name">Full name</Label>
                  <Input
                    id="set-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-email">Email</Label>
                  <Input
                    id="set-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit">Save profile</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your Solstice Bay account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pwError && (
                <div className="mb-4 rounded-lg bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger-fg)]">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="mb-4 rounded-lg bg-[var(--status-success-bg)] px-3 py-2 text-xs text-[var(--status-success-fg)]">
                  {pwSuccess}
                </div>
              )}
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="set-cur-pw">Current password</Label>
                  <Input
                    id="set-cur-pw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-new-pw">New password</Label>
                  <Input
                    id="set-new-pw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-conf-pw">Confirm new password</Label>
                  <Input
                    id="set-conf-pw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                  />
                </div>
                <Button type="submit">Update password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Switch between Midnight Cypress (Dark) and Sunlit Travertine
                (Light)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Dark mode</div>
                <div className="text-xs text-[var(--ink-muted)]">
                  Use dark architectural theme across the workspace
                </div>
              </div>
              <Switch
                id="dark-mode-switch"
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure topbar bell alerts for low room allotments
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Low allotment alerts</div>
                <div className="text-xs text-[var(--ink-muted)]">
                  Show rooms &amp; packages with 5 or fewer available units
                </div>
              </div>
              <Switch
                id="low-allotment-alerts-switch"
                checked={alertsEnabled}
                onCheckedChange={(checked) =>
                  toggleLowAllotmentAlerts(checked)
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <WorkspaceShell>
      <SettingsContent />
    </WorkspaceShell>
  );
}
