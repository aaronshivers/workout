export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string | null;
          name: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string | null;
          name?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string | null;
          name?: string | null;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: number;
          name: string;
          created_at: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      muscle_groups: {
        Row: {
          id: number;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      exercise_muscle_groups: {
        Row: {
          exercise_id: number;
          muscle_group_id: number;
          created_at: string | null;
        };
        Insert: {
          exercise_id: number;
          muscle_group_id: number;
          created_at?: string | null;
        };
        Update: {
          exercise_id?: number;
          muscle_group_id?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_groups_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_muscle_groups_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: {
          id: number;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sets: {
        Row: {
          id: number;
          workout_id: number;
          exercise_id: number;
          sets: number;
          reps: number;
          weight: number;
          rpe: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          workout_id: number;
          exercise_id: number;
          sets: number;
          reps: number;
          weight: number;
          rpe: number;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          workout_id?: number;
          exercise_id?: number;
          sets?: number;
          reps?: number;
          weight?: number;
          rpe?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sets_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
