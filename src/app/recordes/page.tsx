import { buildApiUrl } from "@/config/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface RecordeInfo {
  tipo: string;
  lutador: string | undefined;
  valor: number;
  categoria?: string;
  evento?: { 
    id: number; 
    nome: string; 
    data?: string; 
  };
}

export default async function RecordesPage() {
  try {
    const res = await fetch(buildApiUrl("recordes"), { 
      cache: "no-store",
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      throw new Error("Falha ao carregar recordes");
    }
    
    const recordes: RecordeInfo[] = await res.json();
    
    // Organizar recordes por tipo
    const recordesLutadores = recordes.filter(r => 
      ['Mais lutas', 'Mais vitórias', 'Mais derrotas', 'Mais nocautes', 
       'Mais finalizações', 'Mais vitórias por decisão', 'Mais bônus da noite'].includes(r.tipo)
      && !r.categoria
    );
    
    const recordesSequencias = recordes.filter(r => 
      ['Mais vitórias consecutivas', 'Mais derrotas consecutivas'].includes(r.tipo)
    );
    
    const recordesEventos = recordes.filter(r => 
      ['Maior público', 'Maior arrecadação'].includes(r.tipo)
    );
    
    const recordesCategorias = recordes.filter(r => r.categoria);
    
    // Função para obter o emoji para cada tipo de recorde
    const getEmojiForRecordType = (tipo: string) => {
      const emojiMap: Record<string, string> = {
        'Mais lutas': '🥊',
        'Mais vitórias': '🏆',
        'Mais derrotas': '👎',
        'Mais nocautes': '💥',
        'Mais finalizações': '🔒',
        'Mais vitórias por decisão': '📝',
        'Mais bônus da noite': '💰',
        'Mais vitórias consecutivas': '🔥',
        'Mais derrotas consecutivas': '📉',
        'Maior público': '👥',
        'Maior arrecadação': '💲',
      };
      
      return emojiMap[tipo] || '🏅';
    };
    
    // Função para exibir país do lutador
    const getBandeiraEmoji = (pais?: string) => {
      if (!pais) return '';
      
      const bandeirasMap: Record<string, string> = {
        'Brasil': '🇧🇷',
        'EUA': '🇺🇸',
        'Estados Unidos': '🇺🇸',
        'Rússia': '🇷🇺',
        'Canadá': '🇨🇦',
        'Irlanda': '🇮🇪',
        'México': '🇲🇽',
        'Austrália': '🇦🇺',
        'Japão': '🇯🇵',
        'Nigéria': '🇳🇬',
        'Inglaterra': '🇬🇧',
        'Reino Unido': '🇬🇧',
        'França': '🇫🇷',
      };
      
      return bandeirasMap[pais] || '';
    };
    
    // Formatar números e valores monetários
    const formatarNumero = (num: number): string => {
      return new Intl.NumberFormat('pt-BR').format(num);
    };
    
    const formatarMoeda = (valor: number): string => {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(valor);
    };
    
    // Formatar data
    const formatarData = (dataString?: string): string => {
      if (!dataString) return "Data não disponível";
      
      try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
      } catch (e) {
        return "Data inválida";
      }
    };
    
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Recordes Históricos do UFC</h1>
        <p className="text-gray-600 mb-8">
          Estatísticas e recordes atualizados com base nas lutas e eventos cadastrados no sistema.
        </p>
        
        <Tabs defaultValue="lutadores" className="w-full mb-8">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="lutadores">Lutadores</TabsTrigger>
            <TabsTrigger value="sequencias">Sequências</TabsTrigger>
            <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lutadores" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Recordes Individuais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordesLutadores.map((recorde) => (
                <Card key={recorde.tipo} className="overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                    <CardTitle className="flex items-center">
                      <span className="mr-2 text-xl">{getEmojiForRecordType(recorde.tipo)}</span> 
                      {recorde.tipo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-bold">{recorde.lutador}</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{recorde.valor}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="sequencias" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Sequências Notáveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recordesSequencias.map((recorde) => (
                <Card key={recorde.tipo} className="overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className={`text-white ${recorde.tipo.includes('vitórias') ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-gradient-to-r from-red-500 to-red-700'}`}>
                    <CardTitle className="flex items-center">
                      <span className="mr-2 text-xl">{getEmojiForRecordType(recorde.tipo)}</span> 
                      {recorde.tipo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-bold">{recorde.lutador}</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{recorde.valor}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="eventos" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Eventos Notáveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recordesEventos.map((recorde) => (
                <Card key={recorde.tipo} className="overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">
                    <CardTitle className="flex items-center">
                      <span className="mr-2 text-xl">{getEmojiForRecordType(recorde.tipo)}</span> 
                      {recorde.tipo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {recorde.evento ? (
                      <div className="flex flex-col gap-2">
                        <Link 
                          href={`/eventos/${recorde.evento.id}`}
                          className="text-xl font-bold text-blue-600 hover:underline"
                        >
                          {recorde.evento.nome}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {formatarData(recorde.evento.data)}
                        </div>
                        <div className="text-2xl font-bold text-amber-600 mt-2">
                          {recorde.tipo === 'Maior arrecadação' 
                            ? formatarMoeda(recorde.valor)
                            : formatarNumero(recorde.valor) + ' espectadores'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">Informação não disponível</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="categorias" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Recordes por Categoria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordesCategorias.map((recorde, index) => (
                <Card key={`${recorde.tipo}-${recorde.categoria}-${index}`} className="overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                    <CardTitle className="flex items-center">
                      <span className="mr-2 text-xl">{getEmojiForRecordType(recorde.tipo)}</span> 
                      {recorde.tipo}
                    </CardTitle>
                    <CardDescription className="text-white opacity-90">
                      {recorde.categoria}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-bold">{recorde.lutador}</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{recorde.valor}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar recordes:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Recordes Históricos do UFC</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold mb-2">Erro ao carregar recordes</p>
          <p>Não foi possível obter os dados de recordes. Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }
}
