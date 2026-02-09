import { AlertTriangle } from 'lucide-react';

export default function ErrorAlert({ message }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <AlertTriangle size={20} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Error</p>
        <p className="text-sm mt-0.5">{message}</p>
      </div>
    </div>
  );
}
