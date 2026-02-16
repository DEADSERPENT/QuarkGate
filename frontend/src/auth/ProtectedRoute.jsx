import { useAuth } from './AuthProvider';
import { Shield } from 'lucide-react';

export default function ProtectedRoute({ children, roles = [] }) {
  const { authenticated, hasRole, login, initialized } = useAuth();

  if (!initialized) return null;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Shield size={48} className="mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Authentication Required</h2>
        <p className="text-sm mb-4">You need to sign in to access this page.</p>
        <button
          onClick={login}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Sign In with Keycloak
        </button>
      </div>
    );
  }

  if (roles.length > 0 && !roles.some(hasRole)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Shield size={48} className="mb-4 text-red-300" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-sm">
          You need one of these roles: {roles.map((r) => (
            <span key={r} className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded mx-0.5">{r}</span>
          ))}
        </p>
      </div>
    );
  }

  return children;
}
