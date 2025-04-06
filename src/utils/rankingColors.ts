/**
 * Utility para determinar a classe CSS de cor do ranking com base na posição,
 * número de lutas, categoria e sexo do lutador
 */

// Mapeamento de cores para classes CSS
const colorClassMap: Record<string, string> = {
  "dourado-escuro": "bg-ranking-gold-dark",
  "dourado-claro": "bg-ranking-gold-light",
  "azul-escuro": "bg-ranking-blue-dark",
  "azul-claro": "bg-ranking-blue-light",
  "": "bg-gray-100 hover:bg-gray-200"
};

/**
 * Descrições das cores para tooltips
 */
export const colorDescriptions: Record<string, string> = {
  "dourado-escuro": "Campeão com mais de 10 lutas",
  "dourado-claro": "Campeão (menos de 10 lutas) ou Top 5 no Peso por Peso",
  "azul-escuro": "Top 6-15 no Peso por Peso ou Top 2-5 em outras categorias",
  "azul-claro": "Top 6-15 em categoria específica"
};

/**
 * Obter a classe CSS para a cor do fundo do ranking
 * @param posicao Posição do lutador no ranking
 * @param lutas Número total de lutas do lutador
 * @param categoria Categoria do ranking (slug) 
 * @param sexo Sexo do lutador ('Masculino' ou 'Feminino')
 * @returns Classe CSS para o background
 */
export function getRankingColorClass(
  posicao: number, 
  lutas: number, 
  categoria: string, 
  sexo?: string
): string {
  // Obter a cor base primeiro
  const corBase = getRankingColorValue(posicao, lutas, categoria, sexo);
  
  // Retornar a classe CSS correspondente
  return colorClassMap[corBase] || colorClassMap[""];
}

/**
 * Obter o valor da cor do ranking
 * @param posicao Posição do lutador no ranking
 * @param lutas Número total de lutas do lutador
 * @param categoria Categoria do ranking (slug)
 * @param sexo Sexo do lutador ('Masculino' ou 'Feminino')
 * @returns Valor da cor ('dourado-escuro', 'dourado-claro', 'azul-escuro', 'azul-claro', '')
 */
export function getRankingColorValue(
  posicao: number, 
  lutas: number, 
  categoria: string, 
  sexo?: string
): string {
  // Verificar se é o ranking peso-por-peso
  const isPesoPorPeso = categoria === 'peso-por-peso';
  
  // Lógica para determinar cores
  if (posicao === 1) {
    // Campeão (1º lugar)
    return lutas >= 10 ? 'dourado-escuro' : 'dourado-claro';
  } 
  
  if (isPesoPorPeso) {
    // 2º ao 5º lugar no ranking peso-por-peso
    if (posicao >= 2 && posicao <= 5) return 'dourado-claro';
    
    // 6º ao 15º lugar no ranking peso-por-peso
    if (posicao >= 6 && posicao <= 15) return 'azul-escuro';
  } else {
    // 2º ao 5º lugar em outras categorias
    if (posicao >= 2 && posicao <= 5) return 'azul-escuro';
    
    // 6º ao 15º lugar em outras categorias
    if (posicao >= 6 && posicao <= 15) return 'azul-claro';
  }
  
  // Fora do top 15, sem cor especial
  return '';
}

/**
 * Obter a descrição da cor do ranking para uso em tooltips
 * @param posicao Posição do lutador no ranking
 * @param lutas Número total de lutas do lutador
 * @param categoria Categoria do ranking (slug)
 * @returns Descrição da cor para tooltip
 */
export function getRankingColorDescription(
  posicao: number, 
  lutas: number, 
  categoria: string
): string {
  const colorValue = getRankingColorValue(posicao, lutas, categoria);
  return colorDescriptions[colorValue] || '';
}

// Exportar também o mapeamento de cores para uso direto
export const rankingColorClassMap = colorClassMap; 