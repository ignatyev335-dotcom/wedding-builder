import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function writeAdminAuditLog({
  actor,
  action,
  targetType,
  targetId,
  description,
  metadata,
}: {
  actor?: { id?: string | null; email?: string | null } | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        action,
        targetType,
        targetId: targetId ?? null,
        description: description ?? "",
        metadata,
      },
    });
  } catch (error) {
    console.error("Admin audit log failed", error);
  }
}
