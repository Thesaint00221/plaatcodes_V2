const SUPABASE_URL = "https://tiuxjwaovmchswunwouz.supabase.co";

const SUPABASE_KEY = "JOUW_PUBLISHABLE_KEY";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase geladen");
