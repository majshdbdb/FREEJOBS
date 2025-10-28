// Authentication functions
class AuthManager {
    constructor() {
        this.supabase = window.supabase;
    }

    // Register new user
    async register(userData) {
        try {
            console.log('Starting registration process...');
            
            // 1. Create auth user
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        user_type: userData.userType
                    }
                }
            });

            if (authError) throw authError;

            // 2. Create profile
            const profileData = {
                id: authData.user.id,
                email: userData.email,
                full_name: userData.fullName,
                user_type: userData.userType,
                skills: userData.skills ? userData.skills.split(',').map(skill => skill.trim()) : [],
                hourly_rate: userData.hourlyRate || null,
                company: userData.company || null,
                created_at: new Date().toISOString()
            };

            const { error: profileError } = await this.supabase
                .from('profiles')
                .insert([profileData]);

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Continue anyway as auth user is created
            }

            // 3. Create wallet for user
            const { error: walletError } = await this.supabase
                .from('wallets')
                .insert([
                    {
                        user_id: authData.user.id,
                        current_balance: 0,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (walletError) {
                console.error('Wallet creation error:', walletError);
            }

            return { success: true, user: authData.user };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    // Check if user is authenticated
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return !!user;
    }

    // Redirect if not authenticated
    async requireAuth(redirectUrl = 'login.html') {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            window.location.href = redirectUrl;
        }
    }
}

// Initialize auth manager
window.authManager = new AuthManager();

// Registration form handler
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            
            // Collect form data
            const formData = {
                userType: document.getElementById('userType').value,
                fullName: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                skills: document.getElementById('skills')?.value,
                hourlyRate: document.getElementById('hourlyRate')?.value,
                company: document.getElementById('company')?.value
            };
            
            // Validation
            if (!formData.userType) {
                showMessage('Pilih peran Anda (freelancer atau client)', 'error', messageDiv);
                return;
            }
            
            if (formData.password !== formData.confirmPassword) {
                showMessage('Password dan konfirmasi password tidak cocok', 'error', messageDiv);
                return;
            }
            
            if (formData.password.length < 6) {
                showMessage('Password harus minimal 6 karakter', 'error', messageDiv);
                return;
            }
            
            // Show loading
            submitBtn.textContent = 'Mendaftarkan...';
            submitBtn.disabled = true;
            
            // Register user
            const result = await window.authManager.register(formData);
            
            if (result.success) {
                showMessage('✅ Registrasi berhasil! Silakan cek email untuk verifikasi.', 'success', messageDiv);
                registerForm.reset();
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                let errorMessage = result.error;
                if (result.error.includes('already registered')) {
                    errorMessage = 'Email sudah terdaftar';
                } else if (result.error.includes('invalid email')) {
                    errorMessage = 'Format email tidak valid';
                }
                showMessage('❌ ' + errorMessage, 'error', messageDiv);
            }
            
            // Reset button
            submitBtn.textContent = 'Daftar Sekarang';
            submitBtn.disabled = false;
        });
    }
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showMessage('Harap isi semua field', 'error', messageDiv);
                return;
            }
            
            // Show loading
            submitBtn.textContent = 'Masuk...';
            submitBtn.disabled = true;
            
            // Login user
            const result = await window.authManager.login(email, password);
            
            if (result.success) {
                showMessage('✅ Login berhasil! Mengalihkan...', 'success', messageDiv);
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                let errorMessage = result.error;
                if (result.error.includes('Invalid login credentials')) {
                    errorMessage = 'Email atau password salah';
                } else if (result.error.includes('Email not confirmed')) {
                    errorMessage = 'Email belum diverifikasi. Silakan cek email Anda';
                }
               
