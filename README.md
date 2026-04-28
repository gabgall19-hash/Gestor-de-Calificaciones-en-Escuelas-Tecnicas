# 🎓 Sistema de Gestión Escolar - Industrial Nº6

> **Suite administrativa profesional para la gestión de calificaciones, alumnos y reportes institucionales.**

---

## 📜 Registro de Cambios (Changelog)
 
### 🚀 [3.5.5] - 2026-04-28 (Seguridad, Auditoría y Buscador Pro)
**"Bcrypt, Categorización de Historial y Búsqueda Avanzada"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔐 Seguridad de Contraseñas (Bcrypt)**:
    - **Hash Bcrypt**: Migración del almacenamiento de contraseñas de texto plano a hashes Bcrypt robustos.
    - **Auto-migración Transparente**: Sistema de validación dual que hashea automáticamente las contraseñas antiguas tras el primer inicio de sesión exitoso.
*   **🕵️ Auditoría y Validación Refinada**:
    - **Detección de Duplicados**: Nuevo sistema de validación en la creación de usuarios que impide registros duplicados, mostrando una advertencia visual clara en el modal de administración.
    - **Categorización Inteligente de Historial**: 
        - Los cambios y reseteos de contraseña ahora se agrupan estrictamente en el apartado **Sistema** para mejor trazabilidad.
        - Las actualizaciones de **Horarios** se han trasladado al apartado **Ediciones (Todos)**.
*   **🔍 Buscador Pro en Ajustes**:
    - **Búsqueda Multi-Criterio**: El buscador de gestión de usuarios ahora permite filtrar por **Rol**, **Curso** y **Materia**.
*   **⏳ Sesiones Deslizantes (Sliding Expiration)**:
    - **Expiración de 1 Hora**: Configuración de sesiones con vencimiento de una hora.
    - **Refresco Automático**: Implementación de middleware (`X-Refresh-Token`) e interceptor global.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   Resolución de `ReferenceError: setUserError is not defined` en el panel de administración.

### 🚀 [3.5.4] - 2026-04-28 (Avisos de Seguridad Dinámicos)
**"Mensajería Especial para Reseteos Administrativos"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🛡️ Protocolo de Reseteo Mejorado**:
    - **Identificación de Origen**: Nueva bandera `reset_by_admin` para diferenciar el origen de las claves.
    - **Aviso Especial de Seguridad**: Cartel de bienvenida con iconografía de alerta para reseteos forzados.
    - **Sincronización de Estado**: Limpieza automática de la marca de reseteo tras el cambio de clave.

### 🚀 [3.5.3] - 2026-04-28 (Permisos Híbridos y Estabilidad de Sesión)
**"Soporte Integral para Profesores/Preceptores y Robustez en Sesiones"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🎭 Soporte para Usuarios Híbridos (Profesor + Preceptor)**:
    - **Permisos Granulares**: Refactorización de handlers para reconocer permisos híbridos.
    - **Interfaz Dinámica**: Habilitación automática de pestañas restringidas para profesores híbridos.
    - **Modos de Vista**: Supervisión completa del curso para preceptores híbridos.
*   **🛠️ Refinamiento de UI/UX**:
    - **Banderas de Permisos**: Lógica de gestión de alumnos basada en privilegios sumados.
    - **Selector de Sector Inteligente**: Pre-selección de sector (Teoría/Taller/EF) optimizada.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Anti-Logout Proactivo**: Prevención de cierre de sesión ante errores 403.
*   **Persistencia de Status Híbrido**: Inclusión de metadatos en el token de autenticación.

### 🚀 [3.5.2] - 2026-04-27 (Auditoría Refinada y Seguridad de Ingreso)
**"Privacidad de Logs y Protocolo de Bienvenida Obligatorio"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🕵️ Refactorización del Sistema de Auditoría**:
    *   **Privacidad Granular**: Restricción de visibilidad de los logs de **Alumnos**, **Asistencia** y **Sistema** exclusivamente para los roles de **Administrador** y **Jefe de Auxiliares**.
    *   **Visualización por Colores**: Implementación de indicadores visuales para logs de sistema (Verde para creación, Amarillo/Naranja para actualizaciones).
    *   **Optimización de Pestañas**: Logs de **Sistema** confinados a su propia pestaña (oculta para roles no autorizados).
    *   **Nomenclatura Oficial**: Actualización de etiquetas a **"Carga de Nota"** y **"Edición"**.
