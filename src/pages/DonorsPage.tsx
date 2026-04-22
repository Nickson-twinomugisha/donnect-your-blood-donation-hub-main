import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDonors, addDonor, updateDonor, deleteDonor, isEligibleToDonate, type Donor } from "@/lib/mock-data";
import { donorSchema, type DonorFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, UserCheck, UserX, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export default function DonorsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [bloodFilter, setBloodFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, bloodFilter]);

  const { data, isLoading } = useQuery({ 
    queryKey: ["donors", page, pageSize, debouncedSearch, bloodFilter], 
    queryFn: () => getDonors(page, pageSize, debouncedSearch, bloodFilter) 
  });

  const donors = data?.donors || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      donationCenter: "",
    }
  });

  const addMutation = useMutation({
    mutationFn: addDonor,
    onSuccess: (newDonor) => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Donor registered", description: `${newDonor.fullName} has been added.` });
    },
    onError: (err) => {
      toast({ title: "Failed to register donor", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: DonorFormValues) => updateDonor(editId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setDialogOpen(false);
      setEditId(null);
      form.reset();
      toast({ title: "Donor updated" });
    },
    onError: (err) => {
      toast({ title: "Failed to update donor", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDonor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setDeleteId(null);
      toast({ title: "Donor deleted" });
    },
    onError: (err) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  });

  const { data: eligibilityMap = {} } = useQuery({
    queryKey: ["donors_eligibility", donors.map(d => d.id).join(",")],
    queryFn: async () => {
      if (!donors.length) return {};
      const map: Record<string, boolean> = {};
      await Promise.all(donors.map(async (d) => {
        map[d.id] = await isEligibleToDonate(d.id);
      }));
      return map;
    },
    enabled: donors.length > 0,
  });

  const onSubmit = (values: DonorFormValues) => {
    if (editId) {
      updateMutation.mutate(values);
    } else {
      addMutation.mutate(values as Omit<Donor, "id" | "createdAt" | "updatedAt">);
    }
  };

  const handleEdit = (donor: Donor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(donor.id);
    form.reset({
      fullName: donor.fullName,
      dateOfBirth: donor.dateOfBirth,
      gender: donor.gender,
      bloodType: donor.bloodType,
      phone: donor.phone,
      email: donor.email,
      address: donor.address,
      emergencyContactName: donor.emergencyContactName,
      emergencyContactPhone: donor.emergencyContactPhone,
      emergencyContactRelationship: donor.emergencyContactRelationship,
      donationCenter: donor.donationCenter,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Donors</h1>
          <p className="text-muted-foreground">{donors.length} registered donors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditId(null);
            form.reset({ fullName: "", dateOfBirth: "", phone: "", email: "", address: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "", donationCenter: "" });
          }
        }}>
          {user?.role !== "admin" && (
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Register Donor</Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editId ? "Edit Donor" : "Register New Donor"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bloodType" render={({ field }) => (
                    <FormItem><FormLabel>Blood Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="col-span-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-2">
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-2">
                    <FormField control={form.control} name="donationCenter" render={({ field }) => (
                      <FormItem><FormLabel>Donation Center</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
                
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="col-span-2">
                      <FormField control={form.control} name="emergencyContactRelationship" render={({ field }) => (
                        <FormItem><FormLabel>Relationship</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={addMutation.isPending || updateMutation.isPending}>
                  {editId ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (addMutation.isPending ? "Registering..." : "Register Donor")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search donors..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={bloodFilter} onValueChange={setBloodFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Center</TableHead>
                <TableHead className="hidden sm:table-cell">Eligibility</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : donors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground h-32">
                    No donors found.
                  </TableCell>
                </TableRow>
              ) : (
                donors.map(donor => {
                  const eligible = eligibilityMap[donor.id] ?? true;
                  return (
                    <TableRow key={donor.id} className="cursor-pointer hover:bg-secondary/50 group" onClick={() => navigate(`/donors/${donor.id}`)}>
                      <TableCell className="font-medium">{donor.fullName}</TableCell>
                      <TableCell><Badge variant="outline">{donor.bloodType}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{donor.phone}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{donor.donationCenter}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {eligible ? (
                          <span className="flex items-center gap-1 text-success text-sm"><UserCheck className="h-3.5 w-3.5" />Eligible</span>
                        ) : (
                          <span className="flex items-center gap-1 text-warning text-sm"><UserX className="h-3.5 w-3.5" />Not yet</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {user?.role !== "admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEdit(donor, e as React.MouseEvent)}><Edit2 className="h-4 w-4 mr-2" />Edit Donor</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(donor.id)} className="text-destructive focus:bg-destructive/10">
                              <Trash2 className="h-4 w-4 mr-2" />Delete Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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
            <AlertDialogTitle>Delete Donor Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this donor and all associated data. This action cannot be undone.
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
