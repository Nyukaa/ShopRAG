// lib/auth.ts
import { NextRequest } from "next/server";
import { supabase } from "./supabase";

type Role = "admin" | "manager" | "staff";

export type AuthResult =
  | { ok: true; userId: string; role: Role }
  | { ok: false; error: string; status: number };

export async function getAuthUser(req: NextRequest): Promise<AuthResult> {
  // 1. Достаём токен — точно как в твоём checkAuth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "No token provided", status: 401 };
  }
  const token = authHeader.split(" ")[1];

  // 2. Проверяем токен — supabase.auth.getUser как в старом проекте
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, error: "Invalid token", status: 401 };
  }

  // 3. Получаем роль из user_roles таблицы
  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (roleError || !roleRow) {
    return { ok: false, error: "No role assigned", status: 403 };
  }

  return { ok: true, userId: data.user.id, role: roleRow.role as Role };
}

// Заменяет твой ручной if(!allowed) — чистый guard
export function requireRole(
  auth: AuthResult,
  allowed: Role[]
): Response | null {
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  if (!allowed.includes(auth.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  return null; // null = OK, продолжаем
}
