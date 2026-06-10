import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hfbudnmvjbzvpefvtiuu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYnVkbm12amJ6dnBlZnZ0aXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE2NTgsImV4cCI6MjA2Mjk2NzY1OH0.ionCach1O5vekQDoP7Bx6pSVaLXduJN9kYbWwlaRzKk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);