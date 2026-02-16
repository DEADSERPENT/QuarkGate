import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { GET_ORDER } from '../graphql/queries/orderQueries';
import PageHeader from '../components/layout/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import { SkeletonDetailCard, SkeletonCards } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_ORDER, {
    variables: { id: parseInt(id) },
  });

  if (loading) return (
    <div>
      <PageHeader title="Order Detail" subtitle={`Order #${id}`} />
      <SkeletonDetailCard />
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Products</h3>
      <SkeletonCards count={3} />
    </div>
  );
  if (error) return <ErrorAlert message={error.message} />;

  const order = data.order;

  return (
    <div>
      <PageHeader title="Order Detail" subtitle={`Order #${id}`}>
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </button>
      </PageHeader>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Amount</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">User ID</p>
            <button
              onClick={() => navigate(`/users/${order.userId}`)}
              className="mt-1 text-indigo-600 hover:underline font-medium"
            >
              #{order.userId}
            </button>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Date</p>
            <p className="mt-1 text-sm text-gray-700">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Products ({order.products?.length || 0})
      </h3>
      {order.products && order.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {order.products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                    {p.category}
                  </span>
                </div>
                <span className="font-bold text-indigo-600">
                  ₹{parseFloat(p.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 mb-6">
          No products found
        </div>
      )}

      {/* Payment */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment</h3>
      {order.payment ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CreditCard size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {order.payment.method}
              </p>
              <StatusBadge status={order.payment.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-medium">
                ₹{parseFloat(order.payment.amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Payment ID</p>
              <p className="font-medium">#{order.payment.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Processed At</p>
              <p className="font-medium">
                {order.payment.processedAt
                  ? new Date(order.payment.processedAt).toLocaleString()
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No payment information
        </div>
      )}

      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700">
        <strong>Cross-Service Resolution:</strong> This single query resolved
        data from{' '}
        <span className="font-semibold">
          Order-Service, Product-Service, and Payment-Service
        </span>{' '}
        via the GraphQL Gateway's field resolvers.
      </div>
    </div>
  );
}
