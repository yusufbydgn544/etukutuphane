
import { createClient } from '@supabase/supabase-js';

// ÖNEMLİ: Bu bilgileri kendi Supabase proje bilgilerinizle değiştirmelisiniz.
// URL 'https://' ile başlamalıdır.
// Supabase Dashboard -> Project Settings -> API kısmından bulabilirsiniz.

const SUPABASE_URL = 'https://zyrndsleztkuksxasnot.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cm5kc2xlenRrdWtzeGFzbm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDc0NTYsImV4cCI6MjA3OTk4MzQ1Nn0.fgN8UXE-txQ1V9WORjC048kxAF9BMnkWDRnIVPY6i_c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
