"use client";

import { useRouter } from "next/navigation";
import { api } from "./api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await api("/auth/logout", { method: "POST" }).catch(() => null);
        router.replace("/admin/login");
        router.refresh();
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-sand"
    >
      Sign out
    </button>
  );
}
