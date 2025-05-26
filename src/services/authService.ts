import { supabase } from '../utils/supabase';
import type { User, Session } from '@supabase/supabase-js';

export class SupabaseAuthService {
  static async getUserData(): Promise<User | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    return session?.user || null;
  }

  static async login(data: { email: string; password: string }): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;
  }

  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void,
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async checkSession(): Promise<User | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user || null;
  }
}
