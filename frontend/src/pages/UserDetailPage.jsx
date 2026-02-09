import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { ArrowLeft, Mail, User as UserIcon } from 'lucide-react';
import { GET_USER } from '../graphql/queries/userQueries';
import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id: parseInt(id) },
  });

  if (loading) return <LoadingSpinner message="Loading user details..." />;
  if (error) return <ErrorAlert message={error.message} />;

  const user = data.user;

  const orderColumns = [
    { key: 'id', label: 'Order ID' },
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
      <PageHeader title="User Detail" subtitle={`User #${id}`}>
        <button
          onClick={() => navigate('/users')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <UserIcon size={24} className="text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              {user.fullName}
            </h2>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} />
              {user.email}
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Orders ({user.orders?.length || 0})
      </h3>

      {user.orders && user.orders.length > 0 ? (
        <DataTable
          columns={orderColumns}
          data={user.orders}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No orders found for this user
        </div>
      )}

      <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700">
        <strong>Cross-Service Resolution:</strong> User data from{' '}
        <span className="font-semibold">User-Service</span>, orders from{' '}
        <span className="font-semibold">Order-Service</span> — resolved via
        field resolver when requested.
      </div>
    </div>
  );
}
