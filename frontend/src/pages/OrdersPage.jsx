import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import CreateOrderModal from '../components/common/CreateOrderModal';
import { SkeletonTable } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';

const STATUS_OPTIONS = ['All', 'PENDING', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ALL_ORDERS);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) return (
    <div>
      <PageHeader title="Orders" subtitle="Loading orders..." />
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
  if (error) return <ErrorAlert message={error.message} />;

  const orders = data.orders;
  const filtered =
    statusFilter === 'All'
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'userId', label: 'User ID' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (row) => `₹${parseFloat(row.totalAmount).toFixed(2)}`,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString()
          : '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} orders from Order-Service`}
      >
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Create Order
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
      />

      <CreateOrderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
