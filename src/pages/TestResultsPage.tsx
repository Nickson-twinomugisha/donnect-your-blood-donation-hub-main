import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getTestResults, getDonations, addTestResult, updateTestResult, deleteTestResult, type TestResult } from "@/lib/mock-data";
import { testResultSchema, type TestResultFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/AuthContext";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";

type TestStatus = "pass" | "fail" | "pending";

function StatusBadge({ status }: { status: string }) {
  if (status === "pass") return <Badge className="bg-success/20 text-success border-0 text-xs">Pass</Badge>;
  if (status === "fail") return <Badge className="bg-destructive/20 text-destructive border-0 text-xs">Fail</Badge>;
  return <Badge className="bg-warning/20 text-warning border-0 text-xs">Pending</Badge>;
}

export default function TestResultsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset page when search changes
  useMemo(() => {
    setPage(0);
  }, [debouncedSearch]);

  const { data: resultsData, isLoading: loadingResults } = useQuery({ 
    queryKey: ["test_results", page, pageSize, debouncedSearch], 
    queryFn: () => getTestResults(page, pageSize, debouncedSearch) 
  });
  const { data: donationsData, isLoading: loadingDonations } = useQuery({ queryKey: ["donations"], queryFn: () => getDonations() });
  
  const results = resultsData?.results || [];
  const totalCount = resultsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const donations = donationsData?.donations || [];

  const form = useForm<TestResultFormValues>({
    resolver: zodResolver(testResultSchema),
    defaultValues: {
      donationId: "",
      date: new Date().toISOString().split('T')[0],
      hiv: "pending",
      hepatitisB: "pending",
      hepatitisC: "pending",
      syphilis: "pending",
      bloodTypingConfirmation: "pending",
      hemoglobin: "",
    }
  });

  const addMutation = useMutation({
    mutationFn: addTestResult,
    onSuccess: (newResult) => {
      queryClient.setQueryData(["test_results"], (old: TestResult[]) => [newResult, ...(old || [])]);
      setDialogOpen(false);
      form.reset();
      toast({ title: "Test results recorded" });
    },
    onError: (err) => {
      toast({ title: "Failed to record tests", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Omit<TestResult, "id">) => updateTestResult(editId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_results"] });
      setDialogOpen(false);
      setEditId(null);
      form.reset();
      toast({ title: "Test results updated" });
    },
    onError: (err) => {
      toast({ title: "Failed to update test results", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_results"] });
      setDeleteId(null);
      toast({ title: "Test record deleted" });
    },
    onError: (err) => {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  });

  const onSubmit = (values: TestResultFormValues) => {
    const donation = donations.find(d => d.id === values.donationId);
    if (!donation) return;
    
    const obj = {
      donationId: values.donationId,
      donorId: donation.donorId,
      donorName: donation.donorName,
      date: values.date,
      hiv: values.hiv,
      hepatitisB: values.hepatitisB,
      hepatitisC: values.hepatitisC,
      syphilis: values.syphilis,
      bloodTypingConfirmation: values.bloodTypingConfirmation,
      hemoglobin: values.hemoglobin ? Number(values.hemoglobin) : null,
    };

    if (editId) {
      updateMutation.mutate(obj);
    } else {
      addMutation.mutate(obj);
    }
  };

  const handleEdit = (result: TestResult) => {
    setEditId(result.id);
    form.reset({
      donationId: result.donationId,
      date: result.date.split("T")[0],
      hiv: result.hiv,
      hepatitisB: result.hepatitisB,
      hepatitisC: result.hepatitisC,
      syphilis: result.syphilis,
      bloodTypingConfirmation: result.bloodTypingConfirmation,
      hemoglobin: result.hemoglobin ?? "",
    });
    setDialogOpen(true);
  };

  const StatusSelectField = ({ name, label }: { name: keyof TestResultFormValues, label: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
          <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Test Results</h1>
          <p className="text-muted-foreground">{results.length} test records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditId(null);
            form.reset({ 
              donationId: "", 
              date: new Date().toISOString().split('T')[0], 
              hiv: "pending", 
              hepatitisB: "pending", 
              hepatitisC: "pending", 
              syphilis: "pending", 
              bloodTypingConfirmation: "pending", 
              hemoglobin: "" 
            });
          }
        }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Record Results</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Test Results" : "Record Test Results"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="donationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingDonations}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select donation" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {donations.map(d => <SelectItem key={d.id} value={d.id}>{d.donorName} — {new Date(d.date).toLocaleDateString()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <StatusSelectField name="hiv" label="HIV" />
                  <StatusSelectField name="hepatitisB" label="Hepatitis B" />
                  <StatusSelectField name="hepatitisC" label="Hepatitis C" />
                  <StatusSelectField name="syphilis" label="Syphilis" />
                  <StatusSelectField name="bloodTypingConfirmation" label="Blood Typing" />
                  <FormField control={form.control} name="hemoglobin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hemoglobin (g/dL)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending || updateMutation.isPending || loadingDonations}>
                  {editId ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (addMutation.isPending ? "Recording..." : "Record Results")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by donor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>HIV</TableHead>
                <TableHead>Hep B</TableHead>
                <TableHead>Hep C</TableHead>
                <TableHead>Syphilis</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Hb</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingResults ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground h-32">
                    No test results found.
                  </TableCell>
                </TableRow>
              ) : (
                results.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.donorName}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={t.hiv} /></TableCell>
                    <TableCell><StatusBadge status={t.hepatitisB} /></TableCell>
                    <TableCell><StatusBadge status={t.hepatitisC} /></TableCell>
                    <TableCell><StatusBadge status={t.syphilis} /></TableCell>
                    <TableCell><StatusBadge status={t.bloodTypingConfirmation} /></TableCell>
                    <TableCell className="text-muted-foreground">{t.hemoglobin ?? "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(t)}><Edit2 className="h-4 w-4 mr-2" />Edit Results</DropdownMenuItem>
                          {user?.role === "admin" && (
                            <DropdownMenuItem onClick={() => setDeleteId(t.id)} className="text-destructive focus:bg-destructive/10">
                              <Trash2 className="h-4 w-4 mr-2" />Delete Record
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="py-4 border-t border-border px-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={page === i} 
                        onClick={() => setPage(i)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      className={page === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this test result record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
