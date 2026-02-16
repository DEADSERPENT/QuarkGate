import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import keycloak from './keycloak';

const AuthContext = createContext({
  initialized: false,
  authenticated: false,
  token: null,
  user: null,
  roles: [],
  login: () => {},
  logout: () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html' })
      .then((auth) => {
        setAuthenticated(auth);
        setInitialized(true);
        if (auth) {
          setToken(keycloak.token);
          setUser({
            username: keycloak.tokenParsed?.preferred_username,
            email: keycloak.tokenParsed?.email,
            name: keycloak.tokenParsed?.name,
          });
          setRoles(keycloak.tokenParsed?.realm_access?.roles || []);
        }
      })
      .catch(() => {
        // Keycloak unavailable — continue unauthenticated
        setInitialized(true);
      });

    // Token refresh
    const interval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(30).then((refreshed) => {
          if (refreshed) {
            setToken(keycloak.token);
          }
        }).catch(() => {
          setAuthenticated(false);
          setToken(null);
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const login = useCallback(() => keycloak.login(), []);
  const logout = useCallback(() => keycloak.logout({ redirectUri: window.location.origin }), []);
  const hasRole = useCallback((role) => roles.includes(role), [roles]);

  return (
    <AuthContext.Provider
      value={{ initialized, authenticated, token, user, roles, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
