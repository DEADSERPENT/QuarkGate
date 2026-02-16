import { TrendingUp } from 'lucide-react';

const colorSchemes = {
  indigo: {
    icon: 'bg-indigo-500/10 text-indigo-600',
    accent: 'from-indigo-500 to-violet-500',
    badge: 'bg-indigo-50 text-indigo-600',
  },
  green: {
    icon: 'bg-emerald-500/10 text-emerald-600',
    accent: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-50 text-emerald-600',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-600',
    accent: 'from-blue-500 to-cyan-500',
    badge: 'bg-blue-50 text-blue-600',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-600',
    accent: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-50 text-amber-600',
  },
  red: {
    icon: 'bg-red-500/10 text-red-600',
    accent: 'from-red-500 to-pink-500',
    badge: 'bg-red-50 text-red-600',
  },
};

export default function StatCard({ title, value, icon: Icon, color = 'indigo' }) {
  const scheme = colorSchemes[color] || colorSchemes.indigo;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.accent} opacity-80`} />

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${scheme.icon} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>

      {/* Subtle live indicator */}
      <div className="mt-3 flex items-center gap-1.5">
        <TrendingUp size={12} className="text-emerald-500" />
        <span className="text-[11px] text-gray-400 font-medium">Live from gateway</span>
      </div>
    </div>
  );
}
