import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8180',
  realm: 'quarkgate',
  clientId: 'graphql-gateway',
});

export default keycloak;
