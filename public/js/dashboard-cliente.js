document.addEventListener('DOMContentLoaded', async function () {
    // Cargar mascotas y veterinarios
    const mascotaSelect = document.getElementById('mascota');
    const veterinarioSelect = document.getElementById('veterinario');
    const mensajeCita = document.getElementById('mensaje-cita');
    const citasContainer = document.getElementById('citas-container');

    try {
        // Cargar mascotas propias - CORREGIDO: usar ruta API completa
        const mascotasRes = await fetch('/api/mascotas', {
            method: 'GET',
            credentials: 'include' // IMPORTANTE: incluir cookies de sesión
        });
        
        if (!mascotasRes.ok) {
            throw new Error(`Error ${mascotasRes.status}: ${mascotasRes.statusText}`);
        }
        
        const mascotasData = await mascotasRes.json();
        const mascotas = mascotasData.mascotas || [];
        
        mascotaSelect.innerHTML = mascotas.length
            ? mascotas.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')
            : '<option value="">No tienes mascotas registradas</option>';

        // Cargar veterinarios - CORREGIDO: usar ruta API completa
        const vetsRes = await fetch('/api/veterinarios', {
            method: 'GET',
            credentials: 'include' // IMPORTANTE: incluir cookies de sesión
        });
        
        if (!vetsRes.ok) {
            throw new Error(`Error ${vetsRes.status}: ${vetsRes.statusText}`);
        }
        
        const vetsData = await vetsRes.json();
        const veterinarios = vetsData.veterinarios || [];
        
        veterinarioSelect.innerHTML = '<option value="">Seleccionar veterinario (opcional)</option>' + 
            veterinarios.map(v => `<option value="${v.id}">${v.nombre}</option>`).join('');

    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        mensajeCita.style.color = 'red';
        mensajeCita.textContent = 'Error al cargar datos iniciales';
    }

    // Agendar nueva cita - CORREGIDO
    document.getElementById('form-nueva-cita').addEventListener('submit', async function (e) {
        e.preventDefault();
        mensajeCita.textContent = '';
        
        // VALIDACIONES del lado del cliente
        const mascotaId = mascotaSelect.value;
        const fechaCita = document.getElementById('fecha_cita').value;
        const motivo = document.getElementById('motivo').value.trim();
        
        if (!mascotaId) {
            mensajeCita.style.color = 'red';
            mensajeCita.textContent = 'Debes seleccionar una mascota';
            return;
        }
        
        if (!fechaCita) {
            mensajeCita.style.color = 'red';
            mensajeCita.textContent = 'Debes seleccionar una fecha y hora';
            return;
        }
        
        if (!motivo) {
            mensajeCita.style.color = 'red';
            mensajeCita.textContent = 'Debes especificar el motivo de la cita';
            return;
        }
        
        // Validar que la fecha sea futura
        const fechaSeleccionada = new Date(fechaCita);
        const ahora = new Date();
        
        if (fechaSeleccionada <= ahora) {
            mensajeCita.style.color = 'red';
            mensajeCita.textContent = 'La fecha debe ser futura';
            return;
        }
        
        const data = {
            mascota_id: parseInt(mascotaId), // CORREGIDO: convertir a número
            veterinario_id: veterinarioSelect.value ? parseInt(veterinarioSelect.value) : null, // CORREGIDO: manejar valor vacío
            fecha_cita: fechaCita,
            motivo: motivo,
            observaciones: document.getElementById('observaciones')?.value?.trim() || null
        };
        
        try {
            // CORREGIDO: usar ruta API completa y credentials
            const res = await fetch('/api/citas', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // IMPORTANTE: incluir cookies de sesión
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if (res.ok && result.success) {
                mensajeCita.style.color = 'green';
                mensajeCita.textContent = result.message || 'Cita agendada exitosamente';
                document.getElementById('form-nueva-cita').reset(); // Limpiar formulario
                cargarCitas(); // Recargar lista de citas
            } else {
                mensajeCita.style.color = 'red';
                mensajeCita.textContent = result.message || 'Error al agendar cita';
                
                // Log detallado del error
                console.error('Error al crear cita:', {
                    status: res.status,
                    statusText: res.statusText,
                    response: result
                });
            }
        } catch (error) {
            console.error('Error de red:', error);
            mensajeCita.style.color = 'red';
            mensajeCita.textContent = 'Error de conexión. Intenta nuevamente.';
        }
    });

    // Cargar citas propias - CORREGIDO
    async function cargarCitas() {
        try {
            const res = await fetch('/api/citas', {
                method: 'GET',
                credentials: 'include' // IMPORTANTE: incluir cookies de sesión
            });
            
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            
            if (data.success) {
                citasContainer.innerHTML = data.citas.length > 0 
                    ? data.citas.map(c => `
                        <div class="cita-card">
                            <b>${new Date(c.fecha_cita).toLocaleString()}</b> - ${c.motivo} <br>
                            Estado: <span class="estado-${c.estado}">${c.estado}</span> <br>
                            Veterinario: ${c.veterinario_nombre || 'Sin asignar'} <br>
                            Mascota: ${c.mascota_nombre || 'N/A'}
                            ${c.observaciones ? `<br>Observaciones: ${c.observaciones}` : ''}
                        </div>
                    `).join('')
                    : '<p>No tienes citas agendadas</p>';
            } else {
                citasContainer.innerHTML = '<p>Error al cargar las citas</p>';
                console.error('Error al cargar citas:', data.message);
            }
        } catch (error) {
            console.error('Error al cargar citas:', error);
            citasContainer.innerHTML = '<p>Error de conexión al cargar las citas</p>';
        }
    }
    
    // Cargar citas al inicializar
    cargarCitas();
});

// Cerrar sesión - CORREGIDO
function logout() {
    fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' // IMPORTANTE: incluir cookies de sesión
    })
    .then(() => window.location.href = '/login.html')
    .catch(error => {
        console.error('Error al cerrar sesión:', error);
        // Redirigir de todas formas
        window.location.href = '/login.html';
    });
}