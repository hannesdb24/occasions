"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  {
    href: "/dashboard",
    label: "Start",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "Personen",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    href: "/occasions",
    label: "Anlässe",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12.127 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.125"/><path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/>
      </svg>
    ),
  },
  {
    href: "/wishlist",
    label: "Geschenke",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Profil",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
      </svg>
    ),
  },
];

function getAvatarColor(name: string | null | undefined): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
  return colors[idx];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const avatarColor = getAvatarColor(user.name);
  const initial = user.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-card border-r border-[rgba(28,25,22,0.08)] h-screen sticky top-0 z-40">
        <div className="p-8">
          <Link href="/dashboard" aria-label="Occasions — Dashboard" className="no-underline mb-12 inline-flex">
            <span className="inline-flex flex-col items-center leading-none text-[var(--foreground)]">
              <span className="font-serif font-medium tracking-tight text-[22px]">Occasions</span>
              <span aria-hidden="true" className="mt-1.5 h-px w-2/3 bg-[#c4704a] opacity-80" />
            </span>
          </Link>

          <nav className="flex flex-col gap-1 mt-6">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <div key={item.href} className="flex items-center gap-1 group/row">
                  <Link
                    href={item.href}
                    className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-full text-sm font-medium transition-considered ${
                      isActive
                        ? "bg-[var(--foreground)] text-[var(--card)]"
                        : "text-[rgba(28,25,22,0.7)] hover:bg-[rgba(28,25,22,0.05)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-[rgba(28,25,22,0.08)]">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="rounded-full flex items-center justify-center text-white shrink-0 font-serif font-medium tracking-tight"
              style={{ width: 40, height: 40, fontSize: 16.8, backgroundColor: avatarColor }}
            >
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{user.name}</span>
              <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{user.email}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-full text-xs font-medium transition-considered hover:bg-[rgba(28,25,22,0.05)]"
            style={{ color: "rgba(28,25,22,0.6)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            </svg>
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card/95 backdrop-blur-lg border-t border-[rgba(28,25,22,0.08)] pb-safe z-50 px-2 py-2 flex justify-between items-center">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 w-16"
            >
              <div className={`px-3 py-1.5 rounded-full transition-considered ${isActive ? "bg-[var(--foreground)] text-[var(--card)]" : "text-[rgba(28,25,22,0.6)]"}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-medium transition-considered ${isActive ? "text-[var(--foreground)]" : "text-[rgba(28,25,22,0.5)]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
