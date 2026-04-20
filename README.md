# 🎓 Sistema de Gestión Escolar - Industrial N°6

> **Suite administrativa profesional para la gestión de calificaciones, alumnos y reportes institucionales.**

---

## 📜 Registro de Cambios (Changelog)

### 🛡️ [2.6.6] - 2026-04-20 (Versión Actual)
**"Control de Calidad y Depuración de Código"**

*   **🔍 Auditoría de Código (Linter)**: Ejecución de auditoría estática completa para eliminar errores de referencia y variables huérfanas en todo el proyecto.
*   **🛠️ Fix saveObs**: Reparación de la función de guardado de observaciones en el panel RAC que se encontraba no definida, garantizando la persistencia de notas pedagógicas.
*   **🧹 Limpieza de Código Muerto**: Eliminación de funciones obsoletas y referencias no definidas (`saveRotations`) que podrían causar inestabilidad en el sistema.
*   **🚀 Estabilidad Garantizada**: Verificación de integridad de todas las rutas, estados de sesión y llamadas a la API tras la migración a Hash Routing.

### 🛡️ [2.6.5] - 2026-04-20
**"Navegación Robusta y Persistencia de Sesión"**

*   **🌐 Hash Routing Implementation**: Migración total a un sistema de enrutamiento profesional utilizando `HashRouter`. Ahora el sistema cuenta con URLs navegables (ej: `/#/dashboard`, `/#/boletin`) que no generan errores 404 al recargar.
*   **💾 Persistencia de Sesión (F5 Proof)**: Implementación de inicialización sincrónica de estado desde `localStorage`. La sesión del usuario ahora sobrevive a recargas de página y cierres accidentales de pestaña.
*   **📍 Sub-rutas de Panel**: Sincronización automática de las pestañas del panel administrativo (Notas, Alumnos, RAC, etc.) con la URL, permitiendo el uso de los botones "Atrás" y "Adelante" del navegador.
*   **🔒 Protected Routes**: Sistema de redirección inteligente que protege las rutas administrativas, redirigiendo automáticamente al login si no se detecta una sesión activa.

### 🛡️ [2.6.3] - 2026-04-20
**"Bloqueos en Cascada y Refinamiento de Otras Instancias"**

*   **🔐 Bloqueos en Cascada**: Implementación de lógica inteligente de habilitación de campos. Si un alumno aprueba (nota ≥ 7) en instancias finales (Marzo u Otras Instancias), se bloquean automáticamente los campos de 3° Trimestre, Dic. y Feb. para evitar inconsistencias.
*   **📝 Observaciones Automáticas**: Al completar la columna "Otras Inst.", el sistema ahora solicita automáticamente al usuario si desea agregar observaciones al RAC, vinculando la información de manera inmediata.
*   **📊 Optimización de Columnas**: Rediseño del ancho de columnas en el panel de notas para mejorar la densidad de información y facilitar la lectura en pantallas pequeñas.
*   **🖨️ Impresión Avanzada**: Integración completa de "Otras Instancias" en todos los formatos de reporte (RAC y Planillas de Calificaciones), incluyendo ajustes de colspans y pies de firma.
*   **🛡️ Seguridad en Sincronización**: Los botones de sincronización de datos desde años anteriores ahora se ocultan automáticamente si el sistema no detecta un ciclo académico previo disponible.

### 🛡️ [2.6.0] - 2026-04-20

*   **🏁 Terminación de Ciclo (RAC)**: Nuevo flujo centralizado en el `RACPanel` para el cierre del año escolar con selección masiva de alumnos.
*   **🤖 Automatización de Repitencia**: Sistema inteligente que detecta y asigna automáticamente el curso homónimo en el ciclo siguiente para alumnos repitentes, eliminando la necesidad de selección manual.
*   **📈 Control de Promoción**: Validación automática de materias previas durante el pase de año, con alertas de seguridad para alumnos con 3 o más materias adeudadas.
*   **📋 Historial Escolar**: Automatización del registro histórico (Boletín snapshot) durante la transición de ciclo para la preservación íntegra de datos de años anteriores.
*   **👥 Gestión Granular de Usuarios**: Implementación de copia de asignaciones (roles/materias) por usuario individual desde ciclos anteriores, optimizando la configuración del nuevo año.
*   **🕒 Orden Cronológico Académico**: Reordenamiento de períodos para incluir "Otras Instancias" después de Marzo, optimizando la visualización y el cálculo en la planilla de notas.
*   **🛠️ Refinamiento de Ficha**: Rediseño del modal de `Ficha del Alumno` con carga de datos centralizada y correcciones de layout para visualización completa de legajos y antecedentes.
*   **🧹 Limpieza Administrativa**: Eliminación de funciones obsoletas como el borrado de años lectivos y el botón de reset de contraseña manual, priorizando la integridad de la base de datos.

