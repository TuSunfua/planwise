import "server-only";

import { requireAccount } from "@/data/auth";
import { selectInbox } from "@/db/queries/projects";
import { NotFound, PermissionDenied } from "@/lib/errors";
import { getLogger } from "@/lib/logging";
import { hasPermission } from "@/lib/permissions";
import { getRequest } from "@/lib/request";
import type { ProjectSummary } from "@/lib/schemas/projects";

export async function getInbox(): Promise<ProjectSummary> {
  const account = await requireAccount();
  const inbox = await selectInbox(account.id);
  const { id } = await getRequest();
  const log = getLogger({ request_id: id, user_id: account.id });

  if (!inbox) {
    log.info("Inbox refused: no membership");
    throw new NotFound("No Inbox membership");
  }
  if (!hasPermission(inbox.role, "project:view")) {
    log.info(`Project ${inbox.id}: refused project:view`);
    throw new PermissionDenied("project:view");
  }
  return { id: inbox.id, kind: "inbox" };
}
