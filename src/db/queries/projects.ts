import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { projectMembers, projects } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { Role } from "@/lib/permissions";

// Safe to repeat: the partial unique indexes turn a second Inbox or owner into a no-op.
export async function ensureInbox(userId: string): Promise<void> {
  const now = new Date();

  await getDb().transaction(async (tx) => {
    await tx
      .insert(projects)
      .values({ id: newId(), kind: "inbox", createdBy: userId, createdAt: now, updatedAt: now })
      .onConflictDoNothing();
    const inbox = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.createdBy, userId), eq(projects.kind, "inbox")));
    if (!inbox[0]) return;
    await tx
      .insert(projectMembers)
      .values({ projectId: inbox[0].id, userId, role: "owner", createdAt: now, updatedAt: now })
      .onConflictDoNothing();
  });
}

export async function selectInbox(userId: string): Promise<{ id: string; role: Role } | null> {
  const [row] = await getDb()
    .select({ id: projects.id, role: projectMembers.role })
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.userId, userId), eq(projects.createdBy, userId), eq(projects.kind, "inbox")));
  return row ?? null;
}
