# Estudo de Portas para Desenvolvimento de ERP

Este documento analisa a escolha de portas para o ambiente de desenvolvimento do Nexus ERP, focando em segurança, compatibilidade e prevenção de conflitos.

## 1. Análise da Porta 6000 (Restrita)

A porta **6000** é historicamente associada ao **X11 (X Window System)**. Devido a vulnerabilidades de segurança (Cross-Protocol attacks), a maioria dos navegadores modernos bloqueia o acesso a esta porta por padrão.

### Comportamento dos Navegadores:
- **Chrome/Edge:** Exibe `ERR_UNSAFE_PORT`.
- **Firefox:** Exibe "This address is restricted".
- **Safari:** Bloqueia conexões para evitar ataques de redirecionamento.

**Conclusão:** Não é recomendado utilizar a porta 6000 para desenvolvimento web, a menos que haja uma necessidade técnica específica de interoperabilidade com X11 e o desenvolvedor esteja disposto a configurar exceções no navegador.

## 2. Estratégia de Portas Seguras

Para evitar conflitos com outros projetos e garantir que o ERP abra sem problemas, adotamos as seguintes diretrizes:

| Porta | Status | Uso Comum | Recomendação para o ERP |
| :--- | :--- | :--- | :--- |
| **3000** | Ocupada | React, Next.js, Express | Evitar se houver muitos projetos. |
| **3005** | **Livre** | Personalizado | **Selecionada para o Nexus ERP**. |
| **5173** | Ocupada | Vite (Padrão) | Comum demais, chance de conflito. |
| **8080** | Ocupada | Java, Tomcat, Vue | Muito utilizada por proxies. |
| **7000-7010** | Livre | Projetos Internos | Boa alternativa para isolamento. |

## 3. Por que a Porta 3005?

1. **Unicidade:** É um pequeno deslocamento do padrão 3000, tornando-a fácil de lembrar mas menos provável de estar em uso simultâneo por ferramentas automáticas.
2. **Segurança:** Está na faixa de portas dinâmicas/privadas (>1024) e não é bloqueada por navegadores.
3. **Escalabilidade:** Permite que outros serviços (como uma API backend na 3010) rodem paralelamente sem sobreposição.

## 4. Como Resolver Conflitos de Porta

Se a porta 3005 estiver ocupada no futuro, você pode:
1. Verificar quem está usando a porta: `netstat -ano | findstr :3005`
2. Finalizar o processo: `taskkill /PID <PID> /F`
3. Alterar novamente no `package.json` para **3006**, **3007**, etc.
