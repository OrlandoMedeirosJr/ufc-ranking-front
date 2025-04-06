#!/bin/bash

# Encerra qualquer processo Next.js existente
pkill -f next || true

# Aguarda um momento para garantir que as portas sejam liberadas
sleep 2

# Inicia o servidor Next.js na porta 3000
PORT=3000 npm run dev 