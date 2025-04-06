'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatarData } from '@/utils/formatadores';
import Link from 'next/link';

interface Evento {
  id: number;
  nome: string;
  data: string;
  _count?: {
    lutas: number;
  };
  lutas?: any[];
}

interface UltimosEventosProps {
  eventos: Evento[];
  loading?: boolean;
}

export function UltimosEventos({ eventos, loading = false }: UltimosEventosProps) {
  const contarLutas = (evento: Evento) => {
    if (evento._count?.lutas !== undefined) {
      return evento._count.lutas;
    }
    if (evento.lutas) {
      return evento.lutas.length;
    }
    return 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Últimos Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento disponível</p>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento) => (
              <Link
                href={`/eventos/${evento.id}`}
                key={evento.id}
                className="block hover:bg-gray-50 -mx-3 px-3 py-2 rounded-md transition-colors"
              >
                <h3 className="font-semibold text-sm">{evento.nome}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatarData(evento.data)}
                  </p>
                  <p className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    {contarLutas(evento)} lutas
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 