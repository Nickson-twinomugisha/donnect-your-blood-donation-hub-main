import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getMedicalNotes, getDonors, addMedicalNote, updateMedicalNote, deleteMedicalNote, type MedicalNote } from "@/lib/mock-data";
import { medicalNoteSchema, type MedicalNoteFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";

export default function MedicalNotesPage() {
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

  const { data: notesData, isLoading: loadingNotes } = useQuery({ 
    queryKey: ["notes", page, pageSize, debouncedSearch], 
    queryFn: () => getMedicalNotes(page, pageSize, debouncedSearch) 
  });
  const { data: donorsData, isLoading: loadingDonors } = useQuery({ 
    queryKey: ["donors", "all"], 
    queryFn: () => getDonors(0, 1000) 
  });
  const donors = useMemo(() => donorsData?.donors || [], [donorsData]);

  const notes = notesData?.notes || [];
  const totalCount = notesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const form = useForm<MedicalNoteFormValues>({
    resolver: zodResolver(medicalNoteSchema),
    defaultValues: {
      donorId: "",
      content: "",
    }
  });

  const addMutation = useMutation({
    mutationFn: addMedicalNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData(["notes"], (old: MedicalNote[]) => [newNote, ...(old || [])]);
      setDialogOpen(false);
      form.reset();
      toast({ title: "Medical note added" });
    },
    onError: (err) => {
      toast({ title: "Failed to add note", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: MedicalNoteFormValues) => updateMedicalNote(editId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setDialogOpen(false);
      setEditId(null);
      form.reset();
      toast({ title: "Medical note updated" });
    },
    onError: (err) => {
      toast({ title: "Failed to update note", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMedicalNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setDeleteId(null);
      toast({ title: "Medical note deleted" });
    },
    onError: (err) => {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  });

  const enrichedNotes = useMemo(() => {
    return notes.map(n => ({
      ...n,
      donorName: (n as any).donors?.full_name || donors.find(d => d.id === n.donorId)?.fullName || "Unknown",
    }));
  }, [notes, donors]);

  const onSubmit = (values: MedicalNoteFormValues) => {
    if (editId) {
      updateMutation.mutate(values);
    } else {
      addMutation.mutate({
        donorId: values.donorId,
        author: user?.name || "Staff",
        date: new Date().toISOString().split("T")[0],
        content: values.content,
      });
    }
  };

  const handleEdit = (note: MedicalNote) => {
    setEditId(note.id);
    form.reset({
      donorId: note.donorId,
      content: note.content,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Medical Notes</h1>
          <p className="text-muted-foreground">{notes.length} notes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditId(null);
            form.reset({ donorId: "", content: "" });
          }
        }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Note</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Medical Note" : "Add Medical Note"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="donorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingDonors}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select donor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {donors.map(d => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl><Textarea placeholder="Enter medical note..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={addMutation.isPending || updateMutation.isPending || loadingDonors}>
                  {editId ? (updateMutation.isPending ? "Saving..." : "Save Changes") : (addMutation.isPending ? "Adding..." : "Add Note")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {loadingNotes ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : enrichedNotes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
            No medical notes found.
          </div>
        ) : (
          enrichedNotes.map(n => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{n.donorName}</span>
                    <span className="text-xs text-muted-foreground">• by {n.author}</span>
                    <span className="text-xs text-muted-foreground">• {new Date(n.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(n)}><Edit2 className="h-3.5 w-3.5 mr-2" />Edit Note</DropdownMenuItem>
                        {user?.role === "admin" && (
                          <DropdownMenuItem onClick={() => setDeleteId(n.id)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete Note
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{n.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="py-2">
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this medical note. This action cannot be undone.
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
