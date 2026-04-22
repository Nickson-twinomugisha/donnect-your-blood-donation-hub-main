import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Droplets, LayoutDashboard, Users, Heart, TestTube, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { to: "/donors", label: "Donors", icon: Users, adminOnly: false },
  { to: "/donations", label: "Donations", icon: Heart, adminOnly: false },
  { to: "/test-results", label: "Test Results", icon: TestTube, adminOnly: true },
  { to: "/medical-notes", label: "Medical Notes", icon: FileText, adminOnly: true },
];

interface AppSidebarProps {
  onClose?: () => void;
  className?: string;
}

export default function AppSidebar({ onClose, className }: AppSidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className={cn("flex flex-col border-r border-sidebar-border bg-sidebar", className)}>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Droplets className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold font-display text-sidebar-foreground tracking-tight">Donnect</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role === "admin" ? "Lab Technician" : user?.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
