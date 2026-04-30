// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      // Ждём пока Supabase восстановит сессию из URL hash (после Google redirect)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Подождём ещё раз — иногда сессия приходит чуть позже
        const { data } = await supabase.auth.refreshSession();
        if (!data.session) {
          router.replace("/login");
          return;
        }
      }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id)
        .single();

      if (!roleRow || roleRow.role === "staff") {
        router.replace("/");
        return;
      }

      setChecking(false);
    }

    // Слушаем изменения сессии (срабатывает после Google redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkAccess();
    });

    checkAccess();

    return () => subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-zinc-500 text-sm animate-pulse">Checking access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Admin nav */}
      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-sky-400">Admin Panel</span>

          <nav className="border-b border-zinc-800">
            <div className="flex items-center gap-6">
              <span className="font-bold text-sky-400">Admin Panel</span>

              <Link
                href="/admin"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Products
              </Link>

              <Link
                href="/"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Home
              </Link>
            </div>
          </nav>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
