# NEXUS ERP - PROTOCOLO OPERACIONAL PADRÃO (POP)
**Documento:** POP-VEND-001 | **Versão:** 2.0 (Maio/2026)
**Perfil Responsável:** Vendedor / Operador de Loja

---

## 1. OBJETIVO
Padronizar o processo de saída de mercadorias no terminal de loja, garantindo a integridade do estoque, a conformidade fiscal e a prevenção de fraudes através do registro imutável de responsabilidades.

## 2. PLANO OPERACIONAL PADRÃO (POP) - CHECKOUT DE LOJA

### FLUXO OPERACIONAL (PASSO A PASSO)
1. **IDENTIFICAÇÃO DA OPERAÇÃO:** Realizar a importação do arquivo XML da Nota Fiscal (NF-e 4.0) ou realizar a bipagem do Token de Retirada gerado pelo faturamento.
2. **TRIAGEM LOGÍSTICA:** Separar os itens que serão entregues imediatamente (Loja) daqueles que exigem retirada posterior ou são de grande porte (Galpão).
3. **CONFERÊNCIA FÍSICA:** Executar a conferência física rigorosa de cada item, realizando a marcação individual no sistema Nexus para validação do SKU.
4. **REGISTRO DE IDENTIDADE:** 
   - Coletar o nome completo do **Recebedor** (cliente ou motorista).
   - Validar o nome do **Vendedor** responsável logado no sistema.
5. **PROCESSAMENTO E LOG:** Confirmar a entrega para processar a baixa automática no estoque e gerar o log de auditoria com assinatura digital (Fingerprint).

---

## 3. INSTRUÇÃO DE TRABALHO (IT) - EXECUÇÃO NO TERMINAL

### AÇÕES EM TELA
- **UPLOAD XML:** Arrastar o arquivo `.xml` para a zona de importação. Verificar se a Chave de Acesso e o Número da NF aparecem corretamente.
- **MARCAÇÃO DE ITENS:** Clicar no ícone de "check" verde ao lado de cada SKU apenas **após** ter o produto fisicamente em mãos.
- **MODAL DE ASSINATURA:** No campo "Nome Completo", digite o nome do portador da mercadoria. O sistema preencherá automaticamente o nome do vendedor.
- **SINCRONIZAÇÃO:** Clique em "Finalizar e Gerar Log". Aguarde o alerta de "Venda Processada" antes de entregar os produtos ao cliente.

---

## 4. REGRAS DE CONFORMIDADE E SEGURANÇA (CRÍTICO)

> [!IMPORTANT]
> **REGISTRO NOMINAL OBRIGATÓRIO**
> É estritamente proibido finalizar qualquer checkout sem o registro nominal de quem está retirando a mercadoria e do vendedor responsável. Esta ação é imutável.

- **CONFERÊNCIA UNITÁRIA:** Itens não conferidos fisicamente **NÃO** devem ser baixados no sistema sob nenhuma circunstância.
- **INTEGRIDADE FISCAL:** O sistema valida o *Digest Value* da NF-e. Se houver divergência, a operação será bloqueada e um alerta será enviado ao Lab Antifraude.
- **MONITORAMENTO:** Todas as ações no terminal de vendas são monitoradas por IP, Geolocalização Lógica e ID de Dispositivo.

---

## 5. TERMO DE RESPONSABILIDADE
Ao processar uma entrega no Nexus ERP, o vendedor declara que conferiu fisicamente os produtos e valida as informações de identidade registradas, sob pena de sanções administrativas em caso de negligência ou fraude detectada pela central de auditoria.

---
**Aprovado por:** Diretoria de Operações Nexus
**Data de Emissão:** 09/05/2026
