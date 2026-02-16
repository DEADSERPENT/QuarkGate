import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorAlert from '../ErrorAlert';

describe('ErrorAlert', () => {
    it('renders error heading', () => {
        render(<ErrorAlert message="Something went wrong" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders error message', () => {
        render(<ErrorAlert message="Network timeout" />);
        expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('has error styling', () => {
        const { container } = render(<ErrorAlert message="Test error" />);
        const alert = container.firstChild;
        expect(alert.className).toContain('bg-red-50');
    });
});
