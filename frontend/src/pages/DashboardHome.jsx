import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingCart, IndianRupee } from 'lucide-react';
import { GET_DASHBOARD_DATA } from '../graphql/queries/dashboardQueries';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/common/StatCard';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { OrderStatusChart, RevenueByCategory, RevenueTimeline } from '../components/common/Charts';
import { SkeletonStatCards, SkeletonTable } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';

export default function DashboardHome() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_DATA);
  const navigate = useNavigate();

  if (loading) return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of all microservices via GraphQL Gateway" />
      <SkeletonStatCards />
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Orders</h2>
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
  if (error) return <ErrorAlert message={error.message} />;

  const { users, products, orders } = data;

  const totalRevenue = orders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount || 0),
    0
  );

  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  const orderColumns = [
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
        title="Dashboard"
        subtitle="Overview of all microservices via GraphQL Gateway"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Products"
          value={products.length}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingCart}
          color="amber"
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon={IndianRupee}
          color="green"
        />
      </div>

      {/* Revenue Timeline — Full width for proper bar chart display */}
      <div className="mb-6">
        <RevenueTimeline orders={orders} />
      </div>

      {/* Side-by-side: Status distribution + Category donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <OrderStatusChart orders={orders} />
        <RevenueByCategory orders={orders} products={products} />
      </div>

      {/* Recent Orders Table */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Recent Orders
        </h2>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
        />
      </div>

      {/* Gateway info */}
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 text-sm text-indigo-700">
        <strong>Gateway Aggregation:</strong> This dashboard fetched data from{' '}
        <span className="font-semibold">3 microservices</span> (User, Product,
        Order) in a <span className="font-semibold">single GraphQL query</span>{' '}
        through the Gateway.
      </div>
    </div>
  );
}
