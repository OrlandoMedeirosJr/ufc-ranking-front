'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Algo deu errado</h1>
      <p className="text-lg text-gray-600 mb-6 max-w-md">
        Desculpe, ocorreu um erro inesperado. Nossa equipe já foi notificada.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={reset} variant="default">
          Tentar novamente
        </Button>
        
        <Link href="/">
          <Button variant="outline">Voltar para o início</Button>
        </Link>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left max-w-xl overflow-auto">
          <p className="font-mono text-sm text-red-600 mb-2">
            {error.name}: {error.message}
          </p>
          <details>
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Detalhes técnicos
            </summary>
            <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
              {error.stack || 'Nenhum stack trace disponível'}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
} 