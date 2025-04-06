'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface RecordeItem {
  tipo: string;
  lutador: string;
  valor: number;
}

interface EstatisticasLutadoresProps {
  recordes: RecordeItem[];
  loading?: boolean;
}

export function EstatisticasLutadores({ recordes, loading = false }: EstatisticasLutadoresProps) {
  // Filtrar apenas recordes relacionados a lutadores
  const filteredRecordes = recordes.filter(
    (recorde) => recorde.lutador && recorde.tipo.includes('Mais')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Destaques</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-5 bg-gray-200 animate-pulse rounded w-1/3" />
                <div className="h-5 bg-gray-200 animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRecordes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma estatística disponível</p>
        ) : (
          <div className="space-y-3">
            {filteredRecordes.map((recorde) => (
              <div key={recorde.tipo} className="flex justify-between items-center">
                <span className="text-sm font-medium">{recorde.tipo}</span>
                <Link 
                  href={`/lutadores?nome=${encodeURIComponent(recorde.lutador)}`}
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  {recorde.lutador} 
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                    {recorde.valor}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 