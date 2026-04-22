import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DonorAuthProvider } from "@/contexts/DonorAuthContext";
import AppLayout from "@/components/AppLayout";
import { ProtectedRoute, LoginGuard, AdminRoute } from "./components/ProtectedRoute";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { PortalProtectedRoute, PortalLoginGuard } from "./components/portal/PortalRoute";
import PageLoader from "@/components/PageLoader";

// ── Staff pages (lazy) ──────────────────────────────────────────────────────
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const DonorsPage = lazy(() => import("@/pages/DonorsPage"));
const DonorProfilePage = lazy(() => import("@/pages/DonorProfilePage"));
const DonationsPage = lazy(() => import("@/pages/DonationsPage"));
const TestResultsPage = lazy(() => import("@/pages/TestResultsPage"));
const MedicalNotesPage = lazy(() => import("@/pages/MedicalNotesPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const LandingPage = lazy(() => import("@/pages/LandingPage"));

// ── Portal pages (lazy) ──────────────────────────────────────────────────────
const PortalLoginPage = lazy(() => import("@/pages/portal/PortalLoginPage"));
const PortalLayout = lazy(() => import("@/components/portal/PortalLayout"));
const PortalDashboardPage = lazy(() => import("@/pages/portal/PortalDashboardPage"));
const PortalDonationsPage = lazy(() => import("@/pages/portal/PortalDonationsPage"));
const PortalTestResultsPage = lazy(() => import("@/pages/portal/PortalTestResultsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DonorAuthProvider>
          <BrowserRouter>
            <GlobalErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ── Landing ─────────────────────────────────── */}
                  <Route path="/" element={<LandingPage />} />

                  {/* ── Staff auth ───────────────────────────────── */}
                  <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />

                  {/* ── Staff app ────────────────────────────────── */}
                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/donors" element={<DonorsPage />} />
                    <Route path="/donors/:id" element={<DonorProfilePage />} />
                    <Route path="/donations" element={<DonationsPage />} />
                    <Route element={<AdminRoute />}>
                      <Route path="/test-results" element={<TestResultsPage />} />
                      <Route path="/medical-notes" element={<MedicalNotesPage />} />
                    </Route>
                  </Route>

                  {/* ── Donor portal ─────────────────────────────── */}
                  <Route path="/portal" element={<Navigate to="/portal/login" replace />} />
                  <Route path="/portal/login" element={<PortalLoginGuard><PortalLoginPage /></PortalLoginGuard>} />
                  <Route element={<PortalProtectedRoute />}>
                    <Route element={<PortalLayout />}>
                      <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
                      <Route path="/portal/donations" element={<PortalDonationsPage />} />
                      <Route path="/portal/test-results" element={<PortalTestResultsPage />} />
                    </Route>
                  </Route>

                  {/* ── 404 ─────────────────────────────────────── */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </GlobalErrorBoundary>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </DonorAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
