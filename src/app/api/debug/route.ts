import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/config/api';

export async function GET(request: NextRequest) {
  // Função para diagnóstico e depuração do ambiente
  const debugInfo = {
    nextVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local',
    nodeEnv: process.env.NODE_ENV,
    apiUrl: API_URL,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(debugInfo);
} 