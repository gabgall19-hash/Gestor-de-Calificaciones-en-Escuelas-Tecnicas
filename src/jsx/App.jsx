import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, ClipboardList, Eye, Megaphone } from 'lucide-react';
import PreceptorPanel from './panels/PreceptorPanel';
import StudentView from './panels/StudentView';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [dniSearch, setDniSearch] = useState('');
  const [boletinPassword, setBoletinPassword] = useState('');
  const [showBoletinPassword, setShowBoletinPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [appVersion, setAppVersion] = useState(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileLoginEnabled, setMobileLoginEnabled] = useState(true);
  const [publicAnuncios, setPublicAnuncios] = useState([]);
  
  const checkVersion = (serverVersion) => {
    if (!serverVersion) return;
    if (!appVersion) {
      setAppVersion(serverVersion);
    } else if (appVersion !== serverVersion) {
      setNewVersionAvailable(true);
    }
  };
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('loginData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setLoginData(parsed);
      setRememberMe(true);
    }
  }, []);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        // Ensure boolean conversion if it comes as string
        const isEnabled = data.mobile_login_enabled === true || data.mobile_login_enabled === 'true';
        setMobileLoginEnabled(isEnabled);
        checkVersion(data.version);
      })
      .catch(err => console.error("Error fetching settings:", err));

    fetch('/api/data?type=public_anuncios')
      .then(res => res.json())
      .then(data => setPublicAnuncios(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching announcements:", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (rememberMe) {
      localStorage.setItem('loginData', JSON.stringify({ username, password }));
    } else {
      localStorage.removeItem('loginData');
    }

    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (data.error) {
        alert(data.error);
      } else {
        setUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
        navigate('/dashboard');
        showToast('Te has conectado a tu sesión', 'success');
      }
    } catch (err) {
      alert("Error al conectar con el servidor: " + err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    navigate('/');
    showToast('Te has desconectado de tu sesión', 'danger');
  };

  const handleStudentSearch = (e) => {
    e.preventDefault();
    if (String(dniSearch).length === 8) {
      navigate('/boletin');
    } else {
      alert("El DNI debe tener 8 dígitos.");
    }
  };

  const Toast = ({ message, type, onExited }) => {
    const [isExiting, setIsExiting] = React.useState(false);
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onExited, 400);
      }, 3500);
      return () => clearTimeout(timer);
    }, [onExited]);

    return (
      <div className={isExiting ? "toast-out" : "toast-in"} style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '30px', 
        background: type === 'success' ? '#10b981' : '#ef4444', 
        color: 'white', 
        padding: '12px 24px', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        zIndex: 10000,
        fontWeight: '700',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {type === 'success' ? '✓' : '✕'} {message}
      </div>
    );
  };

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="container" style={{ maxWidth: isDashboard ? 'min(1680px, 96vw)' : '1200px', margin: '0 auto', padding: isDashboard ? '1.25rem' : '2rem' }}>
      <div className="bg-slide" style={{ backgroundImage: "url('/foto1.jpg')", animationDelay: '0s' }}></div>
      <div className="bg-slide" style={{ backgroundImage: "url('/foto2.jpg')", animationDelay: '10s' }}></div>
      <div className="bg-slide" style={{ backgroundImage: "url('/foto3.jpg')", animationDelay: '20s' }}></div>

      {toast && (
        <Toast 
          key={toast.id}
          message={toast.message} 
          type={toast.type} 
          onExited={() => setToast(null)} 
        />
      )}

      {newVersionAvailable && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          background: '#f59e0b', 
          color: 'black', 
          padding: '10px', 
          textAlign: 'center', 
          zIndex: 10001,
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          🚀 Hay una nueva actualización disponible para mejorar el sistema.
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              background: 'black', 
              color: 'white', 
              border: 'none', 
              padding: '5px 15px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Actualizar ahora
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : (
          <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '380px 1fr', 
          gap: '2rem', 
          marginTop: isMobile ? '1rem' : '2vh', 
          alignItems: 'start',
          maxHeight: isMobile ? 'none' : 'calc(100vh - 4vh)',
          overflow: 'hidden'
        }}>
          {/* Columna Izquierda: Login + Buscador */}
          <div className="flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Admin/Preceptor Login */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
                <h2 style={{ fontSize: '1.1rem' }}>Acceso Institucional</h2>
              </div>

              {isMobile && (
                <div style={{ 
                  background: mobileLoginEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.2)', 
                  border: `1px solid ${mobileLoginEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.5)'}`, 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  marginBottom: '1.2rem',
                  color: mobileLoginEnabled ? '#10b981' : '#ff4d4d',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {mobileLoginEnabled ? (
                    <>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                      Acceso móvil habilitado
                    </>
                  ) : (
                    "Acceso deshabilitado en móviles."
                  )}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem' }}>Usuario</label>
                  <input type="text" name="username" className="input-field" placeholder="Usuario" required style={{ padding: '0.6rem' }} />
                </div>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem' }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      className="input-field" 
                      placeholder="••••••••" 
                      required 
                      style={{ padding: '0.6rem', paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showPassword ? <Eye size={16} /> : <span>👁️</span>}
                    </button>
                  </div>
                </div>
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                  <label htmlFor="remember" style={{ margin: 0, fontSize: '0.85rem' }}>Recordarme</label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isMobile && !mobileLoginEnabled}>
                  <LogIn size={18} /> Ingresar
                </button>
              </form>
            </div>

            {/* Student Search (Compacted) */}
            <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid var(--success)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="var(--success)" /> Ver Boletín
              </h3>
              <form onSubmit={handleStudentSearch}>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem' }}>Usuario (DNI)</label>
                  <input 
                    type="text" 
                    value={dniSearch}
                    onChange={(e) => setDniSearch(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="input-field" 
                    placeholder="DNI del Alumno" 
                    style={{ width: '100%', padding: '0.6rem' }}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem' }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showBoletinPassword ? "text" : "password"} 
                      value={boletinPassword}
                      onChange={(e) => setBoletinPassword(e.target.value)}
                      className="input-field" 
                      placeholder="••••••••" 
                      style={{ width: '100%', padding: '0.6rem', paddingRight: '40px' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowBoletinPassword(!showBoletinPassword)} 
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showBoletinPassword ? <Eye size={16} /> : <span>👁️</span>}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={dniSearch.length !== 8}>
                  Ver Boletín
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Tablón de Anuncios tipo Feed */}
          <div className="glass-card" style={{ 
            height: isMobile ? 'auto' : 'calc(100vh - 10vh)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '0.5rem 0 1rem 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
                <Megaphone size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '900' }}>Tablón Institucional</h2>
              </div>
            </div>

            <div className="custom-scroll" style={{ 
              flex: 1, 
              overflowY: 'auto', 
              paddingRight: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {publicAnuncios.length > 0 ? publicAnuncios.map(a => {
                const videoId = (a.contenido.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/) || [])[1];
                return (
                  <div key={a.id} className="glass-card" style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '1.5rem', 
                    borderLeft: `4px solid ${videoId ? 'var(--primary)' : 'var(--success)'}`,
                    flexShrink: 0
                  }}>
                    {a.titulo && (
                      <h4 style={{ color: '#ffffff', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: '800' }}>{a.titulo}</h4>
                    )}
                    
                    {videoId && (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', marginBottom: '1rem' }}>
                        <iframe 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                          title="YouTube video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    )}
                    
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.9 }}>
                      {(() => {
                        const lines = a.contenido.split('\n');
                        return lines.map((line, i) => {
                          const trimmedLine = line.trim();
                          
                          // Skip rendering the line if it's the video ID we already showed
                          if (videoId && trimmedLine.includes(videoId)) return null;

                          // Image Regex
                          const isImageUrl = trimmedLine.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || 
                                             trimmedLine.includes('i.ibb.co') || 
                                             trimmedLine.includes('imgur.com');
                          
                          if (isImageUrl && (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://'))) {
                            return (
                              <div key={i} style={{ margin: '12px 0' }}>
                                <img 
                                  src={trimmedLine} 
                                  alt="Imagen adjunta" 
                                  style={{ 
                                    maxWidth: '100%', 
                                    borderRadius: '12px', 
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'block'
                                  }} 
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            );
                          }

                          return <div key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap' }}>{line}</div>;
                        });
                      })()}
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', opacity: 0.5 }}>
                      Publicado el {new Date(a.fecha_creacion).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <p style={{ opacity: 0.5 }}>No hay anuncios vigentes en este momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
          )
        } />

        <Route path="/dashboard/*" element={
          user ? (
            <PreceptorPanel
              user={user}
              onLogout={handleLogout}
              onPreviewStudent={(dni) => {
                setDniSearch(dni);
                navigate('/boletin');
              }}
              showToast={showToast}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />

        <Route path="/boletin" element={
          <StudentView dni={dniSearch} password={boletinPassword} isStaff={!!user} onBack={() => navigate(user ? '/dashboard' : '/')} />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