*   **🛡️ Bienvenida y Seguridad Obligatoria**:
    *   **Protocolo de Ingreso**: Ventana obligatoria al iniciar sesión que solicita el cambio de contraseña.
    *   **Persistencia Anti-Bypass**: Implementación de bloqueo mediante `sessionStorage`.
    *   **Autogestión de Claves**: Desarrollo de endpoint para que el usuario actualice su propia contraseña.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Restauración de API**: Corrección de importaciones en `data.js` para asegurar la operatividad total de los handlers.

### 🚀 [3.5.1] - 2026-04-27 (Seguridad de Roles y Regente de Profesores)
**"Blindaje de Permisos y Expansión Administrativa"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **👑 Nuevo Rol: Regente de Profesores**: Acceso especializado para Horarios y Ajustes, con supervisión de solo lectura en RAC.
*   **🛡️ Sincronización de Matriz de Permisos**: 
    - **Hardening Administrativo**: Ajuste estricto para Secretaría y Directivos (Modo Solo Lectura en Asistencia e Historial).
    - **Protección de Metadatos RAC**: Restricción de edición de datos maestros reservada para roles de gestión de alumnos.
*   **🛡️ Seguridad en API**: Refuerzo de handlers para validar permisos de escritura contra la matriz oficial.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Crash en Horarios**: Resolución de `ReferenceError: isAdmin is not defined`.
*   **Actualización de Esquema DB**: Ejecución de migración SQL para permitir nuevos roles institucionales.

### 🚀 [3.5.0] - 2026-04-27 (Sectores, Navegación y Pulido Editorial)
**"Estructura Multi-Sector y Navegación Inteligente"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🏆 Asistencia Multi-Sector**: Segmentación en **Teoría**, **Taller** y **Educación Física** con persistencia en DB.
*   **🏹 Navegación Ágil de Cursos**: Incorporación de flechas **Quick-Switch** (Chevron) con detección de límites.
*   **🖨️ Excelencia Editorial en Impresión**:
    - **Precisión en Recreos**: Estandarización a 15px con tipografía de 7pt.
    - **Horario Libre Automático**: Etiquetas centradas en gris tenue para celdas vacías.
*   **🎨 Pulido Visual de Horarios**:
    - **High-Visibility**: Resaltado dorado (`#ffb300`) en el editor de Horario Libre.
    - **Badges de Especialidad**: Restauración de colores dinámicos y aumento de legibilidad.
*   **🛡️ Auditoría de Roles**: Reporte técnico detallado de permisos institucional.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Plantillas (AllWeek)**: Resolución de errores de interpolación en reportes mensuales masivos.

### 🚀 [3.4.1] - 2026-04-26 (Excelencia en Impresión y Pulido Visual)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🖨️ Color Fiel en Impresión**: Implementación de `print-color-adjust: exact` para banners institucionales.
*   **🎨 Consolidación de Identidad Visual**: Unificación de badges de roles y transición a colores sólidos vibrantes.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Recreos Refinados**: Rediseño de la fila de descanso en PDF para unificar columnas técnicas.
*   **Consistencia Masiva**: Asegurada la preservación de colores en PDFs de todos los cursos.

### 🚀 [3.4.0] - 2026-04-26 (Automatización y Estructura Horaria)
**"Sincronización Inteligente y Validación de Integridad"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📅 Automatización de Estructura Horaria**: Plantillas institucionales (Mañana/Tarde) con sincronización automática de slots.
*   **🛡️ Validación de Integridad**: Detección de errores en tiempo real (**Red Glow**) y bloqueo de guardado ante datos inválidos.
*   **👥 Gestión de Usuarios Refinada**: Contraseña opcional en edición y ayuda contextual.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Depuración del Editor Masivo**: Filtro automático de materias obsoletas que no pertenecen a la tecnicatura actual.

### 🚀 [3.3.0] - 2026-04-26 (Legajo Digital y Automatización)
**"Legajo Fotográfico y Ficha Inteligente"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📂 Legajo Digital de Alumnos**: Integración con ImgBB para adjuntar documentos (DNI, médicos) con gestión segura y control temporal.
*   **🧠 Inteligencia en Ficha**:
    - **Cálculo de Edad Automático**: Basado en fecha de nacimiento.
    - **Limpieza de CUIL/DNI**: Eliminación automática de guiones al editar.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Corrección de Entrada de Fecha**: Normalización del parseo para evitar selectores vacíos.

### 🚀 [3.2.1] - 2026-04-26 (Comunicación Visual)
**"Anuncios con Multimedia Enriquecida"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📸 Integración Multimedia**: Subida directa a ImgBB y renderizado inteligente de videos de YouTube.
*   **👨‍🏫 Sincronización Automática de Permisos**: Los permisos de profesores se derivan exclusivamente del Panel de Horarios (**Fuente Única de Verdad**).
*   **🛡️ Exclusividad de Roles Jerárquicos**: Bloqueo automático de asignación de materias para roles directivos.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Normalización de Nomenclatura**: Corrección de doble símbolo de grado (`°°`) en reportes impresos.
*   **Hardening de API**: Protección contra sobreescrituras accidentales en perfiles de usuario.

