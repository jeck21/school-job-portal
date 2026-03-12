"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthIndicator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth state changes to keep session in sync
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) return null;
  if (!user) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/for-schools/dashboard"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Dashboard
      </Link>
      <button
        onClick={handleLogout}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Log Out
      </button>
    </div>
  );
}
