document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error-message');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errorDiv.style.display = 'none';
            const email = form.email.value;
            const password = form.password.value;

            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                // Redirige según el rol
                let destino = '/dashboard-cliente.html';
                if (data.usuario.rol === 'admin') destino = '/dashboard-cliente.html';
                else if (data.usuario.rol === 'veterinario') destino = '/dashboard-cliente.html';
                window.location.href = destino;
            } else {
                errorDiv.textContent = data.message || 'Error al iniciar sesión';
                errorDiv.style.display = 'block';
            }
        });
    }
});