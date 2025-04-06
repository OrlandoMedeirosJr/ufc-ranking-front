import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 */
export function formatarData(data: string | Date): string {
  if (!data) return 'Data não informada';
  
  try {
    const dataObj = typeof data === 'string' ? parseISO(data) : data;
    return format(dataObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata um número para o formato brasileiro (1.000,00)
 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pt-BR').format(valor);
}

/**
 * Formata um valor monetário para o formato brasileiro (R$ 1.000,00)
 */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * Trunca um texto se ele for maior que o tamanho máximo
 */
export function truncarTexto(texto: string, tamanhoMaximo: number): string {
  if (!texto) return '';
  if (texto.length <= tamanhoMaximo) return texto;
  
  return texto.substring(0, tamanhoMaximo) + '...';
}

/**
 * Formata um percentual para o formato brasileiro (50,5%)
 */
export function formatarPercentual(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(valor / 100);
}

/**
 * Formata uma duração em segundos para o formato mm:ss
 */
export function formatarDuracao(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return 'N/A';
  
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = Math.floor(segundos % 60);
  
  return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
} 