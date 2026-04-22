import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  getDonor, getDonationsByDonor, getTestResultsByDonor, getMedicalNotesByDonor, 
  isEligibleToDonate, getLastDonationDate, addMedicalNote, updateDonor, deleteDonor, 
  deleteMedicalNote, deleteDonation, deleteTestResult, type MedicalNote, type Donor 
} from "@/lib/mock-data";
import { donorSchema, type DonorFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ComponentErrorBoundary } from "@/components/GlobalErrorBoundary";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Phone, Mail, MapPin, UserCheck, UserX, Heart, AlertTriangle, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function StatusBadge({ status }: { status: string }) {
  if (status === "pass") return <Badge className="bg-success/20 text-success border-0">Pass</Badge>;
  if (status === "fail") return <Badge className="bg-destructive/20 text-destructive border-0">Fail</Badge>;
  return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>;
}

export default function DonorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");
  
  // Dialog States
  const [editDonorOpen, setEditDonorOpen] = useState(false);
  const [deleteDonorId, setDeleteDonorId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteDonationId, setDeleteDonationId] = useState<string | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const donorId = id || "";

  // Queries
  const { data: donor, isLoading: loadingDonor } = useQuery({ queryKey: ["donor", donorId], queryFn: () => getDonor(donorId), enabled: !!donorId });
  const { data: donations = [], isLoading: loadingDonations } = useQuery({ queryKey: ["donations", donorId], queryFn: () => getDonationsByDonor(donorId), enabled: !!donorId });
  const { data: tests = [], isLoading: loadingTests } = useQuery({ queryKey: ["test_results", donorId], queryFn: () => getTestResultsByDonor(donorId), enabled: !!donorId });
  const { data: notes = [], isLoading: loadingNotes } = useQuery({ queryKey: ["notes", donorId], queryFn: () => getMedicalNotesByDonor(donorId), enabled: !!donorId });
  const { data: eligible = true } = useQuery({ queryKey: ["eligible", donorId], queryFn: () => isEligibleToDonate(donorId), enabled: !!donorId });
  const { data: lastDonation } = useQuery({ queryKey: ["lastDonation", donorId], queryFn: () => getLastDonationDate(donorId), enabled: !!donorId });

  // Forms
  const donorForm = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema),
    values: donor ? {
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
    } : undefined
  });

  // Mutations
  const updateDonorMut = useMutation({
    mutationFn: (data: DonorFormValues) => updateDonor(donorId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["donor", donorId], updated);
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setEditDonorOpen(false);
      toast({ title: "Donor updated" });
    },
    onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" })
  });

  const deleteDonorMut = useMutation({
    mutationFn: deleteDonor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      navigate("/donors");
      toast({ title: "Donor deleted" });
    },
    onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" })
  });

  const deleteDonationMut = useMutation({
    mutationFn: deleteDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["donations", donorId] });
      setDeleteDonationId(null);
      toast({ title: "Donation removed" });
    }
  });

  const deleteTestMut = useMutation({
    mutationFn: deleteTestResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_results"] });
      queryClient.invalidateQueries({ queryKey: ["test_results", donorId] });
      setDeleteTestId(null);
      toast({ title: "Test result removed" });
    }
  });

  const addNoteMut = useMutation({
    mutationFn: addMedicalNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData(["notes", donorId], (old: MedicalNote[]) => [newNote, ...(old || [])]);
      setNoteContent("");
      toast({ title: "Note added" });
    },
  });

  const deleteNoteMut = useMutation({
    mutationFn: deleteMedicalNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", donorId] });
      setDeleteNoteId(null);
      toast({ title: "Note removed" });
    }
  });

  if (loadingDonor) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-1 h-96 rounded-xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!donor) return <div className="p-8 text-center text-muted-foreground">Donor not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/donors")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Donors
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donor Info Card */}
        <Card className="lg:col-span-1 border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary font-display shrink-0">
                  {donor.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <CardTitle className="font-display truncate" title={donor.fullName}>{donor.fullName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{donor.bloodType}</Badge>
                    <span className="text-xs text-muted-foreground capitalize">{donor.gender}</span>
                  </div>
                </div>
              </div>
              {user?.role !== "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDonorOpen(true)}><Edit2 className="h-4 w-4 mr-2" />Edit Donor</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteDonorId(donor.id)} className="text-destructive focus:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />Delete Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4 shrink-0" /><span className="truncate">{donor.phone}</span></div>
            <div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{donor.email}</span></div>
            <div className="flex items-start gap-3 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /><span>{donor.address}</span></div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">DOB</p>
                <p>{new Date(donor.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Center</p>
                <p className="truncate" title={donor.donationCenter}>{donor.donationCenter}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Emergency Contact</p>
              <div className="bg-secondary/30 rounded-md p-3">
                <p className="font-medium text-sm">{donor.emergencyContactName} <span className="text-muted-foreground font-normal">({donor.emergencyContactRelationship})</span></p>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2"><Phone className="h-3 w-3" />{donor.emergencyContactPhone}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Current Status</p>
              <div className="flex items-center justify-between bg-secondary/30 rounded-md p-3">
                {eligible ? (
                  <span className="flex items-center gap-2 text-success font-medium"><UserCheck className="h-4 w-4" />Eligible to donate</span>
                ) : (
                  <span className="flex items-center gap-2 text-warning font-medium"><UserX className="h-4 w-4" />Not eligible yet</span>
                )}
              </div>
              {lastDonation && <p className="text-xs text-muted-foreground mt-2 text-center">Last donation: {new Date(lastDonation).toLocaleDateString()}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Donations */}
          <Card>
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />Donation History</CardTitle></CardHeader>
            <CardContent>
              <ComponentErrorBoundary name="Donation History">
                {loadingDonations ? <Skeleton className="h-24 w-full" /> : donations.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No donations yet.</p> : (
                <div className="space-y-3">
                  {donations.map(d => (
                    <div key={d.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 group relative">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize">{d.type.replace("_", " ")}</p>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{d.volume}ml</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{d.center} • by {d.collectedBy}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-sm font-medium">{new Date(d.date).toLocaleDateString()}</span>
                        {user?.role !== "admin" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteDonationId(d.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </ComponentErrorBoundary>
            </CardContent>
          </Card>

          {/* Test Results */}
          {user?.role === "admin" && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Test Results</CardTitle></CardHeader>
            <CardContent>
              <ComponentErrorBoundary name="Test Results">
                {loadingTests ? <Skeleton className="h-24 w-full" /> : tests.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No test results.</p> : (
                <div className="space-y-3">
                  {tests.map(t => (
                    <div key={t.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50 group relative">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                        <span className="text-sm font-medium">{new Date(t.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          {t.hemoglobin && <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-md">Hb: {t.hemoglobin} g/dL</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div className="flex flex-col gap-1 items-start"><span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">HIV</span><StatusBadge status={t.hiv} /></div>
                        <div className="flex flex-col gap-1 items-start"><span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Hep B</span><StatusBadge status={t.hepatitisB} /></div>
                        <div className="flex flex-col gap-1 items-start"><span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Hep C</span><StatusBadge status={t.hepatitisC} /></div>
                        <div className="flex flex-col gap-1 items-start"><span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Syphilis</span><StatusBadge status={t.syphilis} /></div>
                        <div className="flex flex-col gap-1 items-start"><span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Blood Type</span><StatusBadge status={t.bloodTypingConfirmation} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </ComponentErrorBoundary>
            </CardContent>
          </Card>
          )}

          {/* Medical Notes */}
          {user?.role === "admin" && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Medical Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ComponentErrorBoundary name="Medical Notes">
                <div className="flex gap-2">
                <Textarea placeholder="Add a medical note..." value={noteContent} onChange={e => setNoteContent(e.target.value)} className="min-h-[60px] resize-y" />
                <Button onClick={() => addNoteMut.mutate({ donorId: donor.id, author: user?.name || "Staff", date: new Date().toISOString().split("T")[0], content: noteContent })} disabled={addNoteMut.isPending || !noteContent.trim()} className="self-end shrink-0">
                  {addNoteMut.isPending ? "..." : "Add"}
                </Button>
              </div>
              {loadingNotes ? <Skeleton className="h-20 w-full" /> : notes.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">No notes yet.</p> : (
                <div className="space-y-3">
                  {notes.map(n => (
                    <div key={n.id} className="p-3 rounded-lg bg-secondary/30 border-l-4 border-l-primary/50 group relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{n.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                </div>
                )}
              </ComponentErrorBoundary>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Edit Donor Dialog */}
      <Dialog open={editDonorOpen} onOpenChange={setEditDonorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Edit Donor Profile</DialogTitle></DialogHeader>
          <Form {...donorForm}>
            <form onSubmit={donorForm.handleSubmit(v => updateDonorMut.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FormField control={donorForm.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={donorForm.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={donorForm.control} name="gender" render={({ field }) => (
                  <FormItem><FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={donorForm.control} name="bloodType" render={({ field }) => (
                  <FormItem><FormLabel>Blood Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={donorForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="col-span-2">
                  <FormField control={donorForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-2">
                  <FormField control={donorForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-2">
                  <FormField control={donorForm.control} name="donationCenter" render={({ field }) => (
                    <FormItem><FormLabel>Donation Center</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
              
              <div className="border-t border-border pt-4 mt-2">
                <p className="text-sm font-medium mb-3">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={donorForm.control} name="emergencyContactName" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={donorForm.control} name="emergencyContactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="col-span-2">
                    <FormField control={donorForm.control} name="emergencyContactRelationship" render={({ field }) => (
                      <FormItem><FormLabel>Relationship</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={updateDonorMut.isPending}>
                {updateDonorMut.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!deleteDonorId} onOpenChange={(open) => !open && setDeleteDonorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Donor Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this donor and all associated donations, test results, and medical notes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteDonorId && deleteDonorMut.mutate(deleteDonorId)}>
              {deleteDonorMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Note?</AlertDialogTitle>
            <AlertDialogDescription>This note will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteNoteId && deleteNoteMut.mutate(deleteNoteId)}>
              {deleteNoteMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDonationId} onOpenChange={(open) => !open && setDeleteDonationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Donation Record?</AlertDialogTitle>
            <AlertDialogDescription>This donation and its associated test results will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteDonationId && deleteDonationMut.mutate(deleteDonationId)}>
              {deleteDonationMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTestId} onOpenChange={(open) => !open && setDeleteTestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Result?</AlertDialogTitle>
            <AlertDialogDescription>This test record will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteTestId && deleteTestMut.mutate(deleteTestId)}>
              {deleteTestMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
