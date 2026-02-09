import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_ALL_USERS } from '../graphql/queries/userQueries';
import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

export default function UsersPage() {
  const { data, loading, error } = useQuery(GET_ALL_USERS);
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorAlert message={error.message} />;

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'fullName',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-gray-900">{row.fullName}</span>
      ),
    },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${data.users.length} users from User-Service`}
      />
      <DataTable
        columns={columns}
        data={data.users}
        onRowClick={(row) => navigate(`/users/${row.id}`)}
      />
    </div>
  );
}
