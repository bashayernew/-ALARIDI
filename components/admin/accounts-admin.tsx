"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createAdminUser,
  setAdminUserActive,
  resetAdminPassword,
  deleteAdminUser,
} from "@/actions/admin-users";
import { assignAreasToBranch } from "@/actions/branch-delivery-areas";
import { KUWAIT_GOVERNORATES } from "@/lib/kuwait-areas";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "SUPER_ADMIN" | "BRANCH_ADMIN" | "BRANCH_SALES";

type Row = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  branchName: string | null;
  active: boolean;
};

type AreaAssignment = { governorate: string; area: string; branchId: string };

type Props = {
  rows: Row[];
  branches: { id: string; name: string }[];
  areaAssignments: AreaAssignment[];
  currentEmail: string;
};

export function AccountsAdmin({ rows, branches, areaAssignments, currentEmail }: Props) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("BRANCH_ADMIN");
  const [branchId, setBranchId] = React.useState(branches[0]?.id ?? "");
  const [busy, setBusy] = React.useState(false);
  const [openGov, setOpenGov] = React.useState<string | null>(null);

  const branchNameById = React.useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches]
  );
  const assignmentByArea = React.useMemo(
    () => new Map(areaAssignments.map((a) => [a.area, a.branchId])),
    [areaAssignments]
  );

  // Areas ticked for the branch currently selected in the form.
  const [selectedAreas, setSelectedAreas] = React.useState<Set<string>>(
    () =>
      new Set(
        areaAssignments
          .filter((a) => a.branchId === (branches[0]?.id ?? ""))
          .map((a) => a.area)
      )
  );
  React.useEffect(() => {
    setSelectedAreas(
      new Set(
        areaAssignments.filter((a) => a.branchId === branchId).map((a) => a.area)
      )
    );
  }, [branchId, areaAssignments]);

  function toggleArea(area: string) {
    setSelectedAreas((cur) => {
      const next = new Set(cur);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createAdminUser({
      email,
      name,
      password,
      role,
      branchId: role === "SUPER_ADMIN" ? null : branchId || null,
    });
    if (!res.ok) {
      setBusy(false);
      toast.error(res.error ?? "Could not create account.");
      return;
    }
    if (role === "BRANCH_ADMIN" && branchId) {
      try {
        const areas: { governorate: string; area: string }[] = [];
        for (const g of KUWAIT_GOVERNORATES) {
          for (const a of g.areas) {
            if (selectedAreas.has(a.key)) {
              areas.push({ governorate: g.key, area: a.key });
            }
          }
        }
        await assignAreasToBranch({ branchId, areas });
      } catch {
        toast.error("Account created, but saving the delivery areas failed.");
      }
    }
    setBusy(false);
    toast.success("Account created");
    setEmail("");
    setName("");
    setPassword("");
    router.refresh();
  }

  async function onToggleActive(id: string, active: boolean) {
    const res = await setAdminUserActive(id, active);
    if (!res.ok) return toast.error(res.error ?? "Failed");
    toast.success(active ? "Account enabled" : "Account disabled");
    router.refresh();
  }

  async function onReset(id: string) {
    const pw = window.prompt("New password (min 6 characters)");
    if (!pw) return;
    const res = await resetAdminPassword(id, pw);
    if (!res.ok) return toast.error(res.error ?? "Failed");
    toast.success("Password reset");
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this account?")) return;
    const res = await deleteAdminUser(id);
    if (!res.ok) return toast.error(res.error ?? "Failed");
    toast.success("Account deleted");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={onCreate}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <h2 className="font-heading text-xl text-foreground">Add account</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-email">Email</Label>
          <Input
            id="acc-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-name">Name</Label>
          <Input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-pw">Password</Label>
          <Input
            id="acc-pw"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-role">Role</Label>
          <select
            id="acc-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-9 w-full rounded-lg border border-border/60 bg-muted/20 px-2 text-sm"
          >
            <option value="BRANCH_ADMIN">Branch admin</option>
            <option value="BRANCH_SALES">
              Branch sales (orders &amp; menu availability only)
            </option>
            <option value="SUPER_ADMIN">Super admin (all branches)</option>
          </select>
        </div>
        {role !== "SUPER_ADMIN" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="acc-branch">Branch</Label>
            <select
              id="acc-branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/60 bg-muted/20 px-2 text-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {role === "BRANCH_ADMIN" ? (
            <div className="space-y-2 pt-2">
              <Label>Delivery areas this account manages</Label>
              <p className="text-xs text-muted-foreground">
                Tick the governorates and areas this branch delivers to. The
                admin will set the delivery price for each ticked area. Areas
                marked with another branch will be moved to this branch.
                Selected: {selectedAreas.size}
              </p>
              <div className="space-y-2">
                {KUWAIT_GOVERNORATES.map((g) => {
                  const ticked = g.areas.filter((a) =>
                    selectedAreas.has(a.key)
                  ).length;
                  const open = openGov === g.key;
                  return (
                    <section
                      key={g.key}
                      className="rounded-xl border border-border bg-muted/10"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenGov(open ? null : g.key)}
                        className="flex w-full items-center justify-between px-3 py-2 text-start text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {g.nameEn}
                          {ticked > 0 ? (
                            <span className="ms-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                              {ticked}
                            </span>
                          ) : null}
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition",
                            open && "rotate-180"
                          )}
                        />
                      </button>
                      {open ? (
                        <ul className="grid gap-1 border-t border-border/60 p-2 sm:grid-cols-2">
                          {g.areas.map((a) => {
                            const owner = assignmentByArea.get(a.key);
                            const otherBranch =
                              owner && owner !== branchId
                                ? branchNameById.get(owner)
                                : null;
                            return (
                              <li key={a.key}>
                                <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/40">
                                  <Checkbox
                                    checked={selectedAreas.has(a.key)}
                                    onCheckedChange={() => toggleArea(a.key)}
                                  />
                                  <span className="min-w-0 truncate">
                                    {a.nameEn}
                                    {otherBranch ? (
                                      <span className="ms-1 text-[11px] text-amber-500">
                                        ({otherBranch})
                                      </span>
                                    ) : null}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>
            ) : null}
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy} className="rounded-xl">
            {busy ? "Saving…" : "Create account"}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{u.email}</div>
                  {u.name ? (
                    <div className="text-xs text-muted-foreground">{u.name}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-foreground/80">
                  {u.role === "SUPER_ADMIN"
                    ? "Super admin"
                    : u.role === "BRANCH_SALES"
                      ? "Branch sales"
                      : "Branch admin"}
                </td>
                <td className="px-4 py-3 text-foreground/80">
                  {u.role === "SUPER_ADMIN" ? "All" : u.branchName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={u.active}
                      onCheckedChange={(v) => onToggleActive(u.id, v === true)}
                    />
                  </label>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onReset(u.id)}
                    >
                      Reset password
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={u.email.toLowerCase() === currentEmail.toLowerCase()}
                      onClick={() => onDelete(u.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No accounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
