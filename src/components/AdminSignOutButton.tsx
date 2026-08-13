"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin-login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      className="admin-sidebar-signout"
      onClick={signOut}
      disabled={signingOut}
    >
      {signingOut ? "Loggar ut..." : "Logga ut"}
    </button>
  );
}
