"use client";

import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  return (
    <button
      className="logout-button"
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      <LogOut size={15} />
      Выйти
    </button>
  );
}
