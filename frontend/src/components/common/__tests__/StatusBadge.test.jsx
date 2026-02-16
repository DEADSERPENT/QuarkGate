import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
    it('renders the status text', () => {
        render(<StatusBadge status="PENDING" />);
        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it.each([
        ['DELIVERED', 'bg-green-100'],
        ['SHIPPED', 'bg-yellow-100'],
        ['CANCELLED', 'bg-red-100'],
        ['PENDING', 'bg-yellow-100'],
        ['FAILED', 'bg-red-100'],
        ['PLACED', 'bg-blue-100'],
    ])('applies correct color for %s status', (status, expectedClass) => {
        const { container } = render(<StatusBadge status={status} />);
        expect(container.firstChild.className).toContain(expectedClass);
    });

    it('falls back to gray for unknown status', () => {
        const { container } = render(<StatusBadge status="UNKNOWN" />);
        expect(container.firstChild.className).toContain('bg-gray-100');
    });
});
