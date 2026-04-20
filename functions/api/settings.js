export async function onRequestGet({ env }) {
  try {
    const setting = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'mobile_login_enabled'").first();
    return new Response(JSON.stringify({ 
      mobile_login_enabled: setting ? setting.valor === 'true' : true 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
