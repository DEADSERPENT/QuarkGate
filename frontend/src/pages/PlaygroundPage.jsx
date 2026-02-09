import { useState } from 'react';
import { Play, Clock, Copy, Check } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

const PRESETS = [
  {
    name: 'All Users',
    description: 'Fetch all users from User-Service',
    services: ['User'],
    query: `{
  users {
    id
    username
    email
    fullName
  }
}`,
  },
  {
    name: 'All Products',
    description: 'Fetch all products from Product-Service',
    services: ['Product'],
    query: `{
  products {
    id
    name
    description
    price
    stockQuantity
    category
  }
}`,
  },
  {
    name: 'All Orders',
    description: 'Fetch all orders from Order-Service',
    services: ['Order'],
    query: `{
  orders {
    id
    userId
    status
    totalAmount
    createdAt
  }
}`,
  },
  {
    name: 'User with Orders',
    description: 'User + lazy-loaded orders (2 services)',
    services: ['User', 'Order'],
    query: `{
  user(id: 1) {
    id
    username
    fullName
    orders {
      id
      status
      totalAmount
      createdAt
    }
  }
}`,
  },
  {
    name: 'Order with Products & Payment',
    description: 'Full order resolution (3 services)',
    services: ['Order', 'Product', 'Payment'],
    query: `{
  order(id: 1) {
    id
    userId
    status
    totalAmount
    createdAt
    products {
      id
      name
      price
      category
    }
    payment {
      id
      amount
      method
      status
      processedAt
    }
  }
}`,
  },
  {
    name: 'Dashboard Aggregation',
    description: 'All 3 root queries in one request (3 services)',
    services: ['User', 'Product', 'Order'],
    query: `{
  users {
    id
    username
    fullName
  }
  products {
    id
    name
    price
    category
  }
  orders {
    id
    status
    totalAmount
    createdAt
  }
}`,
  },
];

const SERVICE_COLORS = {
  User: 'bg-blue-100 text-blue-700',
  Product: 'bg-green-100 text-green-700',
  Order: 'bg-amber-100 text-amber-700',
  Payment: 'bg-purple-100 text-purple-700',
};

export default function PlaygroundPage() {
  const [query, setQuery] = useState(PRESETS[0].query);
  const [response, setResponse] = useState(null);
  const [timing, setTiming] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const executeQuery = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setTiming(null);

    const startTime = performance.now();

    try {
      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const endTime = performance.now();
      const data = await res.json();

      setResponse(data);
      setTiming(Math.round(endTime - startTime));
    } catch (err) {
      setError(err.message);
      const endTime = performance.now();
      setTiming(Math.round(endTime - startTime));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <PageHeader
        title="GraphQL Playground"
        subtitle="Test queries against the Gateway — see which services are hit and response times"
      />

      {/* Preset buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Preset Queries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setQuery(preset.query);
                setResponse(null);
                setTiming(null);
                setError(null);
              }}
              className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <p className="font-medium text-gray-900 text-sm">
                {preset.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {preset.description}
              </p>
              <div className="flex gap-1 mt-2">
                {preset.services.map((s) => (
                  <span
                    key={s}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      SERVICE_COLORS[s] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Query Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Query</h3>
            <button
              onClick={executeQuery}
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={14} />
              {isLoading ? 'Running...' : 'Execute'}
            </button>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-80 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            spellCheck={false}
          />
        </div>

        {/* Response */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-gray-700">Response</h3>
              {timing !== null && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <Clock size={12} />
                  {timing}ms
                </span>
              )}
            </div>
            {response && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <pre className="w-full h-80 p-4 bg-gray-900 text-gray-300 font-mono text-sm rounded-xl border border-gray-700 overflow-auto">
            {isLoading
              ? 'Executing query...'
              : error
                ? `Error: ${error}`
                : response
                  ? JSON.stringify(response, null, 2)
                  : 'Click "Execute" to run the query'}
          </pre>
        </div>
      </div>

      {/* Timing info */}
      {timing !== null && !error && (
        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700">
          <strong>Performance:</strong> Query completed in{' '}
          <span className="font-bold">{timing}ms</span> (round-trip from browser
          → Gateway → downstream services → back). This uses raw{' '}
          <code className="bg-indigo-100 px-1 rounded">fetch()</code> instead of
          Apollo Client to measure true network latency.
        </div>
      )}
    </div>
  );
}