### 🚀 [3.2.0] - 2026-04-25 (Escalabilidad DB y Excelencia en Impresión)

#### ✨ Nuevas Implementaciones y Mejoras
*   **⚡ Optimización Crítica de Performance**: Procesamiento por lotes (**Batch API**) reduciendo latencia en un 70%.
*   **🖨️ Rediseño del Boletín (A4 Landscape)**: Layout horizontal profesional con observaciones al dorso.
*   **📅 Panel de Horarios "Glassfrost"**: Estética premium y funcionalidad de impresión masiva para todo el ciclo lectivo.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Índices Estratégicos**: Implementación de índices en DB para acelerar consultas de pases, asistencia y alumnos.
*   **Fix de Hojas en Blanco**: Normalización de márgenes `@page` y saltos de página condicionales.

### 🚀 [3.0.6] - 2026-04-24 (Corrección de Impresión)
**"Sincronización de Docentes en Planillas"**

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Profesores en Planillas**: Resolución del bug de campos vacíos mediante búsqueda exhaustiva en Horarios.
*   **Soporte Multi-Rol**: Inclusión de preceptores y cargos híbridos en reportes oficiales.
*   **Normalización de Materias**: Motor de búsqueda insensible a tildes para vinculación de profesores.

### 🚀 [3.0.5] - 2026-04-24 (Actualización de Seguridad)
**"Blindaje de Sesión y Refinamiento de Pases"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📋 Acceso Directo a Ficha (Pases)**: Apertura directa del legajo desde el panel de pases.
*   **🏗️ Mejora en Copia de Tecnicaturas**: Limpieza automática de nombres (`trim`) en duplicación.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Redirección Infinita**: Resolución del bug de recarga ante sesión expirada (Error 401/403).
*   **Hardening de Seguridad API**: Estandarización de errores en Cloudflare Functions.

### 🚀 [3.0.0] - 2026-04-23 (Gestión Dinámica de Horarios)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📅 Sistema de Horarios Inteligente**: `SearchableSelect` con búsqueda difusa, visualización de Horario Libre e Impresión A4.
*   **🎨 Micro-interacciones Premium**: Pulido de estados de carga y transiciones.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Integridad D1**: Refactorización de `UPSERT` para eliminar colisiones de datos.

### 🚀 [2.9.9] - 2026-04-23 (Refinamiento UI/UX y Mobile App)

#### ✨ Nuevas Implementaciones y Mejoras
*   **💾 Botón de Guardado Dinámico**: Alternancia visual y animación de sacudida (**Shake**) para cambios pendientes.
*   **📱 Optimización Móvil Crítica**: Iconografía minimalista y ajuste de anchos para App Nativa.
*   **🤖 Integración Capacitor**: Preparación para Android/APK con detección de entorno (`capacitor://`).

### 🚀 [2.9.8] - 2026-04-23 (Auditoría y Asistencia)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📅 Panel de Asistencia Mensual**: Grilla interactiva, validación estricta y vista móvil optimizada.
*   **🖨️ Impresión de Partes Semanales**: Reportes A4 con datos reales y etiquetas dinámicas.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix Crítico del Sistema de Historial**: Recreación de tabla con FK corregido (eliminación del error silencioso de INSERT).
*   **Orden de Auditoría**: El log ahora se ejecuta tras confirmar la escritura en DB para evitar registros fantasma.

### 🚀 [2.9.5] - 2026-04-22 (Automatización Docente)

#### ✨ Nuevas Implementaciones y Mejoras
*   **👨‍🏫 Automatización Docente**: Generación masiva de credenciales para 104 profesores con mapeo inteligente.
*   **🎓 Identidad Institucional**: Implementación del prefijo "Prof." en todos los reportes y bienvenida.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Notas Globales**: Resolución de columnas aplastadas mediante anchos uniformes.
*   **Resolución de Conflictos**: Lógica de desambiguación para nombres de usuario duplicados.

### 🚀 [2.9.0] - 2026-04-22 (Autenticación JWT)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔐 Implementación de JWT**: Autenticación firmada (HMAC-SHA256) con expiración de 24hs.
*   **🛡️ Verificación en Backend**: Validación centralizada en Cloudflare contra manipulación de IDs.

### 🚀 [2.8.6] - 2026-04-22 (Refactorización Modular)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🏗️ Arquitectura Modular**: Extracción de modales y lógica a hooks especializados por dominio.

