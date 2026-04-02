import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestockAlerts from './RestockAlerts';
import { getRestockAlerts } from '@/app/actions';

jest.mock('@/app/actions', () => ({
    getRestockAlerts: jest.fn(),
}));

const mockGetRestockAlerts = getRestockAlerts as jest.MockedFunction<typeof getRestockAlerts>;

describe('RestockAlerts', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('shows alerts when the server returns active restock alerts', async () => {
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 1,
        });

        render(<RestockAlerts />);

        await waitFor(() => {
            expect(screen.getByText(/ALU Power/)).toBeInTheDocument();
        });
    });

    it('renders nothing when there are no alerts', async () => {
        mockGetRestockAlerts.mockResolvedValue({ alerts: [], stringerId: 1 });

        const { container } = render(<RestockAlerts />);

        await waitFor(() => {
            expect(container).toBeEmptyDOMElement();
        });
    });

    it('hides the banner immediately when the dismiss button is clicked', async () => {
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 1,
        });

        render(<RestockAlerts />);
        await waitFor(() => screen.getByText(/ALU Power/));

        fireEvent.click(screen.getByLabelText('סגור'));

        expect(screen.queryByText(/ALU Power/)).not.toBeInTheDocument();
    });

    it('saves all dismissed string names to localStorage keyed by stringer id', async () => {
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [
                { stringName: 'ALU Power', count: 15 },
                { stringName: 'RPM Blast', count: 12 },
            ],
            stringerId: 1,
        });

        render(<RestockAlerts />);
        await waitFor(() => screen.getByText(/ALU Power/));

        fireEvent.click(screen.getByLabelText('סגור'));

        const stored = JSON.parse(localStorage.getItem('restock_dismissed_v1_1') || '[]');
        expect(stored).toContain('ALU Power');
        expect(stored).toContain('RPM Blast');
    });

    it('does not show a previously dismissed alert after logout and login', async () => {
        // First session: stringer dismisses the alert
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 1,
        });

        const { unmount } = render(<RestockAlerts />);
        await waitFor(() => screen.getByText(/ALU Power/));
        fireEvent.click(screen.getByLabelText('סגור'));
        unmount();

        // Second session (re-login): same alert is returned by the server
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 1,
        });

        const { container } = render(<RestockAlerts />);

        await waitFor(() => {
            expect(container).toBeEmptyDOMElement();
        });
    });

    it('keeps dismissed state independent between different stringers', async () => {
        // Stringer 1 dismisses the alert
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 1,
        });

        const { unmount } = render(<RestockAlerts />);
        await waitFor(() => screen.getByText(/ALU Power/));
        fireEvent.click(screen.getByLabelText('סגור'));
        unmount();

        // Stringer 2 logs in — same alert must still be visible
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 2,
        });

        render(<RestockAlerts />);

        await waitFor(() => {
            expect(screen.getByText(/ALU Power/)).toBeInTheDocument();
        });
    });

    it('shows a new undismissed alert even after a previous dismissal', async () => {
        // First session: stringer dismisses "ALU Power"
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [{ stringName: 'ALU Power', count: 15 }],
            stringerId: 1,
        });

        const { unmount } = render(<RestockAlerts />);
        await waitFor(() => screen.getByText(/ALU Power/));
        fireEvent.click(screen.getByLabelText('סגור'));
        unmount();

        // Second session: server now returns the dismissed string AND a new one
        mockGetRestockAlerts.mockResolvedValue({
            alerts: [
                { stringName: 'ALU Power', count: 18 },
                { stringName: 'RPM Blast', count: 11 },
            ],
            stringerId: 1,
        });

        render(<RestockAlerts />);

        await waitFor(() => {
            expect(screen.queryByText(/ALU Power/)).not.toBeInTheDocument();
            expect(screen.getByText(/RPM Blast/)).toBeInTheDocument();
        });
    });
});
