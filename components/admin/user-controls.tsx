"use client";

import { useState, useTransition } from "react";
import { blockUser, setUserRole, unblockUser, type UserActionResult } from "@/app/admin/users/actions";
import { AdminButton, AdminDialog, AdminTextarea, DialogActions, Pill, RowMenu, type RowMenuItem } from "@/components/admin/ui";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Target = { id: string; name: string; email: string; role: Role; banned: boolean };
type Dialog = "role" | "block" | "unblock";

function useUserAction(onDone: () => void) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(action: () => Promise<UserActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action().catch(() => ({ error: "Something went wrong. Please try again." }));
      if (result.error) setError(result.error);
      else onDone();
    });
  }
  return { pending, error, run };
}

function ErrorText({ error }: { error: string | null }) {
  return error && <p className="mt-3 text-xs text-red-600">{error}</p>;
}

/** The "⋮" menu at the end of a user row. Each item opens a dialog. */
export function UserActions({ user }: { user: Target }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const menuItems: RowMenuItem[] = [
    { label: "Change role…", onSelect: () => setDialog("role") },
    user.banned
      ? { label: "Unblock…", onSelect: () => setDialog("unblock") }
      : { label: "Block…", onSelect: () => setDialog("block"), danger: true, disabled: user.role === "admin" ? "Admins cannot be blocked. Change their role first." : undefined },
  ];

  return (
    <>
      <RowMenu label={`Actions for ${user.name}`} items={menuItems} />
      <AdminDialog open={dialog === "role"} onClose={close} title={`Change the role of ${user.name}`}>
        <RoleForm user={user} onDone={close} />
      </AdminDialog>
      <AdminDialog open={dialog === "block"} onClose={close} title={`Block ${user.name}?`}>
        <BlockForm user={user} onDone={close} />
      </AdminDialog>
      <AdminDialog open={dialog === "unblock"} onClose={close} title={`Unblock ${user.name}?`}>
        <UnblockForm user={user} onDone={close} />
      </AdminDialog>
    </>
  );
}

/**
 * Block (or, for admins, unblock) one person outside the users list, e.g. the author on a review page.
 * `refusal` says why the viewer may not block them; the button is then greyed out with that as its tooltip.
 */
export function BlockUserButton({ user, refusal, canUnblock }: { user: Target; refusal?: string; canUnblock: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  if (user.banned) {
    return (
      <span className="flex items-center gap-2">
        <Pill tone="red" dot>
          Blocked
        </Pill>
        {canUnblock && (
          <AdminButton size="sm" onClick={() => setOpen(true)}>
            Unblock
          </AdminButton>
        )}
        <AdminDialog open={open} onClose={close} title={`Unblock ${user.name}?`}>
          <UnblockForm user={user} onDone={close} />
        </AdminDialog>
      </span>
    );
  }
  return (
    <>
      {/* The title sits on a wrapper: a disabled button gets no pointer events, so it shows no tooltip itself. */}
      <span title={refusal}>
        <AdminButton size="sm" variant="danger" disabled={!!refusal} onClick={() => setOpen(true)}>
          Block user
        </AdminButton>
      </span>
      <AdminDialog open={open} onClose={close} title={`Block ${user.name}?`}>
        <BlockForm user={user} onDone={close} />
      </AdminDialog>
    </>
  );
}

function RoleForm({ user, onDone }: { user: Target; onDone: () => void }) {
  const [role, setRole] = useState(user.role);
  const { pending, error, run } = useUserAction(onDone);
  return (
    <form action={() => run(() => setUserRole({ userId: user.id, role }))}>
      <p className="mt-1.5 text-zinc-600">{user.email}</p>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Role</legend>
        {ROLES.map((r) => (
          <label
            key={r}
            className={cn(
              "flex cursor-pointer gap-3 rounded-md px-3 py-2.5 ring-1 ring-inset transition",
              r === role ? "bg-zinc-50 ring-zinc-900" : "ring-zinc-200 hover:ring-zinc-400",
            )}
          >
            <input type="radio" name="role" value={r} checked={r === role} onChange={() => setRole(r)} className="mt-0.5 accent-zinc-900" />
            <span>
              <span className="block font-medium">
                {ROLE_LABELS[r]}
                {r === user.role && <span className="font-normal text-zinc-400"> · current</span>}
              </span>
              <span className="block text-zinc-500">{ROLE_DESCRIPTIONS[r]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <ErrorText error={error} />
      <DialogActions>
        <AdminButton onClick={onDone}>Cancel</AdminButton>
        <AdminButton type="submit" variant="primary" disabled={pending || role === user.role}>
          {pending ? "Saving…" : "Save role"}
        </AdminButton>
      </DialogActions>
    </form>
  );
}

function BlockForm({ user, onDone }: { user: Target; onDone: () => void }) {
  const { pending, error, run } = useUserAction(onDone);
  return (
    <form action={(formData) => run(() => blockUser({ userId: user.id, reason: String(formData.get("reason") ?? "") }))}>
      <p className="mt-1.5 text-zinc-600">
        They are signed out immediately and can no longer sign in or submit anything. Their earlier submissions stay as they are. An admin can unblock them at any time.
      </p>
      <label htmlFor={`reason-${user.id}`} className="mt-4 mb-1 block text-xs text-zinc-500">
        Reason <span className="text-zinc-400">(optional, only visible to admins)</span>
      </label>
      <AdminTextarea id={`reason-${user.id}`} name="reason" rows={3} maxLength={500} placeholder="e.g. Repeated spam in the discussion." />
      <ErrorText error={error} />
      <DialogActions>
        <AdminButton onClick={onDone}>Cancel</AdminButton>
        <AdminButton type="submit" variant="destructive" disabled={pending}>
          {pending ? "Blocking…" : "Block user"}
        </AdminButton>
      </DialogActions>
    </form>
  );
}

function UnblockForm({ user, onDone }: { user: Target; onDone: () => void }) {
  const { pending, error, run } = useUserAction(onDone);
  return (
    <form action={() => run(() => unblockUser({ userId: user.id }))}>
      <p className="mt-1.5 text-zinc-600">They can sign in and submit again with their {user.role === "user" ? "" : `${ROLE_LABELS[user.role].toLowerCase()} `}account.</p>
      <ErrorText error={error} />
      <DialogActions>
        <AdminButton onClick={onDone}>Cancel</AdminButton>
        <AdminButton type="submit" variant="primary" disabled={pending}>
          {pending ? "Unblocking…" : "Unblock user"}
        </AdminButton>
      </DialogActions>
    </form>
  );
}
