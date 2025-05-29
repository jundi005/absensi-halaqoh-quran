// Sistem Autentikasi (gunakan hanya sekali di project)
const auth = {
    isLoggedIn: false,
    login(username, password) {
        // Di production, ganti dengan autentikasi ke server (bukan di frontend)
        const validUsers = [
            { username: 'admin', password: 'admin123', name: 'المشرف' },
            { username: 'musammi', password: 'musammi123', name: 'المسمّع' }
        ];
        const user = validUsers.find(u => u.username === username && u.password === password);
        if (user) {
            this.isLoggedIn = true;
            localStorage.setItem('authUser', JSON.stringify(user));
            return true;
        }
        return false;
    },
    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('authUser');
        window.location.href = 'index.html';
    },
    checkAuth() {
        const user = localStorage.getItem('authUser');
        if (user) {
            this.isLoggedIn = true;
            return JSON.parse(user);
        }
        // Redirect ke halaman login jika tidak terautentikasi
        if (!window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return null;
    }
};

// Handle Login Form
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginForm')) {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (auth.login(username, password)) {
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('loginError').textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                document.getElementById('loginError').style.display = 'block';
            }
        });
    }

    // Handle Logout
    const logoutButtons = document.querySelectorAll('#logoutBtn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            auth.logout();
        });
    });

    // Check Authentication on all pages except login
    if (!window.location.href.includes('index.html')) {
        const user = auth.checkAuth();
        if (user) {
            // Update user profile info
            const userProfiles = document.querySelectorAll('.user-profile span');
            userProfiles.forEach(span => {
                span.textContent = user.name;
            });
        }
    }

    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStrings = document.querySelectorAll('#currentDate');
    dateStrings.forEach(el => {
        el.textContent = now.toLocaleDateString('ar-EG', options);
    });

    // Toggle sidebar on mobile
    const toggleSidebar = document.querySelector('.toggle-sidebar');
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
});

// Konfigurasi Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbyVqHfUBVirkNYLy80x59M3CQTVSmqiadFAtaQWgOw55iYjiinqA1BvEYlecT8zpimh/exec'; // GANTI dengan URL Apps Script Anda

// Fungsi untuk mengirim data ke Google Sheet
async function sendToSheet(data, sheetName) {
    try {
        const payload = { sheet: sheetName, data: data };
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Fungsi untuk mengambil data dari Google Sheet
async function getFromSheet(sheetName, filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('sheet', sheetName);
        for (const [key, value] of Object.entries(filters)) {
            if (value) queryParams.append(key, value);
        }
        const response = await fetch(`${scriptURL}?${queryParams.toString()}`);
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
