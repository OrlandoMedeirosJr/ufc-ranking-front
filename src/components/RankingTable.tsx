'use client';

import React, { useState } from 'react';
import LutadorModal from './LutadorModal';
import { 
  getRankingColorClass, 
  getRankingColorDescription 
} from '@/utils/rankingColors';
import { buildApiUrl } from '@/config/api';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';

interface Lutador {
  nome: string;
  apelido: string | null;
  pais: string;
  id: number;
}

interface RankingItem {
  id: number;
  lutadorId: number;
  posicao: number;
  pontos: number;
  corFundo: string;
  variacao: number;
  lutador: Lutador | null;
}

interface EstatisticasLutador {
  nome: string;
  pais: string;
  sexo: string;
  totalLutas: number;
  vitorias: number;
  derrotas: number;
  nocautes: number;
  finalizacoes: number;
  decisoes: number;
  bonus: number;
  vitoriasTitulo: number;
}

interface RankingTableProps {
  dados: RankingItem[];
  categoria: string;
  categoriaTitulo: string;
  corBackgroundMap?: Record<string, string>;
}

const RankingTable: React.FC<RankingTableProps> = ({ 
  dados, 
  categoria,
  categoriaTitulo,
  corBackgroundMap = {}
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [lutadorSelecionado, setLutadorSelecionado] = useState<number | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasLutador | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<number | null>(null);

  const abrirModal = async (lutadorId: number) => {
    if (!lutadorId) return;
    
    setLutadorSelecionado(lutadorId);
    setEstatisticas(null);
    setCarregando(true);
    setModalAberto(true);
    
    try {
      let url = '';
      if (categoria === 'peso-por-peso') {
        // Se estiver no ranking peso-por-peso, busca estatísticas gerais
        url = buildApiUrl(`lutadores/${lutadorId}/estatisticas`);
      } else {
        // Para outras categorias, busca estatísticas específicas da categoria
        const categoriaFormatada = categoriaTitulo;
        url = buildApiUrl(`lutadores/${lutadorId}/estatisticas/${encodeURIComponent(categoriaFormatada)}`);
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }
      const data = await response.json();
      setEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setCarregando(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setLutadorSelecionado(null);
  };
  
  const showTooltip = (index: number) => {
    setTooltipPos(index);
  };
  
  const hideTooltip = () => {
    setTooltipPos(null);
  };

  return (
    <div className="ranking-category">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold">{categoriaTitulo}</h2>
        <div className="relative ml-2">
          <button 
            className="text-gray-400 hover:text-gray-600"
            onMouseEnter={() => showTooltip(-1)}
            onMouseLeave={hideTooltip}
          >
            <Info className="h-4 w-4" />
          </button>
          {tooltipPos === -1 && (
            <div className="absolute z-50 left-full top-0 ml-2 w-64 p-2 bg-white shadow-lg rounded text-sm">
              <p className="font-semibold mb-1">Legenda de cores:</p>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-ranking-gold-dark rounded-full mr-2"></div>
                <span>Campeão com mais de 10 lutas</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-ranking-gold-light rounded-full mr-2"></div>
                <span>Campeão ou Top 5 no Peso por Peso</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-ranking-blue-dark rounded-full mr-2"></div>
                <span>Top 6-15 (PPP) ou Top 2-5 (categoria)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-ranking-blue-light rounded-full mr-2"></div>
                <span>Top 6-15 em categoria específica</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="w-16 text-center">Pos.</th>
              <th>Lutador</th>
              <th className="text-right w-24">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item, index) => {
              const colorClass = corBackgroundMap[item.corFundo] || 
                getRankingColorClass(item.posicao, item.lutador?.totalLutas || 0, categoria, item.lutador?.sexo);
                
              const colorDescription = getRankingColorDescription(
                item.posicao, item.lutador?.totalLutas || 0, categoria
              );
              
              return (
                <tr 
                  key={item.id} 
                  className={`${colorClass} cursor-pointer relative transition-colors hover:brightness-95`}
                  onClick={() => abrirModal(item.lutadorId)}
                  onMouseEnter={() => showTooltip(index)}
                  onMouseLeave={hideTooltip}
                >
                  <td className="text-center font-bold">
                    <div className="flex items-center justify-center">
                      <span>{item.posicao}</span>
                      {item.variacao > 0 && (
                        <div className="ml-1 text-green-600 flex items-center">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs ml-0.5">{item.variacao}</span>
                        </div>
                      )}
                      {item.variacao < 0 && (
                        <div className="ml-1 text-red-600 flex items-center">
                          <TrendingDown className="h-3 w-3" />
                          <span className="text-xs ml-0.5">{Math.abs(item.variacao)}</span>
                        </div>
                      )}
                    </div>
                    
                    {tooltipPos === index && colorDescription && (
                      <div className="absolute z-50 left-full top-0 ml-2 w-44 p-2 bg-white shadow-lg rounded text-xs">
                        {colorDescription}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center">
                      {item.lutador?.pais && (
                        <span className="country-flag mr-2">
                          {getFlagEmoji(item.lutador.pais)}
                        </span>
                      )}
                      <div>
                        <div className="font-medium">{item.lutador?.nome}</div>
                        {item.lutador?.apelido && (
                          <div className="text-xs text-gray-500">"{item.lutador.apelido}"</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-medium">
                    {item.pontos}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {dados.length === 0 && (
        <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">
            Não há lutadores classificados nesta categoria.
          </p>
        </div>
      )}

      <LutadorModal 
        isOpen={modalAberto}
        onClose={fecharModal}
        lutadorId={lutadorSelecionado}
        categoria={categoriaTitulo}
        estatisticas={estatisticas}
        isLoading={carregando}
      />
    </div>
  );
};

// Função para converter o nome do país em emoji de bandeira
function getFlagEmoji(countryName: string): string {
  if (!countryName) return '🌎';
  
  // Normaliza o nome do país (remove acentos e converte para minúsculo)
  const normalizedName = countryName.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  
  // Mapeamento de variações de nomes de países para códigos de emojis
  const countryVariations: Record<string, string> = {
    // Estados Unidos e variações
    'estados unidos': '🇺🇸',
    'eua': '🇺🇸',
    'usa': '🇺🇸',
    'united states': '🇺🇸',
    'estados unidos da america': '🇺🇸',
    'united states of america': '🇺🇸',
    
    // Brasil e variações
    'brasil': '🇧🇷',
    'brazil': '🇧🇷',
    
    // Canadá e variações
    'canada': '🇨🇦',
    
    // México e variações
    'mexico': '🇲🇽',
    
    // Inglaterra e variações
    'inglaterra': '🇬🇧',
    'england': '🇬🇧',
    'reino unido': '🇬🇧',
    'uk': '🇬🇧',
    'united kingdom': '🇬🇧',
    'gra-bretanha': '🇬🇧',
    'great britain': '🇬🇧',
    
    // Rússia e variações
    'russia': '🇷🇺',
    'federacao russa': '🇷🇺',
    'russian federation': '🇷🇺',
    
    // França e variações
    'franca': '🇫🇷',
    'france': '🇫🇷',
    
    // Japão e variações
    'japao': '🇯🇵',
    'japan': '🇯🇵',
    
    // China e variações
    'china': '🇨🇳',
    'republica popular da china': '🇨🇳',
    'peoples republic of china': '🇨🇳',
    
    // Austrália e variações
    'australia': '🇦🇺',
    
    // Irlanda e variações
    'irlanda': '🇮🇪',
    'ireland': '🇮🇪',
    
    // Nigéria e variações
    'nigeria': '🇳🇬',
    
    // Polônia e variações
    'polonia': '🇵🇱',
    'poland': '🇵🇱',
    
    // Alemanha e variações
    'alemanha': '🇩🇪',
    'germany': '🇩🇪',
    'bundesrepublik deutschland': '🇩🇪',

    // Holanda e variações
    'holanda': '🇳🇱',
    'paises baixos': '🇳🇱',
    'netherlands': '🇳🇱',
    'holland': '🇳🇱',
    
    // Espanha e variações
    'espanha': '🇪🇸',
    'spain': '🇪🇸',
    'espana': '🇪🇸',
    
    // Portugal
    'portugal': '🇵🇹',
    
    // Itália e variações
    'italia': '🇮🇹',
    'italy': '🇮🇹',
    
    // Suécia e variações
    'suecia': '🇸🇪',
    'sweden': '🇸🇪',
    
    // Noruega e variações
    'noruega': '🇳🇴',
    'norway': '🇳🇴',
    
    // Dinamarca e variações
    'dinamarca': '🇩🇰',
    'denmark': '🇩🇰',
    
    // Finlândia e variações
    'finlandia': '🇫🇮',
    'finland': '🇫🇮',
    
    // Argentina e variações
    'argentina': '🇦🇷',
    
    // Chile e variações
    'chile': '🇨🇱',
    
    // Colômbia e variações
    'colombia': '🇨🇴',
    
    // Equador e variações
    'equador': '🇪🇨',
    'ecuador': '🇪🇨',
    
    // Peru e variações
    'peru': '🇵🇪',
    
    // Venezuela e variações
    'venezuela': '🇻🇪',
    
    // Uruguai e variações
    'uruguai': '🇺🇾',
    'uruguay': '🇺🇾',
    
    // Paraguai e variações
    'paraguai': '🇵🇾',
    'paraguay': '🇵🇾',
    
    // Bolívia e variações
    'bolivia': '🇧🇴',
    
    // Suíça e variações
    'suica': '🇨🇭',
    'switzerland': '🇨🇭',
    'schweiz': '🇨🇭',
    
    // Áustria e variações
    'austria': '🇦🇹',
    'osterreich': '🇦🇹',
    
    // Bélgica e variações
    'belgica': '🇧🇪',
    'belgium': '🇧🇪',
    
    // Croácia e variações
    'croacia': '🇭🇷',
    'croatia': '🇭🇷',
    'hrvatska': '🇭🇷',
    
    // Sérvia e variações
    'servia': '🇷🇸',
    'serbia': '🇷🇸',
    
    // Grécia e variações
    'grecia': '🇬🇷',
    'greece': '🇬🇷',
    'hellas': '🇬🇷',
    
    // Turquia e variações
    'turquia': '🇹🇷',
    'turkey': '🇹🇷',
    'turkiye': '🇹🇷',
    
    // Ucrânia e variações
    'ucrania': '🇺🇦',
    'ukraine': '🇺🇦',
    
    // República Tcheca e variações
    'republica tcheca': '🇨🇿',
    'czech republic': '🇨🇿',
    'tcheca': '🇨🇿',
    'checa': '🇨🇿',
    'ceska': '🇨🇿',
    'czech': '🇨🇿',
    
    // Eslováquia e variações
    'eslovaquia': '🇸🇰',
    'slovakia': '🇸🇰',
    
    // Hungria e variações
    'hungria': '🇭🇺',
    'hungary': '🇭🇺',
    
    // Romênia e variações
    'romenia': '🇷🇴',
    'romania': '🇷🇴',
    
    // Bulgária e variações
    'bulgaria': '🇧🇬',
    
    // Escócia (parte do Reino Unido, mas com identidade própria no UFC)
    'escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    
    // País de Gales (parte do Reino Unido, mas com identidade própria no UFC)
    'pais de gales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'gales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    
    // Irlanda do Norte (parte do Reino Unido, mas com identidade própria no UFC)
    'irlanda do norte': '🇬🇧',
    'northern ireland': '🇬🇧',
    
    // África do Sul e variações
    'africa do sul': '🇿🇦',
    'south africa': '🇿🇦',
    
    // Egito e variações
    'egito': '🇪🇬',
    'egypt': '🇪🇬',
    
    // Marrocos e variações
    'marrocos': '🇲🇦',
    'morocco': '🇲🇦',
    
    // Camarões e variações
    'camaroes': '🇨🇲',
    'cameroon': '🇨🇲',
    
    // Índia e variações
    'india': '🇮🇳',
    
    // Paquistão e variações
    'paquistao': '🇵🇰',
    'pakistan': '🇵🇰',
    
    // Indonésia e variações
    'indonesia': '🇮🇩',
    
    // Filipinas e variações
    'filipinas': '🇵🇭',
    'philippines': '🇵🇭',
    
    // Tailândia e variações
    'tailandia': '🇹🇭',
    'thailand': '🇹🇭',
    
    // Coreia do Sul e variações
    'coreia do sul': '🇰🇷',
    'south korea': '🇰🇷',
    'korea': '🇰🇷',
    
    // Coreia do Norte e variações
    'coreia do norte': '🇰🇵',
    'north korea': '🇰🇵',
    
    // Nova Zelândia e variações
    'nova zelandia': '🇳🇿',
    'new zealand': '🇳🇿',
    
    // Israel e variações
    'israel': '🇮🇱',
    
    // Emirados Árabes Unidos e variações
    'emirados arabes unidos': '🇦🇪',
    'emirates': '🇦🇪',
    'united arab emirates': '🇦🇪',
    'uae': '🇦🇪',
    
    // Catar e variações
    'catar': '🇶🇦',
    'qatar': '🇶🇦',
    
    // Cuba e variações
    'cuba': '🇨🇺',
    
    // Jamaica e variações
    'jamaica': '🇯🇲',
    
    // Azerbaijão e variações
    'azerbaijao': '🇦🇿',
    'azerbaijan': '🇦🇿',

    // Cazaquistão e variações
    'cazaquistao': '🇰🇿',
    'kazakhstan': '🇰🇿',
    'cazaque': '🇰🇿',
    
    // Outros países podem ser adicionados aqui
  };
  
  return countryVariations[normalizedName] || '🌎';
}

export default RankingTable; 