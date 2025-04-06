'use client';

import { useEffect, useState } from 'react';
import { Users, CalendarDays, Trophy, Dumbbell, BarChart } from 'lucide-react';
import { DashboardCard } from '@/components/DashboardCard';
import { UltimosEventos } from '@/components/UltimosEventos';
import { EstatisticasLutadores } from '@/components/EstatisticasLutadores';
import { CategoriasChart } from '@/components/CategoriasChart';
import { buildApiUrl } from '@/config/api';

interface Evento {
  id: number;
  nome: string;
  data: string;
  _count?: {
    lutas: number;
  };
}

interface RecordeItem {
  tipo: string;
  lutador: string;
  valor: number;
}

interface LutasCategoria {
  categoria: string;
  count: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    totalLutadores: 0,
    totalEventos: 0,
    totalLutas: 0,
    totalCategorias: 0,
  });
  const [ultimosEventos, setUltimosEventos] = useState<Evento[]>([]);
  const [recordes, setRecordes] = useState<RecordeItem[]>([]);
  const [lutasPorCategoria, setLutasPorCategoria] = useState<LutasCategoria[]>([]);

  // Buscar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Obter estatísticas gerais
        const [
          lutadoresRes,
          eventosRes,
          recordesRes
        ] = await Promise.all([
          fetch(buildApiUrl('lutadores'), { cache: 'no-store' }),
          fetch(buildApiUrl('eventos?finalizado=true'), { cache: 'no-store' }),
          fetch(buildApiUrl('recordes'), { cache: 'no-store' })
        ]);

        if (!lutadoresRes.ok || !eventosRes.ok || !recordesRes.ok) {
          throw new Error('Erro ao carregar dados do dashboard');
        }

        const lutadores = await lutadoresRes.json();
        const eventos = await eventosRes.json();
        const recordesData = await recordesRes.json();

        // Contagem de lutas
        let totalLutas = 0;

        try {
          // Obter contagem direta de lutas da API
          const lutasCountRes = await fetch(buildApiUrl('lutas/count'), { cache: 'no-store' });
          
          if (lutasCountRes.ok) {
            const { count } = await lutasCountRes.json();
            console.log(`Contagem de lutas retornada pela API: ${count}`);
            totalLutas = count;
          } else {
            console.log('API de contagem não retornou dados. Calculando manualmente...');
            
            // Se a API de contagem não estiver disponível, vamos contar das lutas dos eventos
            for (const evento of eventos) {
              if (evento._count?.lutas) {
                totalLutas += evento._count.lutas;
              }
            }
            
            // Se ainda estiver zerado, tentamos buscar todas as lutas e contar
            if (totalLutas === 0) {
              console.log('Tentando obter todas as lutas para contagem manual');
              try {
                const lutasRes = await fetch(buildApiUrl('lutas'), { cache: 'no-store' });
                if (lutasRes.ok) {
                  const todasLutas = await lutasRes.json();
                  totalLutas = todasLutas.length;
                  console.log(`Contagem manual de lutas: ${totalLutas}`);
                }
              } catch (lutasError) {
                console.error('Erro ao buscar todas as lutas:', lutasError);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao contar lutas:', error);
        }

        console.log(`Total final de lutas: ${totalLutas}`);

        // Conjunto de categorias ativas no ranking
        const categorias = new Set<string>();
        for (const lutador of lutadores) {
          if (lutador.categoriaAtual) {
            categorias.add(lutador.categoriaAtual);
          }
        }

        // Contagem de lutas por categoria
        const lutasPorCategoriaTemp: Record<string, number> = {};
        
        try {
          // Primeiro tentamos obter a contagem agregada do backend
          const categoriaStatsRes = await fetch(buildApiUrl('lutas/categorias/contagem'), { cache: 'no-store' });
          
          if (categoriaStatsRes.ok) {
            const categoriaStats = await categoriaStatsRes.json();
            console.log('Dados de categorias recebidos da API:', categoriaStats);
            
            // Filtrar para incluir apenas categorias com lutas
            const categoriasFiltradas = categoriaStats.filter(item => item.count > 0);
            console.log('Categorias filtradas (apenas com lutas):', categoriasFiltradas);
            
            // Se o backend retornar os dados, usamos eles
            setLutasPorCategoria(categoriasFiltradas);
          } else {
            console.log('API de contagem de categorias não retornou dados. Obtendo diretamente das lutas.');
            
            // Se não conseguiu da API específica, vamos buscar todas as lutas e contar manualmente
            try {
              const lutasRes = await fetch(buildApiUrl('lutas'), { cache: 'no-store' });
              
              if (lutasRes.ok) {
                const todasLutas = await lutasRes.json();
                console.log(`Obtidas ${todasLutas.length} lutas para contar categorias`);
                
                // Contar manualmente por categoria
                const contagemCategorias: Record<string, number> = {};
                
                for (const luta of todasLutas) {
                  const categoria = luta.categoria || 'Categoria não especificada';
                  contagemCategorias[categoria] = (contagemCategorias[categoria] || 0) + 1;
                }
                
                const chartData = Object.entries(contagemCategorias)
                  .filter(([_, count]) => count > 0) // Filtrar apenas categorias com lutas
                  .map(([categoria, count]) => ({
                    categoria,
                    count
                  }));
                
                console.log('Contagem manual por categoria:', chartData);
                setLutasPorCategoria(chartData);
              } else {
                // Se não conseguir dados reais, não exibe nada em vez de mostrar dados fictícios
                console.log('Não foi possível obter dados de lutas. Exibindo gráfico vazio.');
                setLutasPorCategoria([]);
              }
            } catch (error) {
              console.error('Erro ao obter e contar lutas:', error);
              setLutasPorCategoria([]);
            }
          }
        } catch (error) {
          console.error('Erro ao obter contagem por categoria:', error);
          setLutasPorCategoria([]);
        }

        // Atualizar estatísticas gerais
        setEstatisticas({
          totalLutadores: lutadores.length,
          totalEventos: eventos.length,
          totalLutas,
          totalCategorias: categorias.size,
        });

        // Atualizar últimos eventos (limitando a 3)
        setUltimosEventos(eventos.slice(0, 3));

        // Atualizar recordes
        setRecordes(recordesData);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Cards com totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Lutadores"
          value={loading ? '...' : estatisticas.totalLutadores}
          icon={<Users />}
        />
        <DashboardCard
          title="Total de Eventos"
          value={loading ? '...' : estatisticas.totalEventos}
          icon={<CalendarDays />}
        />
        <DashboardCard
          title="Total de Lutas"
          value={loading ? '...' : estatisticas.totalLutas}
          icon={<Dumbbell />}
        />
        <DashboardCard
          title="Categorias Ativas"
          value={loading ? '...' : estatisticas.totalCategorias}
          icon={<Trophy />}
        />
      </div>

      {/* Segunda linha com gráficos e estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estatísticas de recordes */}
        <div>
          <EstatisticasLutadores recordes={recordes} loading={loading} />
        </div>

        {/* Gráfico de lutas por categoria */}
        <div className="md:col-span-2">
          <CategoriasChart dados={lutasPorCategoria} loading={loading} />
        </div>
      </div>

      {/* Terceira linha com últimos eventos */}
      <div className="mt-6">
        <UltimosEventos eventos={ultimosEventos} loading={loading} />
      </div>
    </div>
  );
} 