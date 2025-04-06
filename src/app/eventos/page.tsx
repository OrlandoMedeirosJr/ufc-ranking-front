'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, CalendarDays, Filter, CheckCircle, X, Search } from 'lucide-react';
import CardEvento from '@/components/CardEvento';
import { buildApiUrl } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Evento {
  id: number;
  nome: string;
  data: string;
  local: string;
  pais: string;
  finalizado: boolean;
  publicoTotal: number | null;
  arrecadacao: number | null;
  payPerView: number | null;
  _count?: {
    lutas: number;
  };
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [buscando, setBuscando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    const carregarEventos = async () => {
      setLoading(true);
      
      try {
        // Buscar apenas eventos finalizados, agendados ou todos com base no filtro
        let queryParams = '';
        if (filtro === 'finalizados') {
          queryParams = '?finalizado=true';
        } else if (filtro === 'agendados') {
          queryParams = '?finalizado=false';
        }
        
        // Adicionar termo de busca se houver
        if (termoBusca.trim()) {
          const separador = queryParams ? '&' : '?';
          queryParams += `${separador}nome=${encodeURIComponent(termoBusca.trim())}`;
        }
        
        // URL direta para a API de eventos
        const url = `http://localhost:3334/eventos${queryParams}`;
        console.log(`Buscando eventos diretamente: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          console.error(`Erro na resposta da API: ${response.status} - ${response.statusText}`);
          throw new Error(`Erro ao buscar eventos: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Eventos carregados com sucesso: ${data.length} eventos`);
        setEventos(data);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        
        // Tentar recuperar dados de outra maneira se a primeira tentativa falhar
        try {
          console.log('Tentando abordagem alternativa para buscar eventos...');
          const fallbackUrl = `http://localhost:3334/eventos${filtro === 'finalizados' ? '?finalizado=true' : filtro === 'agendados' ? '?finalizado=false' : ''}`;
          
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log(`Recuperação bem-sucedida: ${fallbackData.length} eventos carregados via fallback`);
            
            // Se estiver buscando, filtre manualmente
            if (termoBusca.trim()) {
              const termoBuscaLower = termoBusca.trim().toLowerCase();
              const eventosFiltrados = fallbackData.filter(
                (evento: Evento) => evento.nome.toLowerCase().includes(termoBuscaLower)
              );
              setEventos(eventosFiltrados);
              console.log(`Filtrado para ${eventosFiltrados.length} eventos que correspondem à busca: "${termoBusca}"`);
            } else {
              setEventos(fallbackData);
            }
          } else {
            console.error('Falha também na abordagem alternativa');
            setEventos([]);
          }
        } catch (fallbackError) {
          console.error('Erro na abordagem alternativa:', fallbackError);
          setEventos([]);
        }
      } finally {
        setLoading(false);
        setBuscando(false);
      }
    };
    
    carregarEventos();
  }, [filtro, buscando, termoBusca]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Eventos UFC</h1>
          <p className="text-muted-foreground">
            Visualize todos os eventos ou adicione um novo
          </p>
        </div>
        
        <Link href="/eventos/novo">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Novo Evento</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex border rounded-md p-1 bg-gray-50">
          <button
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${
              filtro === 'todos' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setFiltro('todos')}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Todos</span>
          </button>
          
          <button
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${
              filtro === 'agendados' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setFiltro('agendados')}
          >
            <Filter className="h-4 w-4" />
            <span>Agendados</span>
          </button>
          
          <button
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${
              filtro === 'finalizados' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setFiltro('finalizados')}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Finalizados</span>
          </button>
        </div>
        
        <form onSubmit={handleBuscar} className="flex-1 flex max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome..."
              className="w-full border rounded-l-md py-2 px-3 pl-9 text-sm"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {termoBusca && (
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setTermoBusca('');
                  if (termoBusca) setBuscando(true);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="rounded-l-none px-4">
            Buscar
          </Button>
        </form>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg shadow overflow-hidden">
              <Skeleton className="w-full h-6" />
              <div className="p-4 space-y-4">
                <Skeleton className="w-full h-5" />
                <div className="space-y-2">
                  <Skeleton className="w-3/4 h-4" />
                  <Skeleton className="w-2/3 h-4" />
                  <Skeleton className="w-1/2 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {eventos.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">
                {termoBusca
                  ? `Nenhum evento encontrado para "${termoBusca}"`
                  : filtro === 'todos'
                  ? 'Nenhum evento cadastrado'
                  : filtro === 'agendados'
                  ? 'Não há eventos agendados'
                  : 'Não há eventos finalizados'}
              </p>
              <Link href="/eventos/novo">
                <Button>Cadastrar Evento</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map((evento) => (
                <CardEvento
                  key={evento.id}
                  id={evento.id}
                  nome={evento.nome}
                  data={evento.data}
                  local={evento.local}
                  pais={evento.pais}
                  finalizado={evento.finalizado}
                  lutas={evento._count?.lutas}
                  publicoTotal={evento.publicoTotal || undefined}
                  arrecadacao={evento.arrecadacao || undefined}
                  payPerView={evento.payPerView || undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 