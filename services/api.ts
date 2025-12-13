import type { User, Therapist, Appointment, SignupFormData } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Auth API - Uses Supabase Auth + Profiles table
 */
export const authApi = {
  signup: async (data: SignupFormData): Promise<User> => {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar || undefined,
      createdAt: profile.created_at,
    };
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) return null;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar || undefined,
      createdAt: profile.created_at,
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar || undefined,
      createdAt: profile.created_at,
    };
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

/**
 * Therapists API
 */
export const therapistsApi = {
  getAll: async (): Promise<Therapist[]> => {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(transformTherapist);
  },

  getById: async (id: string): Promise<Therapist | null> => {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return transformTherapist(data);
  },

  search: async (query: string): Promise<Therapist[]> => {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .or(`name.ilike.%${query}%,bio.ilike.%${query}%,specialization.cs.{${query}}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(transformTherapist);
  },
};

/**
 * Appointments API
 */
export const appointmentsApi = {
  create: async (
    therapistId: string,
    patientId: string,
    scheduledAt: string
  ): Promise<Appointment> => {
    // Get therapist and patient names
    const { data: therapist } = await supabase
      .from('therapists')
      .select('name')
      .eq('id', therapistId)
      .single();

    const { data: patient } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', patientId)
      .single();

    if (!therapist || !patient) {
      throw new Error('Therapist or patient not found');
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        therapist_id: therapistId,
        patient_id: patientId,
        therapist_name: therapist.name,
        patient_name: patient.name,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        room_id: `room-${Date.now()}`,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      therapistId: data.therapist_id,
      patientId: data.patient_id,
      therapistName: data.therapist_name,
      patientName: data.patient_name,
      scheduledAt: data.scheduled_at,
      status: data.status,
      roomId: data.room_id,
    };
  },

  getByUserId: async (userId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`patient_id.eq.${userId},therapist_id.eq.${userId}`)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data.map(transformAppointment);
  },

  getById: async (id: string): Promise<Appointment | null> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return transformAppointment(data);
  },

  updateStatus: async (
    id: string,
    status: Appointment['status']
  ): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformAppointment(data);
  },
};

// Helper functions to transform database rows to our types
function transformTherapist(row: any): Therapist {
  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization || [],
    bio: row.bio,
    avatar: row.avatar || undefined,
    isStudent: row.is_student,
    hourlyRate: row.hourly_rate,
    rating: row.rating || 0,
    reviewCount: row.review_count || 0,
    languages: row.languages || [],
    availableSlots: row.available_slots || [],
  };
}

function transformAppointment(row: any): Appointment {
  return {
    id: row.id,
    therapistId: row.therapist_id,
    patientId: row.patient_id,
    therapistName: row.therapist_name,
    patientName: row.patient_name,
    scheduledAt: row.scheduled_at,
    status: row.status,
    roomId: row.room_id,
  };
}
