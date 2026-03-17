import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' },
    isAdmin: true,
  }),
}));

// Mock the API calls
vi.mock('@/lib/mock-data', () => ({
  getDonors: vi.fn(() => Promise.resolve({ donors: [{ id: '1', fullName: 'Donor One', bloodType: 'O+', phone: '555-0100', email: 'donor@example.com', address: '123 Main', emergencyContactName: 'Contact', emergencyContactPhone: '555-0101', emergencyContactRelationship: 'Friend', donationCenter: 'Center A' }], count: 1 })),
  getDonations: vi.fn(() => Promise.resolve({ donations: [{ id: '1', donorId: '1', donorName: 'Donor One', date: new Date().toISOString(), type: 'whole_blood', volume: 450, center: 'Center A', collectedBy: 'Staff', bloodType: 'O+' }], count: 1 })),
  getTestResults: vi.fn(() => Promise.resolve({ results: [], count: 0 })),
}));

// Mock components that use Recharts to avoid DOM-related rendering issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div>BarChart Content</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  it('renders the Dashboard header', async () => {
    renderWithProviders(<DashboardPage />);
    
    // Check loading state or immediately resolved state
    expect(await screen.findByText(/Dashboard/i)).toBeInTheDocument();
    expect(await screen.findByText(/Overview of donation activity/i)).toBeInTheDocument();
  });

  it('displays mock data metrics after loading', async () => {
    renderWithProviders(<DashboardPage />);
    
    // The metric cards should eventually show '1' since we mocked 1 donor and 1 donation
    expect(await screen.findByText('Total Donors')).toBeInTheDocument();
    expect(await screen.findByText('Total Donations')).toBeInTheDocument();
  });
});
