"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/eventos", label: "Eventos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/recordes", label: "Recordes" },
  { href: "/lutadores", label: "Lutadores" },
];

export function Navbar() {
  const pathname = usePathname();
  
  // Função simplificada para verificar se um item está ativo
  const isActive = (href: string): boolean => {
    if (pathname === href) return true;
    if (href === '/ranking' && pathname?.startsWith('/ranking/')) return true;
    if (pathname?.startsWith(`${href}/`)) return true;
    return false;
  };

  return (
    <nav className="flex gap-6 px-6 py-4 shadow border-b items-center bg-white">
      <h1 className="text-xl font-bold">🏆 UFC Ranking System</h1>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={true}
          className={cn(
            "text-sm font-medium hover:underline",
            isActive(item.href) ? "text-black" : "text-gray-500"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
