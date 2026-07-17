/**
 * Reusable statistics card component.
 */

import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  colorClass?: string;
}

export function StatCard({ label, value, colorClass = 'text-primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className={`text-2xl sm:text-3xl font-bold font-[Poppins] ${colorClass}`}>{value}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default StatCard;