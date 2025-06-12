document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registroForm');
    const mensajeDiv = document.getElementById('mensaje');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            mensajeDiv.textContent = '';
            const nombre = form.nombre.value;
            const email = form.email.value;
            const telefono = form.telefono.value;
            const password = form.password.value;

            const res = await fetch('/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, telefono, password })
            });

            const data = await res.json();

            if (data.success) {
                mensajeDiv.style.color = 'green';
                mensajeDiv.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión.';
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                mensajeDiv.style.color = 'red';
                mensajeDiv.textContent = data.message || 'Error al registrar usuario';
            }
        });
    }
});