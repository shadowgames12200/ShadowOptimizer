# ShadowOptimizer - Sistema de Licenciamento Profissional

Um sistema completo de licenciamento e validação para o ShadowOptimizer, composto por um painel administrativo web elegante, API REST segura e executor Python standalone.

## 🎯 Características

### Painel Administrativo Web
- **Dashboard com Métricas**: Visualize estatísticas em tempo real (total de chaves, ativas, expiradas, negadas)
- **Gerenciamento de Chaves**: Crie, revogue e gerencie licenças com prefixo customizável
- **Geração em Lote**: Gere múltiplas chaves de uma vez (ex: SHADOW-XXXX-XXXX)
- **Histórico de Acessos**: Monitore todas as tentativas de validação com detalhes completos
- **Autenticação Segura**: Integração com Manus OAuth para acesso exclusivo do owner

### API REST Pública
- **Validação de Licenças**: Endpoint `POST /api/validate-license` para validar chave + HWID
- **Vinculação Automática**: HWID é vinculado automaticamente na primeira ativação
- **Registro Completo**: Todas as tentativas são registradas para auditoria
- **Suporte a Expiração**: Licenças podem ter data de expiração opcional

### Executor Python Standalone
- **Coleta de HWID**: Identifica hardware único (CPU, placa-mãe, disco)
- **Validação Online**: Valida contra a API antes de executar
- **Execução Condicional**: Executa o script .bat apenas se autorizado
- **Logging Detalhado**: Registra todas as operações em `~/.shadowoptimizer/executor.log`

## 🚀 Início Rápido

### Instalação do Painel Administrativo

1. **Clone ou acesse o projeto**:
```bash
cd /home/ubuntu/shadow-boost-licensing
```

2. **Instale as dependências**:
```bash
pnpm install
```

3. **Inicie o servidor de desenvolvimento**:
```bash
pnpm dev
```

4. **Acesse o painel**:
   - URL: `http://localhost:3000`
   - Faça login com Manus OAuth

### Instalação do Executor Python

1. **Copie o arquivo**:
```bash
cp ShadowOptimizer.py ~/ShadowOptimizer.py
```

2. **Instale as dependências**:
```bash
pip install requests pywin32
```

3. **Execute com uma chave de licença**:
```bash
python ~/ShadowOptimizer.py --key SHADOW-XXXX-XXXX
```

## 📖 Documentação

### Painel Administrativo

#### Criando Chaves de Licença
1. Acesse o painel em `/licenses`
2. Clique em "Generate Keys"
3. Configure:
   - **Prefix**: Prefixo da chave (padrão: SHADOW)
   - **Quantity**: Número de chaves a gerar (1-100)
4. Clique em "Generate"

#### Monitorando Licenças
1. Veja o dashboard em `/dashboard` para métricas gerais
2. Acesse `/licenses` para listar todas as chaves
3. Clique em uma chave para ver o histórico de acessos completo

#### Revogando Licenças
1. Acesse `/licenses`
2. Clique no ícone de lixeira na chave desejada
3. Confirme a revogação

### API REST

#### Validação de Licença
```bash
curl -X POST http://localhost:3000/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{
    "key": "SHADOW-XXXX-XXXX",
    "hwid": "A1B2C3D4E5F6G7H8..."
  }'
```

**Resposta (Sucesso)**:
```json
{
  "authorized": true,
  "message": "License is valid",
  "licenseKey": "SHADOW-XXXX-XXXX",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "boundHwid": "A1B2C3D4E5F6G7H8..."
}
```

**Resposta (Falha)**:
```json
{
  "authorized": false,
  "message": "HWID does not match the bound hardware"
}
```

### Executor Python

#### Uso Básico
```bash
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX
```

#### Opções Avançadas
```bash
# Validar sem executar script
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX --no-execute

# Especificar URL da API customizada
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX --api-url https://seu-servidor.com/api

# Especificar caminho do script
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX --script-path C:\path\to\script.bat
```

Veja [EXECUTOR_GUIDE.md](./EXECUTOR_GUIDE.md) para documentação completa.

## 🏗️ Arquitetura

