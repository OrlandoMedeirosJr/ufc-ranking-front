"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/eventos", label: "Eventos" },
  { href: "/ranking/peso-por-peso", label: "Ranking" },
  { href: "/recordes", label: "Recordes" },
  { href: "/lutadores", label: "Lutadores" },
  { href: "/admin", label: "⚙️ Admin" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 px-6 py-4 shadow border-b items-center bg-white">
      <h1 className="text-xl font-bold">🏆 UFC Ranking System</h1>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium hover:underline",
            pathname === item.href || pathname.startsWith(`${item.href}/`) 
              ? "text-black" 
              : "text-gray-500"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
