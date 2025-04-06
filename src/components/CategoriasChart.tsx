'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LutasCategoria {
  categoria: string;
  count: number;
}

interface CategoriasChartProps {
  dados: LutasCategoria[];
  loading?: boolean;
}

export function CategoriasChart({ dados, loading = false }: CategoriasChartProps) {
  // Encontrar o valor máximo para definir a escala do gráfico
  const maxValue = useMemo(() => {
    if (!dados.length) return 0;
    return Math.max(...dados.map((item) => item.count));
  }, [dados]);

  // Cores para o gráfico
  const corBarras = 'bg-blue-600';
  
  // Simplificar nome das categorias
  const simplificarNomeCategoria = (categoria: string) => {
    return categoria
      .replace('Peso ', '')
      .replace(' Feminino', ' Fem.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lutas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-8 bg-gray-200 animate-pulse rounded-md" />
            ))}
          </div>
        ) : dados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        ) : (
          <div className="space-y-2">
            {dados.map((item) => (
              <div key={item.categoria} className="flex items-center space-x-2">
                <p className="text-xs font-medium w-24 truncate" title={item.categoria}>
                  {simplificarNomeCategoria(item.categoria)}
                </p>
                <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                  <div
                    className={`absolute top-0 left-0 h-full ${corBarras} transition-all duration-500`}
                    style={{
                      width: `${maxValue ? (item.count / maxValue) * 100 : 0}%`,
                    }}
                  />
                  <span className="absolute text-xs font-semibold right-2 top-1.5 text-gray-700">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 