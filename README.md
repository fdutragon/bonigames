# Jogo Online em Tempo Real (Next.js)

Este projeto é um exemplo de jogo online simples em tempo real usando Next.js, TypeScript, Tailwind CSS e Socket.IO. Não utiliza banco de dados, apenas comunicação WebSocket.

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Rode o servidor de desenvolvimento:

```bash
npm run dev
```

3. Acesse [http://localhost:3000](http://localhost:3000) e abra em múltiplas abas para testar o contador em tempo real.

## Estrutura
- `src/pages/api/socketio.ts`: endpoint WebSocket (Socket.IO)
- `src/hooks/use-socket.ts`: hook React para comunicação
- `src/app/page.tsx`: página principal do jogo

## Stack
- Next.js
- TypeScript
- Tailwind CSS
- Socket.IO

## Convenções
- Código funcional, sem classes
- Componentes e hooks nomeados
- Responsivo e limpo

---

Siga as instruções do arquivo `.github/copilot-instructions.md` para manter o padrão do projeto.
# bonigames
