"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSandbox } from "@/lib/store/sandbox-store";
import type { UserRole } from "@/types/domain";

export default function UsersPage() {
  const { db, session, createUser, toggleUserActive } = useSandbox();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [error, setError] = useState<string | null>(null);

  // @defect VH-10 (Medium | Access control / Users | Security)
  // Expected: Staff navigating directly to /users is blocked or redirected.
  // Actual: No role guard on /users page; opens fully functional for any signed-in user.

  const users = db?.users || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = createUser({ name, email, password, role });
    if (!res.ok) {
      setError(res.error || "Unable to create user.");
      return;
    }
    setModalOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
  };

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Staff &amp; User Accounts</h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Manage Solstice Bay administrator and concierge access accounts
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Directory ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = session?.userId === u.id;
                  return (
                    <TableRow key={u.id} data-testid={`user-row-${u.email}`}>
                      <TableCell className="font-medium">
                        {u.name}{" "}
                        {isSelf && (
                          <span className="text-xs text-[var(--ink-muted)]">
                            (You)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono-tabular text-xs">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "accent" : "default"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "success" : "danger"}>
                          {u.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* @defect VH-12 (Medium | Users | Functional)
                            Expected: Deactivate button disabled or blocked on Admin's own row.
                            Actual: Admin can click Deactivate on their own row and gets signed out on next page load. */}
                        <Button
                          size="sm"
                          variant={u.isActive ? "destructive" : "secondary"}
                          onClick={() => toggleUserActive(u.id)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Account</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger-fg)]">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="new-u-name">Full name</Label>
              <Input
                id="new-u-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-u-email">Email</Label>
              <Input
                id="new-u-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-u-pass">Password</Label>
              <Input
                id="new-u-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-u-role">Role</Label>
              <Select
                id="new-u-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
