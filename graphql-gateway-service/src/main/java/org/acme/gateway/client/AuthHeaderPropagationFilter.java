package org.acme.gateway.client;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@ApplicationScoped
public class AuthHeaderPropagationFilter implements ClientRequestFilter {

    @Inject
    SecurityIdentity securityIdentity;

    @Override
    public void filter(ClientRequestContext requestContext) {
        if (securityIdentity != null && !securityIdentity.isAnonymous()) {
            requestContext.getHeaders().putSingle(
                    "X-Authenticated-User",
                    securityIdentity.getPrincipal().getName()
            );
        }
    }
}
