import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDonors, getDonations, getTestResults } from "@/lib/mock-data";
import { Users, Heart, TestTube, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ComponentErrorBoundary } from "@/components/GlobalErrorBoundary";

export default function DashboardPage() {
  const { data: donorsData, isLoading: donorsLoading } = useQuery({ queryKey: ["donors"], queryFn: () => getDonors() });
  const { data: donationsData, isLoading: donationsLoading } = useQuery({ queryKey: ["donations"], queryFn: () => getDonations() });
  const { data: testResultsData, isLoading: testsLoading } = useQuery({ queryKey: ["test_results"], queryFn: () => getTestResults() });

  const donors = useMemo(() => donorsData?.donors || [], [donorsData]);
  const donations = useMemo(() => donationsData?.donations || [], [donationsData]);
  const testResults = useMemo(() => testResultsData?.results || [], [testResultsData]);
  const isLoading = donorsLoading || donationsLoading || testsLoading;

  const currentMonth = useMemo(() => new Date().toISOString().substring(0, 7), []); // YYYY-MM (dynamic!)

  const pendingTests = useMemo(() =>
    testResults.filter(t =>
      t.hiv === "pending" || t.hepatitisB === "pending" ||
      t.hepatitisC === "pending" || t.syphilis === "pending"
    ).length,
    [testResults]
  );

  const donationsThisMonth = useMemo(() => {
    return donations.filter(d => d.date.startsWith(currentMonth)).length;
  }, [donations, currentMonth]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    donations.forEach(d => {
      const month = d.date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        donations: count,
      }));
  }, [donations]);

  const recentDonations = useMemo(() => {
    return [...donations].slice(0, 5);
  }, [donations]);

  const stats = [
    { label: "Total Donors", value: donors.length, icon: Users, color: "text-primary" },
    { label: "Donations This Month", value: donationsThisMonth, icon: Heart, color: "text-primary" },
    { label: "Pending Tests", value: pendingTests, icon: TestTube, color: "text-warning" },
    { label: "Total Donations", value: donations.length, icon: UserCheck, color: "text-success" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground">Overview of donation activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold font-display mt-1">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Donations Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No donation data yet.
                </div>
              ) : (
                <ComponentErrorBoundary name="Donation Chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                      <XAxis dataKey="month" stroke="hsl(0 0% 64%)" fontSize={12} />
                      <YAxis stroke="hsl(0 0% 64%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 18%)", borderRadius: "8px", color: "hsl(0 0% 95%)" }}
                      />
                      <Bar dataKey="donations" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ComponentErrorBoundary>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No donations recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentDonations.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{d.donorName}</p>
                      <p className="text-xs text-muted-foreground">{d.type.replace("_", " ")} • {d.bloodType}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
