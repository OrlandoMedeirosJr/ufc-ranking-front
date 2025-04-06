'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  subtitle,
  className = '',
}: DashboardCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
} 