const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://hxicdshfsslwfikokfly.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aWNkc2hmc3Nsd2Zpa29rZmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTk4NDcsImV4cCI6MjA3MTk3NTg0N30.GN_how0pBwr_Ffomgotu6xRQ2ar73eR8m8iM_KHt_lI"
);

module.exports = supabase;