### Backend (Node.js + Express + tRPC)
- **Database**: MySQL com Drizzle ORM
- **API REST**: `/api/validate-license` para validação pública
- **API tRPC**: `/api/trpc` para operações administrativas
- **Autenticação**: Manus OAuth para painel administrativo

### Frontend (React + Tailwind + shadcn/ui)
- **Dashboard**: Métricas e visão geral
- **Licenses Page**: Listagem e gerenciamento de chaves
- **License Detail**: Histórico de acessos detalhado
- **Design**: Elegante, refinado e responsivo

### Executor (Python 3.7+)
- **HWID Collection**: WMI (Windows) ou UUID (Linux)
- **Validation**: Chamadas REST à API
- **Execution**: Subprocess para executar scripts
- **Logging**: Arquivo local em `~/.shadowoptimizer/`

## 🔒 Segurança

### Validação de Licenças
- ✅ HWID binding na primeira ativação
- ✅ Validação online obrigatória
- ✅ Registro completo de todas as tentativas
- ✅ Suporte a expiração de chaves
- ✅ Revogação instantânea

### Painel Administrativo
- ✅ Autenticação via Manus OAuth
- ✅ Acesso exclusivo do owner
- ✅ Proteção contra CSRF
- ✅ Sem armazenamento de senhas

### Executor
- ✅ Sem armazenamento local de chaves
- ✅ Validação online obrigatória
- ✅ Logging completo para auditoria
- ✅ Sem permissões elevadas necessárias

## 📊 Banco de Dados

### Tabelas

#### `licenses`
- `id`: Identificador único
- `key`: Chave de licença (SHADOW-XXXX-XXXX)
- `status`: active, revoked, expired
- `expiresAt`: Data de expiração (opcional)
- `boundHwid`: HWID vinculado após primeira ativação
- `activated`: Flag de ativação
- `createdByUserId`: ID do criador
- `createdAt`, `updatedAt`: Timestamps

#### `accessLogs`
- `id`: Identificador único
- `licenseId`: Referência à licença
- `hwid`: HWID da tentativa
- `result`: success, invalid_key, invalid_hwid, revoked, expired, not_activated
- `requestSource`: IP ou identificador da origem
- `createdAt`: Timestamp

#### `hwidBindings`
- `id`: Identificador único
- `licenseId`: Referência à licença
- `hwid`: HWID vinculado
- `isCurrent`: Flag de vinculação atual
- `createdAt`: Timestamp

## 🧪 Testes

Execute os testes unitários:
```bash
pnpm test
```

Testes incluem:
- ✅ Validação de chaves inválidas
- ✅ Detecção de chaves revogadas
- ✅ Verificação de expiração
- ✅ Vinculação de HWID na primeira ativação
- ✅ Rejeição de HWID não correspondente

## 📝 Formato de Chaves

As chaves de licença seguem o formato:
```
PREFIX-XXXX-XXXX
```

Exemplos:
- `SHADOW-A1B2-C3D4`
- `SHADOW-E5F6-G7H8`
- `CUSTOM-1234-5678`

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# JWT
JWT_SECRET=your-secret-key

# Owner
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name
```

## 📦 Build e Deploy

### Build para Produção
```bash
pnpm build
```

### Iniciar em Produção
```bash
pnpm start
```

## 🐛 Troubleshooting

### "Cannot connect to API server"
- Verifique a URL da API com `--api-url`
- Confirme que o servidor está rodando
- Verifique a conexão de internet

### "HWID does not match"
- Tentativa de usar em hardware diferente
- Gere uma nova chave para este hardware

### "License has expired"
- Renove a licença no painel administrativo
- Verifique a data de expiração

### "Failed to collect HWID"
- Instale `pywin32`: `pip install pywin32`
- Execute com permissões de administrador no Windows

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte a documentação em [EXECUTOR_GUIDE.md](./EXECUTOR_GUIDE.md)
2. Verifique os logs em `~/.shadowoptimizer/executor.log`
3. Acesse o painel administrativo para monitorar tentativas

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**ShadowOptimizer** - Sistema de Licenciamento Profissional
Desenvolvido com ❤️ para segurança e confiabilidade