---

### 🛡️ [2.5.0] - 2026-04-19
**"Expansión Institucional y Control Directivo"**

*   **🏢 Jerarquía Institucional**: Implementación de roles `Director`, `Vicedirector` y `Secretaria de Alumnos` con privilegios administrativos adaptados.
*   **📣 Centro de Anuncios**: Nuevo módulo de comunicación para la publicación y gestión de anuncios institucionales visibles en todo el sistema.
*   **⚖️ RBAC Avanzado**: Refinamiento del control de acceso basado en roles, delegando gestión operativa mientras se restringen acciones destructivas (borrados) exclusivamente a `Admin` y `Jefe de Auxiliares`.
*   **🕵️ Auditoría Visual**: Actualización del sistema de historial con códigos de rol (`DIR`, `VDIR`, `SEC`) y paleta de colores distintiva para trazabilidad inmediata.
*   **🗄️ Consolidación de Datos**: Limpieza y archivo de migraciones históricas y exportación del esquema maestro `schema.sql`.

---

### 🛡️ [2.4.0] - 2026-04-19
**"Modularización de Impresión y Optimización de Perfiles"**

*   **✂️ Code Decoupling**: Extracción masiva de lógica de impresión (RAC, Planillas, Seguimiento) a un módulo independiente (`PrintHelpers.jsx`), reduciendo la carga del componente principal en un 50%.
*   **🎯 Profile-Specific UX**: Interfaz adaptativa para el rol `preceptor_taller`, eliminando ruido visual y garantizando el flujo de trabajo correcto.
*   **🔄 Smart View Routing**: Redirección automática y visibilidad condicional de la pestaña "Taller" basada en la existencia de materias modulares en el curso.
*   **📄 Ficha del Alumno**: Implementación de un nuevo modal de ficha técnica para visualización detallada de datos del alumno y gestión de legajos.

### 🛡️ [2.3.0] - 2026-04-19
**"Blindaje de Datos y Refinamiento UX"**

*   **🔒 System Hardening**: Implementación de un campo `estado` (Activo/Inactivo) robusto que reemplaza el filtrado por texto, asegurando la integridad de los registros históricos.
*   **🔑 Reset Admin Pass**: Eliminación de contraseñas en texto plano en la interfaz. Los administradores ahora pueden resetear claves de forma segura sin visualizarlas.
*   **🦴 Skeleton Loading**: Integración de pantallas de carga inteligentes (Skeletons) en los paneles de notas y alumnos para una experiencia fluida durante la recuperación de datos.
*   **🏷️ Status Badges**: Identificación visual inmediata de alumnos con "PASE" o estado inactivo, optimizando la gestión administrativa.

---

### 🏗️ [2.2.0] - 2026-04-18
**"Arquitectura Consolidada y Modularización CSS"**

*   **📂 Global Consolidation**: Reestructuración total del proyecto en carpetas planas `src/jsx/` y `src/css/` para una navegación y mantenimiento ultra-eficiente.
*   **🧩 CSS Modular**: Fragmentación del núcleo estético en módulos independientes (`GradesPanel`, `StudentManager`, `ReportViews`) para evitar colisiones de estilos.
- **🔗 Import Standardization**: Limpieza y estandarización de todas las rutas de importación del proyecto, eliminando dependencias de carpetas anidadas complejas.

---

### 🚀 [2.1.0] - 2026-04-18
**"Motor de Impresión Profesional y Reportes Globales"**

