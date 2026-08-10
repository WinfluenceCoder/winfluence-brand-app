import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MESSAGE_TYPES = ["system", "user", "moderator"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];
export type MessagePrio = "high" | "normal" | "low";
export type MessageStatus = "new" | "read" | "deleted";

export type MessageRow = {
  id: number;
  type: MessageType;
  prio: MessagePrio;
  from_user_id: string | null;
  to_user_id: string;
  subject: string | null;
  body: string | null;
  status: MessageStatus;
  sent_at: string | null;
  updated_at: string | null;
};

export type MessageSender = {
  name: string | null;
  photoUrl: string | null;
};

export type MessageListItem = MessageRow & { sender: MessageSender | null };

// The generated Supabase types do not include `messages` yet; cast locally.
const messagesTable = () => (supabase as unknown as {
  from: (table: string) => any;
}).from("messages");

/** Turn a Supabase error into a readable message incl. details/hint/code. */
export function describeMessagesError(error: unknown): string {
  if (!error) return "Unbekannter Fehler";
  const e = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  const parts = [e.message, e.details, e.hint].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  const text = parts.length > 0 ? parts.join(" – ") : String(error);
  return e.code ? `${text} (Code ${e.code})` : text;
}

function normalizeRow(row: Record<string, unknown>): MessageRow {
  const rawType = String(row.type ?? "");
  const type = (MESSAGE_TYPES as readonly string[]).includes(rawType)
    ? (rawType as MessageType)
    : "system";
  const rawPrio = String(row.prio ?? "");
  const prio: MessagePrio =
    rawPrio === "high" || rawPrio === "low" ? rawPrio : "normal";
  const rawStatus = String(row.status ?? "");
  const status: MessageStatus =
    rawStatus === "read" || rawStatus === "deleted"
      ? (rawStatus as MessageStatus)
      : "new";

  return {
    id: Number(row.id),
    type,
    prio,
    status,
    from_user_id: (row.from_user_id as string | null) ?? null,
    to_user_id: String(row.to_user_id ?? ""),
    subject: (row.subject as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error(
      error ? describeMessagesError(error) : "Nicht angemeldet",
    );
  }
  return data.user.id;
}

async function resolveSenders(
  userIds: string[],
): Promise<Map<string, MessageSender>> {
  const map = new Map<string, MessageSender>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("creators")
    .select("user_id, nick_name, first_name, last_name, foto_url")
    .in("user_id", userIds);

  if (error) {
    console.error("[messages] sender lookup failed", error);
    return map;
  }

  for (const row of data ?? []) {
    if (!row.user_id) continue;
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    map.set(row.user_id, {
      name: row.nick_name?.trim() || fullName || null,
      photoUrl: row.foto_url ?? null,
    });
  }
  return map;
}

export function messagesListQueryOptions(params: { type?: MessageType } = {}) {
  return queryOptions({
    queryKey: ["messages", "list", params.type ?? "all"] as const,
    queryFn: async (): Promise<MessageListItem[]> => {
      const userId = await currentUserId();

      let query = messagesTable()
        .select(
          "id, type, prio, from_user_id, to_user_id, subject, body, status, sent_at, updated_at",
        )
        .eq("to_user_id", userId)
        .neq("status", "deleted")
        .order("sent_at", { ascending: false });

      if (params.type) query = query.eq("type", params.type);

      const { data, error } = await query;
      if (error) {
        console.error("[messages] list failed", error);
        throw new Error(describeMessagesError(error));
      }

      const rows = ((data ?? []) as Record<string, unknown>[]).map(normalizeRow);
      const senderIds = Array.from(
        new Set(
          rows
            .filter((r) => r.type === "user" && r.from_user_id)
            .map((r) => r.from_user_id as string),
        ),
      );
      const senders = await resolveSenders(senderIds);

      return rows.map((row) => ({
        ...row,
        sender: row.from_user_id ? senders.get(row.from_user_id) ?? null : null,
      }));
    },
  });
}

export function unreadCountsQueryOptions() {
  return queryOptions({
    queryKey: ["messages", "unread"] as const,
    queryFn: async (): Promise<Record<MessageType, number> & { all: number }> => {
      const userId = await currentUserId();
      const { data, error } = await messagesTable()
        .select("type")
        .eq("to_user_id", userId)
        .eq("status", "new");

      const counts = { all: 0, system: 0, user: 0, moderator: 0 };
      if (error) {
        console.error("[messages] unread counts failed", error);
        return counts;
      }
      for (const row of (data ?? []) as { type: MessageType }[]) {
        counts.all += 1;
        if (row.type in counts) counts[row.type] += 1;
      }
      return counts;
    },
  });
}

export async function setMessageStatus(
  id: number,
  status: MessageStatus,
): Promise<void> {
  const { error } = await messagesTable().update({ status }).eq("id", id);
  if (error) {
    console.error("[messages] status update failed", error);
    throw new Error(describeMessagesError(error));
  }
}
