import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDonations, getDonors, addDonation, updateDonation, deleteDonation, type Donation } from "@/lib/mock-data";
import { donationSchema, type DonationFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";

export default function DonationsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Reset page when search changes
  useMemo(() => {
    setPage(0);
  }, [debouncedSearch]);

  const { data: donationsData, isLoading: loadingDonations } = useQuery({ 
    queryKey: ["donations", page, pageSize, debouncedSearch], 
    queryFn: () => getDonations(page, pageSize, debouncedSearch) 
  });
  const { data: donorsData, isLoading: loadingDonors } = useQuery({ queryKey: ["donors"], queryFn: () => getDonors() });

  const donations = useMemo(() => donationsData?.donations || [], [donationsData]);
  const totalCount = donationsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const donors = useMemo(() => donorsData?.donors || [], [donorsData]);

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donorId: "",
      date: new Date().toISOString().split('T')[0],
      type: "whole_blood",
      volume: 450,
      center: "",
    }
  });

  const addMutation = useMutation({
    mutationFn: addDonation,
    onSuccess: (newDonation) => {
      queryClient.setQueryData(["donations"], (old: { donations: Donation[], count: number } | undefined) => ({
        ...old,
        donations: [newDonation, ...(old?.donations || [])],
        count: (old?.count || 0) + 1
      }));
      setDialogOpen(false);
      form.reset();
      toast({ title: "Donation recorded", description: `Donation from ${newDonation.donorName} recorded.` });
    },
    onError: (err) => {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Request timed out. Please check your connection and try again."
        : err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Failed to record donation", description: msg, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: DonationFormValues) => updateDonation(editId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      setDialogOpen(false);
      setEditId(null);
      form.reset();
      toast({ title: "Donation updated" });
    },
    onError: (err) => toast({ title: "Failed to update donation", description: err.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      setDeleteId(null);
      toast({ title: "Donation deleted" });
    },
    onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" })
  });

  const onSubmit = (values: DonationFormValues) => {
    const donor = donors.find(d => d.id === values.donorId);
    if (!donor) return;
    
    const obj = {
      donorId: values.donorId,
      donorName: donor.fullName,
      date: values.date,
      type: values.type,
      volume: values.volume,
      center: values.center,
      collectedBy: user?.name || "Staff",
      bloodType: donor.bloodType,
    };

    if (editId) {
      updateMutation.mutate(obj);
    } else {
      addMutation.mutate(obj);
    }
  };

  const handleEdit = (donation: Donation) => {
    setEditId(donation.id);
    form.reset({
      donorId: donation.donorId,
      date: donation.date.split("T")[0],
      type: donation.type,
      volume: donation.volume,
      center: donation.center,
    });
    setDialogOpen(true);
  };

  const typeLabel = (t: string) => t.replace("_", " ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Donations</h1>
          <p className="text-muted-foreground">{donations.length} total donations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditId(null);
            form.reset({ donorId: "", date: new Date().toISOString().split('T')[0], type: "whole_blood", volume: 450, center: "" });
          }
        }}>
          {user?.role !== "admin" && (
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Record Donation</Button></DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Donation" : "Record New Donation"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="donorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={loadingDonors || !!editId}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select donor" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {donors.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName} ({d.bloodType})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="whole_blood">Whole Blood</SelectItem>
                          <SelectItem value="plasma">Plasma</SelectItem>
                          <SelectItem value="platelets">Platelets</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="volume" render={({ field }) => (
                    <FormItem><FormLabel>Volume (ml)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="center" render={({ field }) => (
                    <FormItem><FormLabel>Center</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending || updateMutation.isPending || loadingDonors}>
                  {editId ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (addMutation.isPending ? "Recording..." : "Record Donation")}
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
            <Input className="pl-9" placeholder="Search donations..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead className="hidden md:table-cell">Volume</TableHead>
                <TableHead className="hidden md:table-cell">Center</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDonations ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : donations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground h-32">
                    No donations found.
                  </TableCell>
                </TableRow>
              ) : (
                donations.map(d => (
                  <TableRow key={d.id} className="group cursor-pointer hover:bg-secondary/50">
                    <TableCell className="font-medium">{d.donorName}</TableCell>
                    <TableCell className="capitalize">{d.type.replace("_", " ")}</TableCell>
                    <TableCell><Badge variant="outline">{d.bloodType}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{d.volume} ml</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{d.center}</TableCell>
                    <TableCell className="hidden sm:table-cell">{new Date(d.date).toLocaleDateString()}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {user?.role !== "admin" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(d)}><Edit2 className="h-4 w-4 mr-2" />Edit Donation</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(d.id)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-2" />Delete Donation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
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
            <AlertDialogTitle>Delete Donation Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this donation and any associated test results. This action cannot be undone.
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
