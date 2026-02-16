import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../StatCard';
import { Users } from 'lucide-react';

describe('StatCard', () => {
    it('renders title and value', () => {
        render(<StatCard title="Total Users" value={42} icon={Users} />);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with default indigo color', () => {
        const { container } = render(<StatCard title="Test" value={0} icon={Users} />);
        const iconWrapper = container.querySelector('.bg-indigo-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    it('renders with custom color', () => {
        const { container } = render(<StatCard title="Test" value={0} icon={Users} color="green" />);
        const iconWrapper = container.querySelector('.bg-green-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    it('renders string values', () => {
        render(<StatCard title="Status" value="Active" icon={Users} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('falls back to indigo for unknown colors', () => {
        const { container } = render(<StatCard title="Test" value={0} icon={Users} color="purple" />);
        const iconWrapper = container.querySelector('.bg-indigo-50');
        expect(iconWrapper).toBeInTheDocument();
    });
});
