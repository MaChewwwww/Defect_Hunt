"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { AllotmentHealthBar } from "@/components/hospitality/allotment-health-bar";
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
import { LOW_ALLOTMENT_THRESHOLD } from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";
import type { RoomCategory, RoomPackage } from "@/types/domain";

const CATEGORIES: RoomCategory[] = [
  "Villas & Suites",
  "Casitas & Rooms",
  "Marine & Island Tours",
  "Spa & Sanctuary",
  "Dining & Lounge",
];

const PAGE_SIZE = 10;

export default function RoomsPage() {
  const {
    db,
    session,
    saveRoomPackage,
    adjustAllotment,
    deleteRoomPackage,
  } = useSandbox();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("code-asc");
  const [page, setPage] = useState(1);

  // Add / Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomPackage | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<RoomCategory>("Villas & Suites");
  const [rate, setRate] = useState("1000");
  const [availableUnits, setAvailableUnits] = useState("10");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Adjust Allotment modal state
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjTarget, setAdjTarget] = useState<RoomPackage | null>(null);
  const [adjType, setAdjType] = useState<"add" | "remove">("add");
  const [adjQty, setAdjQty] = useState("1");
  const [adjReason, setAdjReason] = useState("");
  const [adjError, setAdjError] = useState<string | null>(null);

  // Delete confirmation modal state (on /rooms list)
  const [deleteTarget, setDeleteTarget] = useState<RoomPackage | null>(null);

  const isAdmin = session?.role === "admin";

  const filteredRooms = useMemo(() => {
    const list = db?.roomsPackages ?? [];
    const q = search.trim().toLowerCase();

    const matched = list.filter((r) => {
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.code.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (categoryFilter !== "All" && r.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "in-service" && r.availableUnits <= LOW_ALLOTMENT_THRESHOLD) {
        return false;
      }
      if (
        statusFilter === "low" &&
        (r.availableUnits <= 0 || r.availableUnits > LOW_ALLOTMENT_THRESHOLD)
      ) {
        return false;
      }
      if (statusFilter === "out" && r.availableUnits > 0) {
        return false;
      }
      return true;
    });

    const sorted = [...matched].sort((a, b) => {
      if (sortBy === "rate-asc") {
        return a.rate - b.rate;
      }
      if (sortBy === "rate-desc") {
        // @defect VH-26 (Hard | Rooms & Packages / list | Functional)
        // Expected: Numeric descending sort (6,400.00 first).
        // Actual: Sorts rates lexicographically as strings ("990.00", "975.00", "950.00" above "6,400.00").
        return b.rate.toFixed(2).localeCompare(a.rate.toFixed(2));
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return a.code.localeCompare(b.code);
    });

    return sorted;
  }, [db, search, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (nextPage: number) => {
    // @defect VH-25 (Medium | Rooms & Packages / list | Functional)
    // Expected: Preserve all filters (including category) when navigating pagination.
    // Actual: Drops categoryFilter back to "All" while preserving search, status, and sort!
    setCategoryFilter("All");
    setPage(nextPage);
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setCode("");
    setName("");
    setCategory("Villas & Suites");
    setRate("1000");
    setAvailableUnits("10");
    setDescription("");
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (room: RoomPackage) => {
    setEditingRoom(room);
    setCode(room.code);
    setName(room.name);
    setCategory(room.category);
    setRate(String(room.rate));
    setAvailableUnits(String(room.availableUnits));
    setDescription(room.description);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = saveRoomPackage({
      id: editingRoom?.id,
      code,
      name,
      category,
      rate: Number(rate),
      availableUnits: Number(availableUnits),
      status: "active",
      description,
    });
    if (!res.ok) {
      setFormError(res.error || "Unable to save room or package.");
      return;
    }
    setFormOpen(false);
  };

  const handleCancelForm = () => {
    // @defect VH-28 (Hard | Rooms & Packages / Edit | Functional)
    // Expected: Clicking Cancel discards all edits.
    // Actual: Discards name/description changes, but still saves modified rate when editing.
    if (editingRoom) {
      saveRoomPackage(
        {
          id: editingRoom.id,
          code: editingRoom.code,
          name: editingRoom.name,
          category: editingRoom.category,
          rate: Number(rate),
          availableUnits: editingRoom.availableUnits,
          status: editingRoom.status,
          description: editingRoom.description,
        },
        { isCancelAction: true }
      );
    }
    setFormOpen(false);
  };

  const openAdjustModal = (room: RoomPackage) => {
    setAdjTarget(room);
    setAdjType("add");
    setAdjQty("1");
    setAdjReason("");
    setAdjError(null);
    setAdjOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjTarget) return;
    setAdjError(null);
    const res = adjustAllotment({
      roomPackageId: adjTarget.id,
      type: adjType,
      quantity: Number(adjQty),
      reason: adjReason,
    });
    if (!res.ok) {
      setAdjError(res.error || "Unable to adjust allotment.");
      return;
    }
    setAdjOpen(false);
  };

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Rooms &amp; Packages</h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Manage Solstice Bay accommodations, tours, spa rituals, and live
              unit allotments
            </p>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add Room / Package
          </Button>
        </div>

        {/* Filter & Sort Toolbar */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search code or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              aria-label="Filter by category"
              data-testid="rooms-category-filter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by allotment status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="in-service">In service (&gt; 5)</option>
              <option value="low">Low allotment (1-5)</option>
              <option value="out">Out of allotment (0)</option>
            </Select>
            <Select
              aria-label="Sort rooms and packages"
              data-testid="rooms-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="code-asc">Code (SB-1001...)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="rate-asc">Rate (low to high)</option>
              <option value="rate-desc">Rate (high to low)</option>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table data-testid="rooms-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Allotment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRooms.map((room) => (
                  <TableRow key={room.id} data-testid={`room-row-${room.code}`}>
                    <TableCell className="font-mono-tabular text-xs font-semibold">
                      {room.code}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="hover:text-[var(--accent-primary)]"
                      >
                        {room.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--ink-secondary)]">
                      {room.category}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono-tabular"
                      data-testid={`room-rate-${room.code}`}
                    >
                      PHP {formatMoney(room.rate)}
                    </TableCell>
                    <TableCell>
                      <AllotmentHealthBar availableUnits={room.availableUnits} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* @defect VH-59: Icon-only buttons omit aria-label and title */}
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`edit-room-${room.code}`}
                          onClick={() => openEditModal(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAdjustModal(room)}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Adjust allotment
                        </Button>
                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`delete-room-${room.code}`}
                            onClick={() => setDeleteTarget(room)}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--status-danger-fg)]" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Footer */}
            <div className="border-t border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between text-xs text-[var(--ink-muted)]">
              <div>
                Showing {paginatedRooms.length} of {filteredRooms.length} items
                &middot; Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Room Modal */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && handleCancelForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Edit Room / Package" : "Add Room / Package"}
            </DialogTitle>
          </DialogHeader>
          {formError && (
            <div className="rounded-md bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger-fg)]">
              {formError}
            </div>
          )}
          <form onSubmit={handleSaveForm} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rm-code">Code</Label>
                <Input
                  id="rm-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SB-1021"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rm-cat">Category</Label>
                <Select
                  id="rm-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RoomCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rm-name">Name</Label>
              <Input
                id="rm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Room or package name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rm-rate">Rate (PHP)</Label>
                <Input
                  id="rm-rate"
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rm-units">Available Units</Label>
                <Input
                  id="rm-units"
                  type="number"
                  step="any"
                  value={availableUnits}
                  onChange={(e) => setAvailableUnits(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rm-desc">Description</Label>
              <Input
                id="rm-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleCancelForm}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Allotment Modal */}
      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adjust Allotment &mdash; {adjTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {adjError && (
            <div className="rounded-md bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger-fg)]">
              {adjError}
            </div>
          )}
          <form onSubmit={handleAdjustSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="adj-type">Adjustment Type</Label>
              <Select
                id="adj-type"
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as "add" | "remove")}
              >
                <option value="add">Add (Return to service)</option>
                <option value="remove">Remove (Release to maintenance)</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="adj-qty">Quantity</Label>
              <Input
                id="adj-qty"
                type="number"
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adj-reason">Reason</Label>
              <Input
                id="adj-reason"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Maintenance or inspection notes"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Apply Adjustment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal (List View) */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room / Package</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--ink-secondary)]">
            Are you sure you want to delete{" "}
            <strong className="text-[var(--ink-primary)]">
              {deleteTarget?.name}
            </strong>
            ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteRoomPackage(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