*   **📏 A4 Print Engine**: Implementación de un motor de renderizado basado en unidades métricas (`mm`) para garantizar precisión absoluta en impresión física A4.
*   **📦 Generación Masiva Global**: Nuevo módulo para la creación de "Planillas de Seguimiento" de todos los cursos en un solo documento unificado.
*   **⚡ Carga Asíncrona**: Refactorización de la API (`includeAllStudents`) para recuperación masiva de datos sin penalización de rendimiento.
*   **🤝 Atribución Dinámica**: Sistema de resolución inteligente de preceptores basado en mapeo dinámico de cursos.
*   **🛠️ Robustez SQL**: Corrección de filtrado de campos `NULL` en consultas críticas para asegurar reportes 100% íntegros.
*   **🎨 Refinamiento UI/UX**: Reubicación contextual de herramientas y optimización de grids para entornos administrativos.

---

### 🏗️ [2.0.0] - 2026-04-18
**"Arquitectura Modular y Optimización Core"**

*   **🧩 Modularización**: Fragmentación del componente `PreceptorPanel` en sub-módulos especializados (`GradesPanel`, `StudentManager`, etc.).
*   **💾 Optimización D1**: Implementación de índices SQL y lógica de protección de datos concurrentes (`COALESCE`).
*   **🔍 Lazy Loading**: Filtrado inteligente de cursos y pases directo en el servidor para optimizar el uso de memoria.
*   **🔒 API Hardening**: Validación estricta de roles y limpieza de datos sensibles en todas las respuestas del servidor.

---

### 🛡️ [1.7.0] - 2026-04-17
**"Seguridad y Control de Acceso"**

*   **📱 Mobile Access Toggle**: Control administrativo para habilitar/deshabilitar el acceso desde dispositivos móviles.
*   **⚙️ Configuración Extendida**: Nuevo panel de ajustes para la gestión de periodos y ciclos lectivos.

---

### 📊 [1.6.0] - 2026-04-17
**"Integridad de Datos"**

*   **🚫 Restricciones de Borrado**: La eliminación de alumnos ahora es exclusiva del rol Administrador.
*   **🔄 Estados de Curso**: Implementación de "Activo/Inactivo" para cursos en lugar de eliminación física.

---

### 📄 [1.5.0] - 2026-04-15
**"Reportes e Identidad"**

*   **🖨️ A4 Ready**: Ajuste de layouts de boletines para impresión estándar profesional.
*   **🏷️ Branding Institucional**: Integración de logotipos y normalización de nombres de tecnicaturas.
*   **🔤 Alphabetical Sync**: Ordenamiento automático garantizado en todos los listados del sistema.

---

### 👥 [1.4.0] - 2026-04-15
**"Gestión Multi-Rol"**

*   **🎭 Sistema de Roles**: Permisos diferenciados para Admin, Preceptor, Profesor y Visor.
*   **📅 Calendario Académico**: Gestión dinámica de periodos y fechas institucionales.

---

### 💾 [1.3.0] - 2026-04-12
**"Migración a SQL (Cloudflare D1)"**

*   **🕒 Real-time Consistency**: Transición desde KV a D1 para eliminar la latencia de propagación de datos.
*   **📉 Optimización de Latencia**: Reducción drástica del tiempo de respuesta en operaciones de escritura.

---

### 📂 [1.2.0] - 2026-04-11
**"Estructura y Limpieza"**

*   **📁 Organización de Directorios**: Reubicación de assets en carpetas `/js` y `/css`.
*   **🧹 Asset Cleanup**: Eliminación de archivos huérfanos y optimización de la estructura del proyecto.

---

### 🎨 [1.1.0] - 2026-04-11
**"Modularización de Estilos"**

*   **🌈 CSS Architecture**: División del diseño *Glassmorphism* en archivos modulares por funcionalidad.

---

### 🏁 [1.0.0] - 2026-04-10
**"Lanzamiento Inicial"**

*   **🚀 Deployment**: Despliegue inicial en Cloudflare Pages.
*   **🔍 Búsqueda por DNI**: Acceso rápido para padres y alumnos.
*   **📝 Grade Input**: Interfaz básica de carga de notas.

---
*Desarrollado con ❤️ para la comunidad educativa de la Industrial N°6.*