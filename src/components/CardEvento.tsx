import Link from 'next/link';
import { Calendar, MapPin, CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import { formatarData, formatarNumero, formatarMoeda } from '@/utils/formatters';

interface EventoProps {
  id: number;
  nome: string;
  data: string | Date;
  local: string;
  pais: string;
  finalizado: boolean;
  lutas?: number;
  publicoTotal?: number;
  arrecadacao?: number;
  payPerView?: number;
}

export default function CardEvento({ 
  id, 
  nome, 
  data, 
  local, 
  pais, 
  finalizado, 
  lutas = 0,
  publicoTotal, 
  arrecadacao,
  payPerView 
}: EventoProps) {
  return (
    <Link href={`/eventos/${id}`}>
      <article className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className={`p-1 text-center text-xs font-medium ${finalizado ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
          {finalizado ? 'Finalizado' : 'Agendado'}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2 line-clamp-2">{nome}</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatarData(data)}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                {local}, {pais}
              </span>
            </div>
            
            {lutas > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <span>{lutas} {lutas === 1 ? 'luta' : 'lutas'}</span>
              </div>
            )}
            
            {finalizado && publicoTotal && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Público: {formatarNumero(publicoTotal)}</span>
              </div>
            )}
            
            {finalizado && payPerView && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span>PPV: {formatarNumero(payPerView)}</span>
              </div>
            )}
          </div>
        </div>
        
        {finalizado && arrecadacao && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500">
              Arrecadação: <span className="font-medium text-gray-700">{formatarMoeda(arrecadacao)}</span>
            </div>
          </div>
        )}
      </article>
    </Link>
  );
} 