import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDonorAuth } from "@/contexts/DonorAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, ArrowLeft, Droplets } from "lucide-react";

export default function PortalLoginPage() {
  const { donorLogin } = useDonorAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Please enter both your full name and email.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await donorLogin(fullName, email);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate("/portal/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-red-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Droplets className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-xl">Donnect</span>
        </div>

        <div>
          <h1 className="text-4xl font-display font-bold leading-tight mb-4">
            Your Donation.<br />Your Story.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Access your complete donation history, screening test results, and health records — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Secure Access", desc: "Your data stays private" },
            { label: "Full History", desc: "All donations tracked" },
            { label: "Test Results", desc: "Know your status" },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-white/60 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Back to home */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">Donnect</span>
          </div>

          <h2 className="text-2xl font-display font-bold mb-1">Donor Portal</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Use the name and email you registered with to access your records.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g. Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking records...</>
              ) : (
                "Access My Records"
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            Your information is stored securely. This portal is read-only.
          </p>
        </div>
      </div>
    </div>
  );
}
