const SUPABASE_URL = "https://tiuxjwaovmchswunwouz.supabase.co";

const SUPABASE_KEY = "sb_publishable_uyEOCnVUSLTO5PDFn8tepw_SdN7hHQ6";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase geladen");
