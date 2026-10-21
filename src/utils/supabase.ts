import { createClient } from '@supabase/supabase-js';

// Notice the single quotes (' ') around the URL and the Key!
const supabaseUrl = 'https://zspdbfimiemxlexlaohl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcGRiZmltaWVteGxleGxhb2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NjQzODQsImV4cCI6MjEwODE0MDM4NH0.hJj5JfydR1rc7cNcv_j9HpyOTl9WYNei_T_O_va4Eyc';

export const supabase = createClient(supabaseUrl, supabaseKey);