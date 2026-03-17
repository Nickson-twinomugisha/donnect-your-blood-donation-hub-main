import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { ProtectedRoute, LoginGuard } from "./components/ProtectedRoute";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import PageLoader from "@/components/PageLoader";

// Lazy-loaded pages — each becomes its own JS chunk
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const DonorsPage = lazy(() => import("@/pages/DonorsPage"));
const DonorProfilePage = lazy(() => import("@/pages/DonorProfilePage"));
const DonationsPage = lazy(() => import("@/pages/DonationsPage"));
const TestResultsPage = lazy(() => import("@/pages/TestResultsPage"));
const MedicalNotesPage = lazy(() => import("@/pages/MedicalNotesPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />
                <Route path="*" element={<NotFound />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/donors" element={<DonorsPage />} />
                  <Route path="/donors/:id" element={<DonorProfilePage />} />
                  <Route path="/donations" element={<DonationsPage />} />
                  <Route path="/test-results" element={<TestResultsPage />} />
                  <Route path="/medical-notes" element={<MedicalNotesPage />} />
                </Route>
              </Routes>
            </Suspense>
          </GlobalErrorBoundary>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
