export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const userAgent = request.headers.get("User-Agent") || "";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // 1. Check if user exists
    const user = await env.DB.prepare(
      "SELECT * FROM usuarios WHERE username = ? AND password = ?"
    ).bind(username, password).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Credenciales inválidas" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Security Check: Mobile Access
    if (isMobile) {
      const setting = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'mobile_login_enabled'").first();
      const enabled = setting ? setting.valor === 'true' : true;
      if (!enabled) {
        return new Response(JSON.stringify({ error: "El acceso desde dispositivos móviles está deshabilitado por el administrador." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Retornamos el usuario y sus permisos
    return new Response(JSON.stringify({
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      username: user.username,
      preceptor_course_id: user.preceptor_course_id,
      professor_course_ids: user.professor_course_ids,
      professor_subject_ids: user.professor_subject_ids,
      token: "auth-token-" + user.id // Simple token for verification
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
