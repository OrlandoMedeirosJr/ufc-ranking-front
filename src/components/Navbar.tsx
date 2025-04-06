"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Users, Award, BarChart, Settings, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/eventos", label: "Eventos", icon: BarChart },
  { href: "/ranking/peso-por-peso", label: "Ranking", icon: Trophy },
  { href: "/recordes", label: "Recordes", icon: Award },
  { href: "/lutadores", label: "Lutadores", icon: Users },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="flex h-16 max-w-7xl mx-auto px-4 sm:px-6 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-ranking-gold-dark" />
            <span className="font-bold text-xl">UFC Ranking</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              pathname === item.href || 
              pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={item.label}
              >
                <Icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-gray-400"
                )} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
