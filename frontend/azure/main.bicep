targetScope = 'resourceGroup'

@description('Nome do frontend; não use o nome do serviço de inferência existente.')
param appName string
@description('Região do ambiente Container Apps existente, que pode diferir da região do grupo.')
param location string
@description('Resource ID de um ambiente Container Apps existente.')
param environmentResourceId string
@description('Imagem do frontend no ACR, preferencialmente com @sha256:digest.')
param image string
param registryServer string
@description('Identidade existente com permissão de pull no ACR.')
param pullIdentityResourceId string
param upstreamOrigin string = 'https://houseprice-1793126048-13837.northcentralus.cloudapp.azure.com'
@allowed(['california-housing-100k-usd', 'usd'])
param predictionUnit string = 'california-housing-100k-usd'
param datasetReference string = 'sklearn-california-housing-v1'
param buildId string = 'source'

resource frontend 'Microsoft.App/containerApps@2025-07-01' = {
  name: appName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${pullIdentityResourceId}': {}
    }
  }
  properties: {
    environmentId: environmentResourceId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
      registries: [{
        server: registryServer
        identity: pullIdentityResourceId
      }]
    }
    template: {
      containers: [{
        name: 'frontend'
        image: image
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        env: [
          { name: 'UPSTREAM_API_ORIGIN', value: upstreamOrigin }
          { name: 'PREDICTION_UNIT', value: predictionUnit }
          { name: 'DATASET_REFERENCE', value: datasetReference }
          { name: 'BUILD_ID', value: buildId }
          { name: 'HOST', value: '0.0.0.0' }
          { name: 'PORT', value: '8080' }
          { name: 'METRICS_HOST', value: '127.0.0.1' }
        ]
        probes: [
          {
            type: 'Readiness'
            httpGet: { path: '/healthz', port: 8080, scheme: 'HTTP' }
            periodSeconds: 10
            failureThreshold: 3
          }
          {
            type: 'Liveness'
            httpGet: { path: '/healthz', port: 8080, scheme: 'HTTP' }
            initialDelaySeconds: 10
            periodSeconds: 20
          }
        ]
      }]
      scale: {
        minReplicas: 0
        maxReplicas: 2
        rules: [{
          name: 'http'
          http: { metadata: { concurrentRequests: '20' } }
        }]
      }
    }
  }
}
output url string = 'https://${frontend.properties.configuration.ingress.fqdn}'

