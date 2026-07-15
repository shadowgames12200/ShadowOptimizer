# ShadowOptimizer Executor Guide

O **ShadowOptimizer.py** é um executor Python standalone que valida licenças contra a API e executa o script de otimização do Windows.

## Instalação

### Requisitos
- Python 3.7+
- `requests` library: `pip install requests`
- Para coleta de HWID no Windows: `pywin32` library: `pip install pywin32`

### Setup
1. Copie `ShadowOptimizer.py` para o diretório desejado
2. Coloque o arquivo `shadowWindowsBoost.bat` no mesmo diretório (ou especifique o caminho)
3. Instale as dependências: `pip install requests pywin32`

## Uso

### Validação e Execução Básica
```bash
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX
```

### Validação Apenas (Sem Executar Script)
```bash
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX --no-execute
```

### Especificar URL da API Customizada
```bash
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX --api-url https://seu-servidor.com/api/trpc
```

### Especificar Caminho do Script
```bash
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX --script-path C:\path\to\script.bat
```

## Opções

| Opção | Descrição | Obrigatório |
|-------|-----------|-------------|
| `--key` | Chave de licença (ex: SHADOW-XXXX-XXXX) | Sim |
| `--api-url` | URL da API (padrão: https://shadow-boost-licensing.manus.space/api/trpc) | Não |
| `--script-path` | Caminho para o script .bat a executar | Não |
| `--no-execute` | Valida licença sem executar o script | Não |

## Fluxo de Execução

1. **Coleta de HWID**: O executor coleta informações de hardware (CPU, placa-mãe, disco) e gera um HWID único
2. **Validação**: Envia a chave de licença + HWID para a API
3. **Resposta da API**:
   - ✅ **Autorizado**: Executa o script de otimização
   - ❌ **Negado**: Exibe mensagem de erro e encerra
4. **Execução**: Se autorizado, executa o script .bat
5. **Logging**: Todos os eventos são registrados em `~/.shadowoptimizer/executor.log`

## Mensagens de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Invalid license key" | Chave não existe ou está inválida | Verifique a chave de licença |
| "HWID does not match" | Tentativa de usar em hardware diferente | Gere uma nova chave para este hardware |
| "License has expired" | Licença expirou | Renove a licença no painel administrativo |
| "License has been revoked" | Licença foi revogada | Contate o administrador |
| "Cannot connect to API server" | Sem conexão com a API | Verifique conexão de internet e URL da API |

## Logging

Todos os eventos são registrados em:
- **Windows**: `%USERPROFILE%\.shadowoptimizer\executor.log`
- **Linux/Mac**: `~/.shadowoptimizer/executor.log`

Exemplo de log:
```
[2026-07-15T10:30:45.123456] [INFO] ShadowOptimizer License Validator Started
[2026-07-15T10:30:45.234567] [INFO] Collecting hardware information...
[2026-07-15T10:30:45.345678] [INFO] HWID: A1B2C3D4E5F6G7H8...
[2026-07-15T10:30:46.456789] [INFO] Validating license against API...
[2026-07-15T10:30:47.567890] [INFO] License validation PASSED
[2026-07-15T10:30:48.678901] [INFO] Executing script: C:\path\to\script.bat
[2026-07-15T10:31:00.789012] [INFO] Script executed successfully
```

## Integração com Painel Administrativo

1. Acesse o painel em: https://shadow-boost-licensing.manus.space/dashboard
2. Crie uma nova chave de licença
3. Distribua a chave para seus usuários
4. Usuários executam: `python ShadowOptimizer.py --key CHAVE-RECEBIDA`
5. Monitore tentativas de validação na página de detalhes da chave

## Segurança

- **HWID Binding**: Cada chave é vinculada ao hardware na primeira ativação
- **Validação Online**: Requer conexão com a API para cada execução
- **Logging Completo**: Todas as tentativas são registradas para auditoria
- **Sem Armazenamento Local**: Chaves não são armazenadas localmente

## Troubleshooting

### Erro de Importação: "No module named 'requests'"
```bash
pip install requests
```

### Erro de Importação: "No module named 'wmi'" (Windows)
```bash
pip install pywin32
python -m pip install --upgrade pywin32
```

### Script não encontrado
Certifique-se de que `shadowWindowsBoost.bat` está no mesmo diretório ou especifique o caminho com `--script-path`

### Permissões insuficientes
Execute como administrador no Windows:
```bash
python ShadowOptimizer.py --key SHADOW-XXXX-XXXX
```

## Suporte

Para problemas ou dúvidas, consulte o painel administrativo ou contate o suporte.
