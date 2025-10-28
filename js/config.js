// Supabase Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Initialize Supabase
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase initialized successfully');

// Utility functions
window.formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

window.getUserRole = async () => {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await window.supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
        
    return profile?.user_type;
};
