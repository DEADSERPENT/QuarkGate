import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Terminal,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/playground', label: 'Playground', icon: Terminal },
];

export default function Sidebar() {
  const { authenticated, user, roles, login, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <span className="text-xl font-bold text-white tracking-wide">
          QURACUS
        </span>
        <span className="ml-2 text-xs text-indigo-300 font-medium mt-0.5">
          GraphQL Gateway
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-200 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Auth Section */}
      <div className="px-3 py-3 border-t border-white/10">
        {authenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.username}</p>
                <div className="flex gap-1 mt-0.5">
                  {roles.filter((r) => r === 'admin' || r === 'user').map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-indigo-700 text-indigo-200"
                    >
                      <Shield size={8} />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-sidebar-hover hover:text-white rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-sidebar-hover hover:text-white rounded-lg transition-colors"
          >
            <LogIn size={14} />
            Sign In with Keycloak
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/10 text-xs text-indigo-300">
        Microservices Dashboard
        <br />
        M.Tech Thesis Project
      </div>
    </aside>
  );
}
