import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://azazorhncssduxawushs.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YXpvcmhuY3NzZHV4YXd1c2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Mzk3NDIsImV4cCI6MjA1OTMxNTc0Mn0.FJIZItjbsw3bWn3-h2KNJahDdIhz_LS1mYHyJJUSsUE";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
