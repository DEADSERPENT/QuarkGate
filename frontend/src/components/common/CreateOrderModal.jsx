import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { X } from 'lucide-react';
import { CREATE_ORDER, GET_ALL_ORDERS } from '../../graphql/queries/orderQueries';
import { GET_DASHBOARD_DATA } from '../../graphql/queries/dashboardQueries';

export default function CreateOrderModal({ open, onClose }) {
  const [userId, setUserId] = useState('1');
  const [totalAmount, setTotalAmount] = useState('');
  const [productIds, setProductIds] = useState('1,2');

  const [createOrder, { loading }] = useMutation(CREATE_ORDER, {
    optimisticResponse: {
      createOrder: {
        __typename: 'Order',
        id: `temp-${Date.now()}`,
        userId: parseInt(userId),
        status: 'PENDING',
        totalAmount: parseFloat(totalAmount) || 0,
        createdAt: new Date().toISOString(),
      },
    },
    update(cache, { data: { createOrder: newOrder } }) {
      try {
        const existing = cache.readQuery({ query: GET_ALL_ORDERS });
        if (existing) {
          cache.writeQuery({
            query: GET_ALL_ORDERS,
            data: { orders: [newOrder, ...existing.orders] },
          });
        }
      } catch {
        // cache miss is fine
      }
    },
    refetchQueries: [{ query: GET_ALL_ORDERS }, { query: GET_DASHBOARD_DATA }],
    onCompleted: () => {
      onClose();
      setTotalAmount('');
    },
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const ids = productIds
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));

    createOrder({
      variables: {
        userId: parseInt(userId),
        totalAmount: parseFloat(totalAmount),
        productIds: ids,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              min="0.01"
              placeholder="99.99"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product IDs (comma-separated)
            </label>
            <input
              type="text"
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
              placeholder="1,2,3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !totalAmount}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
