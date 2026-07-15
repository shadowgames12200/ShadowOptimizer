# ShadowOptimizer - Sistema de Licenciamento

## Fase 1: Schema e Estrutura de Dados
- [x] Criar tabelas no banco de dados: licenses, access_logs, hwid_bindings
- [x] Definir tipos TypeScript para License, AccessLog, HWIDBinding
- [x] Implementar helpers de query no server/db.ts

## Fase 2: API REST Pública
- [x] Criar endpoint POST /api/validate-license para validação de chave + HWID
- [x] Implementar lógica de vinculação automática de HWID na primeira ativação
- [x] Registrar tentativas de acesso (sucesso/falha) no histórico
- [x] Adicionar validação de expiração de chaves
- [x] Implementar testes unitários para API de validação

## Fase 3: Painel Administrativo
- [x] Criar layout dashboard com sidebar para admin
- [x] Implementar página de listagem de chaves com filtros
- [x] Criar formulário de geração de chaves em lote com prefixo customizável
- [x] Implementar página de revogação/gerenciamento de chaves
- [x] Criar dashboard de métricas (total, ativas, expiradas, negadas)
- [x] Implementar visualização de histórico de acessos por chave
- [ ] Adicionar proteção com adminProcedure para rotas exclusivas do owner
- [ ] Implementar testes unitários para procedimentos admin

## Fase 4: Executor Python
- [x] Criar script Python que coleta HWID da máquina
- [x] Implementar validação contra API REST
- [x] Integrar execução condicional do arquivo .bat
- [x] Adicionar tratamento de erros e logging
- [ ] Testar executor em ambiente Windows

## Fase 5: Refinamentos e Publicação
- [ ] Refinar UI/UX do painel administrativo com design elegante
- [ ] Validar fluxo completo: geração → validação → execução
- [ ] Implementar tratamento de erros robusto
- [x] Criar documentação de uso do executor Python
- [ ] Salvar checkpoint final e preparar para publicação

## Notas Importantes
- Prefixo padrão de chaves: SHADOW-XXXX-XXXX
- Autenticação do painel: Manus OAuth exclusivamente
- Executor: arquivo .py standalone
- Direção visual: elegante, refinado, identidade visual coesa
