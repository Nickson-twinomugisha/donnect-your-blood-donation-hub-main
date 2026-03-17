import { supabase } from "@/lib/supabase";

// ─── Types (camelCase for TypeScript) ─────────────────────────────────────────

export type UserRole = "admin" | "staff";

export interface Donor {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  donationCenter: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  date: string;
  type: "whole_blood" | "plasma" | "platelets";
  volume: number;
  center: string;
  collectedBy: string;
  bloodType: string;
}

export interface TestResult {
  id: string;
  donationId: string;
  donorId: string;
  donorName: string;
  date: string;
  hiv: "pass" | "fail" | "pending";
  hepatitisB: "pass" | "fail" | "pending";
  hepatitisC: "pass" | "fail" | "pending";
  syphilis: "pass" | "fail" | "pending";
  bloodTypingConfirmation: "pass" | "fail" | "pending";
  hemoglobin: number | null;
}

export interface MedicalNote {
  id: string;
  donorId: string;
  author: string;
  date: string;
  content: string;
}

// ─── Mapping helpers (snake_case DB ↔ camelCase TS) ──────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDonor(row: any): Donor {
  return {
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodType: row.blood_type,
    phone: row.phone,
    email: row.email,
    address: row.address,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    donationCenter: row.donation_center,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDonation(row: any): Donation {
  return {
    id: row.id,
    donorId: row.donor_id,
    donorName: row.donor_name,
    date: row.date,
    type: row.type,
    volume: row.volume,
    center: row.center,
    collectedBy: row.collected_by,
    bloodType: row.blood_type,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTestResult(row: any): TestResult {
  return {
    id: row.id,
    donationId: row.donation_id,
    donorId: row.donor_id,
    donorName: row.donor_name,
    date: row.date,
    hiv: row.hiv,
    hepatitisB: row.hepatitis_b,
    hepatitisC: row.hepatitis_c,
    syphilis: row.syphilis,
    bloodTypingConfirmation: row.blood_typing_confirmation,
    hemoglobin: row.hemoglobin,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMedicalNote(row: any): MedicalNote {
  return {
    id: row.id,
    donorId: row.donor_id,
    author: row.author,
    date: row.date,
    content: row.content,
  };
}

// ─── Donors ───────────────────────────────────────────────────────────────────

export async function getDonors(
  page?: number, 
  pageSize?: number,
  search?: string,
  bloodType?: string
): Promise<{ donors: Donor[]; count: number | null }> {
  let query = supabase
    .from("donors")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (bloodType && bloodType !== "all") {
    query = query.eq("blood_type", bloodType);
  }

  query = query.order("full_name", { ascending: true });

  if (page !== undefined && pageSize !== undefined) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { donors: (data ?? []).map(mapDonor), count };
}

export async function getDonor(id: string): Promise<Donor | null> {
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapDonor(data);
}

export async function addDonor(donor: Omit<Donor, "id" | "createdAt">): Promise<Donor> {
  const { data, error } = await supabase
    .from("donors")
    .insert({
      full_name: donor.fullName,
      date_of_birth: donor.dateOfBirth,
      gender: donor.gender,
      blood_type: donor.bloodType,
      phone: donor.phone,
      email: donor.email,
      address: donor.address,
      emergency_contact_name: donor.emergencyContactName,
      emergency_contact_phone: donor.emergencyContactPhone,
      emergency_contact_relationship: donor.emergencyContactRelationship,
      donation_center: donor.donationCenter,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDonor(data);
}

export async function updateDonor(id: string, donor: Partial<Omit<Donor, "id" | "createdAt">>): Promise<Donor> {
  const { data, error } = await supabase
    .from("donors")
    .update({
      full_name: donor.fullName,
      date_of_birth: donor.dateOfBirth,
      gender: donor.gender,
      blood_type: donor.bloodType,
      phone: donor.phone,
      email: donor.email,
      address: donor.address,
      emergency_contact_name: donor.emergencyContactName,
      emergency_contact_phone: donor.emergencyContactPhone,
      emergency_contact_relationship: donor.emergencyContactRelationship,
      donation_center: donor.donationCenter,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapDonor(data);
}

export async function deleteDonor(id: string): Promise<void> {
  const { error } = await supabase.from("donors").delete().eq("id", id);
  if (error) throw error;
}

// ─── Donations ────────────────────────────────────────────────────────────────

export async function getDonations(
  page?: number, 
  pageSize?: number,
  search?: string
): Promise<{ donations: Donation[]; count: number | null }> {
  let query = supabase
    .from("donations")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`donor_name.ilike.%${search}%,center.ilike.%${search}%`);
  }

  query = query.order("date", { ascending: false });

  if (page !== undefined && pageSize !== undefined) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { donations: (data ?? []).map(mapDonation), count };
}

export async function getDonationsByDonor(donorId: string): Promise<Donation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("donor_id", donorId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDonation);
}

export async function addDonation(donation: Omit<Donation, "id">): Promise<Donation> {
  const { data, error } = await supabase
    .from("donations")
    .insert({
      donor_id: donation.donorId,
      donor_name: donation.donorName,
      date: donation.date,
      type: donation.type,
      volume: donation.volume,
      center: donation.center,
      collected_by: donation.collectedBy,
      blood_type: donation.bloodType,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDonation(data);
}

export async function updateDonation(id: string, donation: Partial<Omit<Donation, "id">>): Promise<Donation> {
  const { data, error } = await supabase
    .from("donations")
    .update({
      donor_id: donation.donorId,
      donor_name: donation.donorName,
      date: donation.date,
      type: donation.type,
      volume: donation.volume,
      center: donation.center,
      collected_by: donation.collectedBy,
      blood_type: donation.bloodType,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapDonation(data);
}

export async function deleteDonation(id: string): Promise<void> {
  const { error } = await supabase.from("donations").delete().eq("id", id);
  if (error) throw error;
}

// ─── Test Results ─────────────────────────────────────────────────────────────

export async function getTestResults(
  page?: number, 
  pageSize?: number,
  search?: string
): Promise<{ results: TestResult[]; count: number | null }> {
  let query = supabase
    .from("test_results")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`donor_name.ilike.%${search}%`);
  }

  query = query.order("date", { ascending: false });

  if (page !== undefined && pageSize !== undefined) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { results: (data ?? []).map(mapTestResult), count };
}

export async function getTestResultsByDonor(donorId: string): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("donor_id", donorId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTestResult);
}

export async function addTestResult(result: Omit<TestResult, "id">): Promise<TestResult> {
  const { data, error } = await supabase
    .from("test_results")
    .insert({
      donation_id: result.donationId,
      donor_id: result.donorId,
      donor_name: result.donorName,
      date: result.date,
      hiv: result.hiv,
      hepatitis_b: result.hepatitisB,
      hepatitis_c: result.hepatitisC,
      syphilis: result.syphilis,
      blood_typing_confirmation: result.bloodTypingConfirmation,
      hemoglobin: result.hemoglobin,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTestResult(data);
}

export async function updateTestResult(id: string, result: Partial<Omit<TestResult, "id">>): Promise<TestResult> {
  const { data, error } = await supabase
    .from("test_results")
    .update({
      donation_id: result.donationId,
      donor_id: result.donorId,
      donor_name: result.donorName,
      date: result.date,
      hiv: result.hiv,
      hepatitis_b: result.hepatitisB,
      hepatitis_c: result.hepatitisC,
      syphilis: result.syphilis,
      blood_typing_confirmation: result.bloodTypingConfirmation,
      hemoglobin: result.hemoglobin,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapTestResult(data);
}

export async function deleteTestResult(id: string): Promise<void> {
  const { error } = await supabase.from("test_results").delete().eq("id", id);
  if (error) throw error;
}

// ─── Medical Notes ────────────────────────────────────────────────────────────

export async function getMedicalNotes(
  page?: number, 
  pageSize?: number,
  search?: string
): Promise<{ notes: MedicalNote[]; count: number | null }> {
  let query = supabase
    .from("medical_notes")
    .select("*, donors!inner(full_name)", { count: "exact" });

  // Handle donor_name search
  if (search) {
    query = query.or(`donors.full_name.ilike.%${search}%,author.ilike.%${search}%`);
  }

  query = query.order("date", { ascending: false });

  if (page !== undefined && pageSize !== undefined) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { notes: (data ?? []).map(mapMedicalNote), count };
}

export async function getMedicalNotesByDonor(donorId: string): Promise<MedicalNote[]> {
  const { data, error } = await supabase
    .from("medical_notes")
    .select("*")
    .eq("donor_id", donorId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMedicalNote);
}

export async function addMedicalNote(note: Omit<MedicalNote, "id">): Promise<MedicalNote> {
  const { data, error } = await supabase
    .from("medical_notes")
    .insert({
      donor_id: note.donorId,
      author: note.author,
      date: note.date,
      content: note.content,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMedicalNote(data);
}

export async function updateMedicalNote(id: string, note: Partial<Omit<MedicalNote, "id">>): Promise<MedicalNote> {
  const { data, error } = await supabase
    .from("medical_notes")
    .update({
      donor_id: note.donorId,
      author: note.author,
      date: note.date,
      content: note.content,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapMedicalNote(data);
}

export async function deleteMedicalNote(id: string): Promise<void> {
  const { error } = await supabase.from("medical_notes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Eligibility Helpers ──────────────────────────────────────────────────────

export async function getLastDonationDate(donorId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("donations")
    .select("date")
    .eq("donor_id", donorId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.date;
}

export async function isEligibleToDonate(donorId: string): Promise<boolean> {
  const lastDate = await getLastDonationDate(donorId);
  if (!lastDate) return true;
  const daysSince = Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSince >= 56;
}
