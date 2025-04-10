#!/bin/bash

# Parando todos os processos do Next.js...
echo "Parando todos os processos do Next.js..."
pkill -f "next" || true
pkill -f "node.*next" || true
sleep 2

# Removendo arquivos de cache...
echo "Removendo arquivos de cache..."
rm -rf .next
rm -rf node_modules/.cache

# Reinstalando dependências críticas...
echo "Reinstalando dependências críticas..."
npm i next@latest react@latest react-dom@latest
npm i

# Iniciando o servidor...
echo "Iniciando o servidor..."
PORT=3000 NEXT_PUBLIC_API_URL=http://localhost:3002 NEXT_PUBLIC_BACKEND_URL=http://localhost:3002 npm run dev 