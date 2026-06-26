"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AppNavProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/calendar", label: "Kalender", icon: "📅" },
  { href: "/contacts", label: "Kontakte", icon: "👥" },
  { href: "/wishlist", label: "Wunschliste", icon: "🎁" },
  { href: "/settings", label: "Einstellungen", icon: "⚙️" },
];

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="font-bold text-indigo-600 text-lg">
          Occasions
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
      {/* Mobile Nav */}
      <nav className="md:hidden flex border-t border-gray-100 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors min-w-[60px] ${
              pathname.startsWith(item.href) ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
