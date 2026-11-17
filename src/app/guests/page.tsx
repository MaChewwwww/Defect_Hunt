"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Guest, LoyaltyTier } from "@/types/domain";

export default function GuestsPage() {
  const { db, saveGuest, deleteGuest } = useSandbox();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyTier>("Standard");
  const [error, setError] = useState<string | null>(null);

  const guests = useMemo(() => {
    const list = db?.guests ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q)
    );
  }, [db, search]);

  const reservationCountByGuest = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of db?.reservations ?? []) {
      map.set(r.guestId, (map.get(r.guestId) ?? 0) + 1);
    }
    return map;
  }, [db]);

  const openAdd = () => {
    setEditingGuest(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setLoyaltyTier("Standard");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (g: Guest) => {
    setEditingGuest(g);
    setName(g.name);
    setEmail(g.email);
    setPhone(g.phone);
    setAddress(g.address);
    setLoyaltyTier(g.loyaltyTier);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = saveGuest({
      id: editingGuest?.id,
      name,
      email,
      phone,
      address,
      loyaltyTier,
    });
    if (!res.ok) {
      setError(res.error || "Unable to save guest.");
      return;
    }
    setModalOpen(false);
  };

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Guests Directory</h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Solstice Bay guest profiles, loyalty tiers, and booking histories
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Guest
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Search guests by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {guests.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--ink-muted)]">
                {/* @defect VH-57 (Medium | Text | UI)
                    Expected: "No customers match your search" / "No guests match your search"
                    Actual: Misspelled "No custmers match your search" */}
                No custmers match your search
              </div>
            ) : (
              <Table data-testid="guests-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Loyalty</TableHead>
                    <TableHead className="text-right">Reservations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((g) => (
                    <TableRow key={g.id} data-testid={`guest-row-${g.id}`}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/guests/${g.id}`}
                          className="hover:text-[var(--accent-primary)]"
                        >
                          {g.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-mono-tabular">
                        {g.email}
                      </TableCell>
                      <TableCell className="text-xs font-mono-tabular">
                        {g.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant="accent">{g.loyaltyTier}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {reservationCountByGuest.get(g.id) ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* @defect VH-59: Icon-only edit/delete buttons omit aria-label and title */}
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`edit-guest-${g.id}`}
                            onClick={() => openEdit(g)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`delete-guest-${g.id}`}
                            onClick={() => deleteGuest(g.id)}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--status-danger-fg)]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGuest ? "Edit Guest" : "Add Guest"}
            </DialogTitle>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger-fg)]">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="gst-name">Full Name</Label>
              <Input
                id="gst-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst-email">Email</Label>
              <Input
                id="gst-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst-phone">Phone</Label>
              <Input
                id="gst-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst-addr">Address</Label>
              <Input
                id="gst-addr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gst-tier">Loyalty Tier</Label>
              <Select
                id="gst-tier"
                value={loyaltyTier}
                onChange={(e) => setLoyaltyTier(e.target.value as LoyaltyTier)}
              >
                <option value="Standard">Standard</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Founders Club">Founders Club</option>
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
              <Button type="submit">Save Guest</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
