import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDonorAuth } from "@/contexts/DonorAuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Droplets, FlaskConical, LogOut } from "lucide-react";

const navItems = [
  { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/donations", label: "My Donations", icon: Droplets },
  { to: "/portal/test-results", label: "Test Results", icon: FlaskConical },
];

export default function PortalLayout() {
  const { donor, donorLogout } = useDonorAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    donorLogout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Droplets className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base">Donnect</span>
            <span className="text-muted-foreground text-sm ml-1">/ Donor Portal</span>
          </div>

          {/* Nav links — hidden on mobile, shown md+ */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {donor?.fullName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile bottom tab nav */}
        <div className="md:hidden flex border-t border-border">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
