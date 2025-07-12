#!/bin/bash
# Script para iniciar Next.js na porta 3005 e expor via ngrok

PORT=3005

# Inicia Next.js
npm run dev -- --port $PORT &
NEXT_PID=$!

# Aguarda o servidor subir
sleep 5

# Inicia ngrok na mesma porta
./ngrok.exe http $PORT &
NGROK_PID=$!

echo "Next.js rodando na porta $PORT (PID $NEXT_PID)"
echo "ngrok rodando na porta $PORT (PID $NGROK_PID)"
echo "Acesse o link gerado pelo ngrok para acesso externo."

# Espera ambos processos
wait $NEXT_PID $NGROK_PID
