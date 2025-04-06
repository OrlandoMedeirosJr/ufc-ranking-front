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
        // Obter estatísticas do dashboard - abordagem direta sem funções intermediárias
        try {
          // URL direta para o endpoint
          const urlDireta = 'http://localhost:3334/dashboard/estatisticas';
          console.log(`Tentando obter estatísticas do dashboard diretamente: ${urlDireta}`);
          
          const dashboardStatsRes = await fetch(urlDireta, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!dashboardStatsRes.ok) {
            console.error(`Erro na API dashboard/estatisticas: ${dashboardStatsRes.status}`);
            // Continuar sem essa API, vamos usar o fallback
          } else {
            // Obter estatísticas do dashboard
            const dashboardStats = await dashboardStatsRes.json();
            console.log('Estatísticas obtidas do endpoint:', dashboardStats);
            
            // Atualizar estado com estatísticas do dashboard
            if (dashboardStats) {
              setEstatisticas({
                totalLutadores: dashboardStats.totalLutadores || 0,
                totalEventos: dashboardStats.totalEventos || 0,
                totalLutas: dashboardStats.totalLutas || 0,
                totalCategorias: dashboardStats.totalCategorias || 0,
              });
              
              console.log('Estatísticas do dashboard atualizadas com dados');
            }
          }
        } catch (dashboardError) {
          console.error('Erro ao obter estatísticas do dashboard:', dashboardError);
          // Continuar sem essa API, vamos usar o fallback
        }

        // Obter eventos - abordagem direta 
        let eventos = [];
        try {
          // URL direta para eventos
          const eventosUrl = 'http://localhost:3334/eventos?finalizado=true';
          console.log(`Tentando obter eventos diretamente: ${eventosUrl}`);
          
          const eventosRes = await fetch(eventosUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (eventosRes.ok) {
            eventos = await eventosRes.json();
            console.log(`Obtidos ${eventos.length} eventos`);
          } else {
            console.error(`Erro na API eventos: ${eventosRes.status}`);
          }
        } catch (eventosError) {
          console.error('Erro ao obter eventos:', eventosError);
        }
        
        // Obter recordes - abordagem direta
        let recordesData = [];
        try {
          // URL direta para recordes
          const recordesUrl = 'http://localhost:3334/recordes';
          console.log(`Tentando obter recordes diretamente: ${recordesUrl}`);
          
          const recordesRes = await fetch(recordesUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (recordesRes.ok) {
            recordesData = await recordesRes.json();
            console.log(`Obtidos ${recordesData.length} recordes`);
          } else {
            console.error(`Erro na API recordes: ${recordesRes.status}`);
          }
        } catch (recordesError) {
          console.error('Erro ao obter recordes:', recordesError);
        }

        // Contagem de lutas - abordagem direta
        let totalLutas = 0;
        try {
          // URL direta para contagem de lutas
          const countUrl = 'http://localhost:3334/lutas/count';
          console.log(`Tentando obter contagem de lutas diretamente: ${countUrl}`);
          
          const lutasCountRes = await fetch(countUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
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
                const lutasUrl = 'http://localhost:3334/lutas';
                console.log(`Buscando lutas diretamente: ${lutasUrl}`);
                
                const lutasRes = await fetch(lutasUrl, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  cache: 'no-store',
                  mode: 'cors',
                  credentials: 'omit'
                });
                
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

        // Obter lutadores para contagem de categorias - abordagem direta
        try {
          const lutadoresUrl = 'http://localhost:3334/lutadores';
          console.log(`Buscando lutadores diretamente: ${lutadoresUrl}`);
          
          const lutadoresRes = await fetch(lutadoresUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (lutadoresRes.ok) {
            const lutadores = await lutadoresRes.json();
            
            // Conjunto de categorias ativas no ranking
            const categorias = new Set<string>();
            for (const lutador of lutadores) {
              if (lutador.categoriaAtual) {
                categorias.add(lutador.categoriaAtual);
              }
            }
            
            // Atualizar estatísticas com os dados obtidos diretamente
            setEstatisticas(prevState => ({
              ...prevState,
              totalLutadores: lutadores.length,
              totalCategorias: categorias.size,
            }));
            
            console.log(`Dados de lutadores obtidos: ${lutadores.length} lutadores, ${categorias.size} categorias`);
          }
        } catch (error) {
          console.error('Erro ao buscar lutadores:', error);
        }

        // Contagem de lutas por categoria - abordagem direta
        try {
          // URL direta para contagem por categoria
          const categoriaUrl = 'http://localhost:3334/lutas/categorias/contagem';
          console.log(`Buscando contagem por categoria diretamente: ${categoriaUrl}`);
          
          const categoriaStatsRes = await fetch(categoriaUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
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
              const lutasUrl = 'http://localhost:3334/lutas';
              console.log(`Buscando lutas diretamente para contagem de categorias: ${lutasUrl}`);
              
              const lutasRes = await fetch(lutasUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                cache: 'no-store',
                mode: 'cors',
                credentials: 'omit'
              });
              
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

        // Atualizar estatísticas gerais com a contagem correta de lutas
        setEstatisticas(prevState => ({
          ...prevState,
          totalEventos: eventos.length || 0,
          totalLutas: totalLutas || 0, // Garantir que nunca seja undefined
        }));

        console.log('Estatísticas finais atualizadas no dashboard:', {
          totalLutadores: estatisticas.totalLutadores || 0,
          totalEventos: eventos.length || 0,
          totalLutas: totalLutas || 0,
          totalCategorias: estatisticas.totalCategorias || 0,
        });

        // Atualizar últimos eventos (limitando a 3)
        if (eventos && eventos.length > 0) {
          setUltimosEventos(eventos.slice(0, 3));
        } else {
          setUltimosEventos([]);
        }

        // Atualizar recordes
        if (recordesData && recordesData.length > 0) {
          setRecordes(recordesData);
        } else {
          setRecordes([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        // Continuar exibindo o que for possível
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