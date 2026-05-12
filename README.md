# ERP Meta - Arquitetura Distribuída

Sistema ERP multiunidade para controle de retirada por NF-e.

## Estrutura do Projeto

- `frontend/`: Aplicação React 19 + Vite + Tailwind.
- `backend/`: API REST Modular em Node.js + Express.
- `database/`: Migrations e schemas do PostgreSQL/Supabase.
- `shared/`: Tipagens e constantes compartilhadas entre frontend e backend.
- `docs/`: Documentação técnica e amostras.

## Como Rodar

### Localmente (Sem Docker)

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Com Docker

```bash
docker-compose up --build
```

## Arquitetura Backend

O backend segue o padrão de separação de responsabilidades:
- **Controllers**: Manipulação de requisições HTTP.
- **Services**: Lógica de negócio (Regras de ERP, NF-e).
- **Repositories**: Acesso a dados (Supabase/PostgreSQL).
- **Middlewares**: Autenticação (JWT) e Autorização (RBAC).