### 🚀 [2.8.5] - 2026-04-21 (RAC Modular e Impresión)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🧩 RAC Modular Configurable**: Visualización detallada para talleres con diseño adaptativo.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Impresión Global**: Resolución de hojas en blanco en partes diarios mediante `page-break` optimizado.

### 🚀 [2.8.0] - 2026-04-21 (Parte Diario Institucional)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📋 Parte Diario A4 Oficial**: Generación institucional masiva de todos los cursos con horarios integrados.

### 🚀 [2.7.0] - 2026-04-21 (Acceso Seguro y Auditoría)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔍 Acceso Estudiante**: Portal protegido por contraseña gestionada por preceptoría.
*   **📜 Auditoría Detallada**: Registro de cambios de clave, re-incorporaciones y pases.
*   **📄 Paginación**: Implementación en listados de Alumnos, Historial y Pases.

### 🚀 [2.6.6] - 2026-04-20 (Control de Calidad)

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Auditoría de Código**: Eliminación de errores de referencia y variables huérfanas vía Linter.
*   **Fix saveObs**: Reparación de guardado de observaciones en panel RAC.
*   **Limpieza de Código Muerto**: Eliminación de funciones obsoletas (`saveRotations`).

### 🚀 [2.6.5] - 2026-04-20 (Navegación Hash)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🌐 Hash Routing**: URLs navegables y persistencia de sesión ante recargas (F5).
*   **🔒 Protected Routes**: Redirección inteligente al login para rutas administrativas.

### 🚀 [2.6.3] - 2026-04-20 (Bloqueos en Cascada)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔍 Bloqueos Inteligentes**: Habilitación/Inhabilitación automática de celdas según aprobación en instancias finales.
*   **📏 Observaciones Automáticas**: Solicitud contextual de notas pedagógicas al cargar instancias.

### 🚀 [2.6.0] - 2026-04-20 (Cierre de Ciclo Académico)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🎓 Terminación de Ciclo**: Flujo masivo de cierre, automatización de repitencia y control de promoción.
*   **📋 Historial Escolar**: Automatización de snapshots de boletines históricos.

### 🚀 [2.5.0] - 2026-04-19 (Jerarquía Institucional)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🏢 Roles Directivos**: Soporte para Director, Vicedirector y Secretaría de Alumnos.
*   **📣 Centro de Anuncios**: Módulo de comunicación pública multimedia.
*   **🕵️ Auditoría Visual**: Códigos de rol y colores para trazabilidad inmediata.

### 🚀 [2.4.0] - 2026-04-19 (Modularización)

#### ✨ Nuevas Implementaciones y Mejoras
*   **✂️ Print Decoupling**: Extracción de lógica a `PrintHelpers.jsx`.
*   **📄 Ficha del Alumno**: Nuevo modal de legajo técnico centralizado.

### 🚀 [2.3.0] - 2026-04-19 (Blindaje de Datos)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔒 System Hardening**: Campo `estado` robusto para integridad histórica.
*   **🦴 Skeleton Loading**: Pantallas de carga para experiencia fluida.

### 🚀 [2.2.0] - 2026-04-18 (Arquitectura Consolidada)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📂 Global Consolidation**: Reestructuración total de carpetas `src/jsx/` y `src/css/`.

### 🚀 [2.1.0] - 2026-04-18 (Motor de Impresión)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📏 A4 Print Engine**: Motor basado en unidades métricas para precisión absoluta.
*   **📦 Generación Masiva**: Reportes globales de seguimiento por curso.

### 🚀 [2.0.0] - 2026-04-18 (Modularización Core)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🧩 Fragmentación de Componentes**: Desacoplamiento de `PreceptorPanel`.
*   **💾 Optimización D1**: Implementación de índices SQL y protección `COALESCE`.

---

### Versiones Iniciales (1.x.x)

*   **[1.7.0]**: Seguridad, Mobile Access Toggle y Panel de Configuración.
*   **[1.6.0]**: Restricciones de borrado y estados de curso Activo/Inactivo.
*   **[1.5.0]**: A4 Ready, Branding Institucional y Sincronización Alfabética.
*   **[1.4.0]**: Sistema de Roles y Calendario Académico.
*   **[1.3.0]**: Migración de KV a Cloudflare D1 (SQL) para consistencia en tiempo real.
*   **[1.2.0]**: Organización de assets y limpieza de estructura de directorios.
*   **[1.1.0]**: Arquitectura CSS modular y diseño *Glassmorphism*.
*   **[1.0.0]**: Lanzamiento inicial en Cloudflare Pages, búsqueda por DNI y carga básica de notas.

---
*Desarrollado con ❤️ para la comunidad educativa de la Industrial Nº6.*
