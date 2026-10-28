# Azure

O ponto de entrada da entrega é [README.md](../README.md).

Use main.bicep com um ambiente Container Apps e uma identidade de pull já existentes. Preencha parameters.example.json com seus IDs e uma imagem imutável. O registry, o modelo e o ambiente não são criados ou alterados pelo template.

- Porta interna: 8080.
- Readiness/Liveness: GET /healthz.
- Ingress HTTPS externo; HTTP inseguro desabilitado.
- Imagem por digest e identidade gerenciada para ACR.
- Métricas somente no loopback 9464.
- Até duas réplicas; escala mínima zero.
- NODE_ENV=production e usuário não privilegiado vêm da imagem.

A pipeline de deploy é manual. A preparação deste código não executa comandos de implantação na sua assinatura.

