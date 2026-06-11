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

type Role = "SUPER_ADMIN" | "BRANCH_ADMIN";

type Row = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  branchName: string | null;
  active: boolean;
};

type Props = {
  rows: Row[];
  branches: { id: string; name: string }[];
  currentEmail: string;
};

export function AccountsAdmin({ rows, branches, currentEmail }: Props) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("BRANCH_ADMIN");
  const [branchId, setBranchId] = React.useState(branches[0]?.id ?? "");
  const [busy, setBusy] = React.useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createAdminUser({
      email,
      name,
      password,
      role,
      branchId: role === "BRANCH_ADMIN" ? branchId || null : null,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not create account.");
      return;
    }
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
            <option value="SUPER_ADMIN">Super admin (all branches)</option>
          </select>
        </div>
        {role === "BRANCH_ADMIN" ? (
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
                  {u.role === "SUPER_ADMIN" ? "Super admin" : "Branch admin"}
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
