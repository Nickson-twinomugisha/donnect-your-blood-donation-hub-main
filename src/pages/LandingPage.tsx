import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, LayoutDashboard, Droplets, Shield, Users, FlaskConical, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-base">Donnect</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">Blood Donation Management Platform</span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Glow orb */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative space-y-4 max-w-xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            <Droplets className="h-3.5 w-3.5" />
            Blood Donation Hub
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight">
            Welcome to{" "}
            <span className="text-primary">Donnect</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Manage donations, test results, and donor records — or access your personal donation history as a donor.
          </p>
        </div>

        {/* Choice cards */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Donor Portal card */}
          <button
            onClick={() => navigate("/portal/login")}
            className="group text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                Donor Portal
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Access your personal donation history, test results, and health records. Log in with your name and email.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {["Donation History", "Test Results", "Health Records"].map((tag) => (
                <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Staff / Lab Technician card */}
          <button
            onClick={() => navigate("/login")}
            className="group text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                Staff / Lab Technician
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manage donors, record donations, review test results, and add medical notes. Requires a staff account.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {["Manage Donors", "Record Donations", "Lab Technician Tools"].map((tag) => (
                <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>
      </section>

      {/* Footer stats bar */}
      <footer className="border-t border-border py-5 px-6">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { icon: Users, label: "Donors Managed" },
            { icon: Droplets, label: "Donations Tracked" },
            { icon: FlaskConical, label: "Tests Recorded" },
            { icon: Shield, label: "Secure & Private" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground text-sm">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
