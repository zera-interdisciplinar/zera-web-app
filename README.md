# Zera

Frontend para gestão de resíduos eletrônicos, feito com Vite, React e TypeScript. O sistema organiza equipamentos, triagem, manutenção e descarte. A interface aplica permissões por perfil: funcionário, gestor e administrador. No desenvolvimento, MSW pode fornecer dados simulados.

## Pré-requisitos

- Node.js 20.19+ ou 22.12+.
- npm.

## Rodar localmente

Clone o repositório e entre na pasta do projeto. Depois instale as dependências e inicie o servidor:

```bash
npm ci
npm run dev
```

Abra o endereço mostrado no terminal, normalmente `http://localhost:5173`.

Para usar a API simulada no desenvolvimento, crie um arquivo `.env` com:

```env
VITE_USE_MSW=true
```
