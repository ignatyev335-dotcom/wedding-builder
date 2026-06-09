"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      className="logout-button"
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      <LogOut size={15} />
      Выйти
    </button>
  );
}
