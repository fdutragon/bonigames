#!/bin/bash
# Script de deploy automático para app Next.js

set -e

# 1. Build do projeto
npm install
npm run build

# 2. Sincroniza arquivos para o servidor remoto (ajuste USER, HOST e PATH)
# Exemplo usando rsync:
# rsync -avz --delete .next/ USER@HOST:/caminho/para/app/.next/
# rsync -avz --delete public/ USER@HOST:/caminho/para/app/public/
# rsync -avz --delete package.json package-lock.json USER@HOST:/caminho/para/app/
# rsync -avz --delete node_modules/ USER@HOST:/caminho/para/app/node_modules/

# 3. (Opcional) Reinicia o serviço no servidor remoto
# ssh USER@HOST 'cd /caminho/para/app && pm2 restart app'

# 4. Mensagem de sucesso
echo "Deploy concluído com sucesso!"
