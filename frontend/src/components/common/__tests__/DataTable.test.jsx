import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataTable from '../DataTable';

const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
];

const data = [
    { id: 1, name: 'Alice', email: 'alice@test.com' },
    { id: 2, name: 'Bob', email: 'bob@test.com' },
];

describe('DataTable', () => {
    it('renders column headers', () => {
        render(<DataTable columns={columns} data={data} />);
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders data rows', () => {
        render(<DataTable columns={columns} data={data} />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    });

    it('shows empty state when no data', () => {
        render(<DataTable columns={columns} data={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('calls onRowClick when row is clicked', () => {
        const onClick = vi.fn();
        render(<DataTable columns={columns} data={data} onRowClick={onClick} />);
        fireEvent.click(screen.getByText('Alice'));
        expect(onClick).toHaveBeenCalledWith(data[0]);
    });

    it('supports custom render functions', () => {
        const columnsWithRender = [
            { key: 'name', label: 'Name', render: (row) => `Mr. ${row.name}` },
        ];
        render(<DataTable columns={columnsWithRender} data={data} />);
        expect(screen.getByText('Mr. Alice')).toBeInTheDocument();
    });

    it('renders correct number of rows', () => {
        const { container } = render(<DataTable columns={columns} data={data} />);
        const rows = container.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(2);
    });
});
