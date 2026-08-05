"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  History,
  Instagram,
  LayoutDashboard,
  Menu,
  Settings,
  Terminal,
  X,
} from "lucide-react";

interface HeaderProps {
  loggedIn: boolean;
  onManageSession: () => void;
  activeView: "dashboard" | "settings";
  onNavigate: (view: "dashboard" | "settings") => void;
}

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export default function Header({ loggedIn, onManageSession, activeView, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 lg:px-margin-desktop h-14 sm:h-16 w-full bg-background/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-2 sm:gap-md min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-xs text-on-surface-variant hover:text-primary transition-colors shrink-0"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <h1 className="text-headline-sm sm:text-headline-md font-bold text-on-background tracking-tight truncate">
            Instagram Analytics
          </h1>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button
            onClick={onManageSession}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container-high"
            title="Manage session"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                loggedIn ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-danger"
              }`}
            />
            {loggedIn ? (
              <>
                <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                <span className="hidden sm:inline">Logged In</span>
              </>
            ) : (
              <span className="hidden xs:inline">Session Required</span>
            )}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface pt-20 pb-lg z-40">
        <div className="px-md mb-lg">
          <h2 className="text-headline-sm text-on-surface">Pro Analytics</h2>
          <p className="text-label-md text-on-surface-variant mt-xs">Agency Account</p>
        </div>
        <div className="flex-1 flex flex-col gap-xs px-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-base px-md py-sm rounded-r-lg transition-all ${
                  isActive
                    ? "text-primary border-l-2 border-primary bg-primary/10"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <item.icon
                  className="h-5 w-5"
                  style={isActive ? { fill: "currentColor" } : undefined}
                />
                <span className="text-label-md">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="px-md mt-auto">
          <button className="w-full py-sm bg-transparent border border-outline-variant text-on-surface text-label-md rounded hover:border-on-surface transition-colors">
            Upgrade Plan
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-outline-variant flex flex-col pt-6 pb-lg"
            >
              <div className="flex items-center justify-between px-md mb-lg">
                <div>
                  <h2 className="text-headline-sm text-on-surface">Pro Analytics</h2>
                  <p className="text-label-md text-on-surface-variant mt-xs">Agency Account</p>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-xs px-sm">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileOpen(false);
                      }}
                      className={`flex items-center gap-base px-md py-sm rounded-r-lg transition-all ${
                        isActive
                          ? "text-primary border-l-2 border-primary bg-primary/10"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <item.icon
                        className="h-5 w-5"
                        style={isActive ? { fill: "currentColor" } : undefined}
                      />
                      <span className="text-label-md">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
