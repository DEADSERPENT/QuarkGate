import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const STATUS_OPTIONS = ['All', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ALL_ORDERS);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All');

  if (loading) return <LoadingSpinner message="Loading orders..." />;
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
      render: (row) => `$${parseFloat(row.totalAmount).toFixed(2)}`,
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
      />

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
    </div>
  );
}
