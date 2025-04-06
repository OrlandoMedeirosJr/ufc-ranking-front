#!/bin/bash

echo "Parando todos os processos do Next.js..."
pkill -f "next dev" || true

echo "Removendo arquivos de cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "Reinstalando dependências críticas..."
npm install tailwind-merge@latest --save
npm install @radix-ui/react-tabs@latest --save
npm install clsx@latest --save
npm install class-variance-authority@latest --save

echo "Iniciando o servidor sem turbopack..."
npm run dev -- --no-turbo 