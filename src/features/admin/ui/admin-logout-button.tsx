"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      className="logout-button"
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          await fetch("/api/admin/logout", { method: "POST" });
          await signOut({ redirectTo: "/login" });
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <LogOut size={15} />
      {isLoading ? "Выходим..." : "Выйти"}
    </button>
  );
}
