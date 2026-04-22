import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the AuthContext values
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual as any,
    useAuth: () => ({
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' },
      isAdmin: true,
      logout: vi.fn(),
    }),
  };
});

describe('AppSidebar', () => {
  it('renders standard navigation links', () => {
    // We need to wrap in AuthProvider (if required) and BrowserRouter 
    // since the component uses NavLink.
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Check that important links are present
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Donors/i)).toBeInTheDocument();
    expect(screen.getByText(/Donations/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Results/i)).toBeInTheDocument();
  });

  it('renders user info', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/lab technician/i)).toBeInTheDocument();
  });
});
