# Habita — frontend React

Painel de análise imobiliária em React, TypeScript e Vite, separado do serviço de inferência. Inclui simulação dos oito atributos, indicadores do modelo, histórico de dez análises por aba e comparação de dois a cinco cenários.

A entrega foi preparada para **Azure Container Apps**, com imagem Node 24, HTTPS no ingress, porta interna **8080** e healthcheck **/healthz**. O mesmo contêiner pode ser usado em outros serviços Azure compatíveis com Docker. Nenhum deploy foi executado nesta sessão.

## O que está incluído

- Interface responsiva em português, navegação por teclado e estados de erro/carregamento.
- Servidor de mesma origem: o navegador usa /api; o Node consulta a API publicada por HTTPS, resolvendo sua ausência de CORS.
- Unidade monetária explícita, sem inferência por magnitude. Para o serviço atual, a previsão é multiplicada uma única vez por 100000 para apresentar USD.
- Timeout upstream de 13 segundos, limite de 15 segundos na interface e nenhuma retentativa automática.
- Logs JSON sem perfil regional e métricas em 127.0.0.1:9464, fora da origem pública.
- Lockfile, Dockerfile com base por digest, Bicep, CI e workflow manual de deploy.

## Deploy na Azure sem executar localmente

São necessários um ACR, um ambiente Container Apps e uma identidade gerenciada existentes. A identidade precisa de permissão para ler a imagem no ACR; o operador precisa de permissão para publicar imagens e implantar o frontend. Não use o nome do serviço de inferência existente.

1. Copie azure/parameters.example.json e preencha os IDs reais e a região do ambiente existente. A região deve ser a do Container Apps Environment, mesmo que o grupo de recursos tenha outra região. Não há credenciais nesse arquivo.
2. Faça o build remoto a partir da raiz do repositório:

~~~powershell
az acr build --registry SEU_ACR --image houseprice-frontend:RELEASE_ID --file frontend/Dockerfile frontend
~~~

3. Consulte o digest da imagem, usando a tag que acabou de publicar:

~~~powershell
az acr repository show --name SEU_ACR --image houseprice-frontend:RELEASE_ID --query digest -o tsv
~~~

4. No arquivo de parâmetros, configure image como SEU_ACR.azurecr.io/houseprice-frontend@sha256:DIGEST_REAL. Implante o Bicep no grupo correto:

~~~powershell
az deployment group create --resource-group SEU_GRUPO --template-file frontend/azure/main.bicep --parameters "@SEUS_PARAMETROS.json"
~~~

O template cria somente o frontend no ambiente informado. Ele reutiliza o registry e a identidade; não altera o modelo, não cria banco e não cria um novo ambiente de monitoramento.

5. Com a URL HTTPS retornada, valide o serviço implantado:

~~~powershell
node frontend/scripts/live-smoke.mjs --base-url https://URL_DO_FRONTEND --output frontend/artifacts/azure-smoke.json
~~~

Esse smoke envia exatamente uma previsão canônica, sem retentativa. Verifica contrato, unidade e identificadores; não exige igualdade com um preço histórico.

Para autenticação de pull, confira a [documentação Microsoft](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull). A identidade usada no template deve estar autorizada no ACR antes da implantação. A política da assinatura e as [premissas do projeto](../docs/azure-deployment-assumptions.md) continuam aplicáveis.

## Deploy por GitHub Actions

O workflow .github/workflows/frontend-ci.yml faz npm ci, lint, tipos/checkJs, testes unitários e HTTP, build, orçamento de bundle, Playwright nos três navegadores, promtool e verificação do contêiner. Ele guarda a imagem testada como artefato.

O workflow .github/workflows/frontend-deploy.yml é **manual** e depende desse CI. Ele carrega os mesmos bytes da imagem aprovada, publica no ACR, bloqueia a tag e atualiza o Container App existente por digest. Depois executa smoke HTTPS.

Configure o ambiente GitHub azure-production com OIDC e estas variáveis:

