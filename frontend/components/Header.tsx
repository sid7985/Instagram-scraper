"use client";

import { BadgeCheck, Instagram } from "lucide-react";

interface HeaderProps {
  loggedIn: boolean;
  onManageSession: () => void;
}

export default function Header({ loggedIn, onManageSession }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <Instagram className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Instagram Analytics
          </h1>
          <p className="text-xs text-gray-400">Dashboard Pro</p>
        </div>
      </div>

      <button
        onClick={onManageSession}
        className="card flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-[#222222]"
        title="Manage your Instagram session"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loggedIn ? "bg-success" : "bg-danger"
          }`}
        />
        {loggedIn ? (
          <>
            <BadgeCheck className="h-4 w-4 text-success" />
            Logged In
          </>
        ) : (
          "Session Required"
        )}
      </button>
    </header>
  );
}
