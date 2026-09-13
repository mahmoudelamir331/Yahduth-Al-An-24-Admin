import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

type AuditInput = {
  actorId: string | null;
  action: string;
  request: Request | NextRequest;
  targetType?: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

/** Best-effort, server-only audit write. Never include credentials, tokens, or request bodies. */
export async function writeAuditLog(input: AuditInput) {
  const forwardedFor = input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source = forwardedFor || input.request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.AUDIT_LOG_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "audit";
  const ipHash = createHash("sha256").update(`${salt}:${source}`).digest("hex");
  try {
    await createServiceClient().from("audit_logs").insert({
      actor_id: input.actorId,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      request_method: input.request.method,
      ip_hash: ipHash,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Logging must not disclose internals or turn a completed safe operation into a 500.
  }
}