| Variável | Uso |
|---|---|
| AZURE_CLIENT_ID | Identidade federada do workflow |
| AZURE_TENANT_ID | Tenant Azure |
| AZURE_SUBSCRIPTION_ID | Assinatura |
| AZURE_ACR_NAME | Registry de destino |
| AZURE_RESOURCE_GROUP | Grupo do frontend |
| AZURE_FRONTEND_APP_NAME | Container App previamente provisionado |

O principal federado deve poder publicar no ACR e atualizar esse Container App. Não coloque senhas no bundle, no workflow ou em arquivos .env versionados. Depois de provisionar com Bicep, execute o workflow Deploy frontend to Azure no repositório GitHub. Esta pasta de trabalho ainda não é um checkout Git; os workflows serão executados depois de o código estar no repositório.

## Configuração de runtime

| Variável | Padrão |
|---|---|
| UPSTREAM_API_ORIGIN | Origem Azure do modelo registrada em .env.example |
| PREDICTION_UNIT | california-housing-100k-usd, para a origem padrão |
| DATASET_REFERENCE | sklearn-california-housing-v1 |
| HOST / PORT | 0.0.0.0 / 8080 em produção |
| METRICS_HOST / METRICS_PORT | 127.0.0.1 / 9464 |
| APP_VERSION / BUILD_ID | 1.0.0 / identificação da entrega |

Outra origem exige declarar PREDICTION_UNIT. O valor usd usa multiplicador 1; california-housing-100k-usd usa 100000. A identidade publicada dos dados coincide com a origem local, mas o JSON remoto não declara a unidade: o mapeamento é explícito e deve ser revalidado ao mudar o serviço.

MedInc permanece na escala original do modelo. MAE/RMSE seguem a unidade de preço; R² é um coeficiente, sem probabilidade de acerto. O contexto histórico de 1990 permanece junto ao resultado.

## Verificações de código

Para desenvolver ou conferir o pacote, sem iniciar a aplicação:

~~~powershell
cd frontend
npm ci
npm run check
~~~

npm run check executa lint, testes de domínio/componentes/contratos, tipos, build e limite de 250 KiB gzip para os ativos iniciais. Os testes HTTP usam servidores efêmeros restritos ao teste; nenhum serviço de produto fica em execução.

A pipeline executa npm run test:e2e e npm run test:container. Os testes de navegador são determinísticos e não enviam carga à API publicada. O smoke real é separado.

O runtime de referência é Node 24 LTS. Node 22.13+ da linha 22 atende aos comandos locais. TypeScript 6.0.3 foi escolhido por compatibilidade com o parser ESLint; o React solicitado permanece 19.3.1.

## Operação e rollback

/healthz mede prontidão do frontend, sem depender da disponibilidade do modelo. /api/health/ready consulta o modelo. O processo encerra conexões de forma controlada ao receber SIGTERM.

O Bicep usa scale-to-zero e limita a duas réplicas. ACR, ambiente, logs e uso de computação devem respeitar as cotas e o orçamento da assinatura; o template não faz orçamento nem habilita recursos pagos adicionais de observabilidade. Métricas privadas exigem coleta privada posteriormente; as vistas e alertas Grafana da inferência existente permanecem independentes.

Para rollback, consulte o digest anterior aprovado e atualize o Container App para esse digest, preservando a configuração de unidade e o BUILD_ID correspondente. O workflow guarda a imagem anterior e tenta restaurá-la se o smoke pós-deploy falhar. Não reconstruir a tag antiga.

O protocolo em docs/usability-protocol.md permite registrar o aceite com cinco participantes após a implantação. Essa avaliação humana não foi executada ou simulada.

## Artefatos

- azure/main.bicep e azure/parameters.example.json: infraestrutura do frontend.
- docker-base-images.json: bases fixadas e verificadas.
- scripts/live-smoke.mjs: validação do site implantado.
- observability/prometheus-rules.yml: regras para futura coleta privada.
- artifacts/: evidências locais, ignoradas pelo Git.

Histórico e dados dos cenários ficam somente na memória da aba, sem localStorage, cookies ou persistência.

