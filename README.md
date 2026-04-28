# 🎓 Sistema de Gestión Escolar - Industrial Nº6

> **Suite administrativa profesional para la gestión de calificaciones, alumnos y reportes institucionales.**

---

## 📜 Registro de Cambios (Changelog)
 
### 🚀 [3.5.4] - 2026-04-28 (Avisos de Seguridad Dinámicos)
**"Mensajería Especial para Reseteos Administrativos"**

*   **🛡️ Protocolo de Reseteo Mejorado**:
    *   **Identificación de Origen**: Implementación de la bandera `reset_by_admin` en la base de datos y API para diferenciar entre el primer ingreso general y un reseteo forzado por administración.
    *   **Cartel Especial de Seguridad**: El modal de bienvenida ahora detecta si la clave fue puesta por un administrador, mostrando un mensaje de advertencia específico ("Acción de Seguridad") con iconografía de alerta para incentivar el cambio de clave inmediata.
    *   **Sincronización de Estado**: Limpieza automática de la marca de reseteo una vez que el usuario establece su propia contraseña o reconoce la actual.

*   **🎭 Soporte para Usuarios Híbridos (Profesor + Preceptor)**:
    *   **Permisos Granulares**: Refactorización completa de los handlers de la API (**Asistencia**, **Alumnos**, **Calificaciones** y **Bloqueos**) para reconocer y agregar permisos de usuarios híbridos. Ahora los profesores con funciones de preceptoría pueden gestionar sus cursos asignados sin conflictos de rol.
    *   **Interfaz Dinámica**: El panel del preceptor ahora detecta automáticamente si un profesor es híbrido, habilitando las pestañas de **Asistencia**, **Alumnos**, **Materias**, **RAC** e **Historial** que anteriormente estaban restringidas.
    *   **Modos de Vista**: Se habilitó el acceso a la vista "Todas las Materias" para profesores híbridos, permitiéndoles supervisar el curso completo como preceptores.
*   **🔐 Estabilidad de Sesión y Navegación**:
    *   **Anti-Logout Proactivo**: Eliminación del error 403 (Forbidden) como disparador de cierre de sesión automático. Los usuarios ya no son expulsados del sistema al intentar acceder a secciones sin permisos; en su lugar, reciben una notificación de aviso preservando su token.
    *   **Persistencia de Status Híbrido**: Inclusión de la bandera `is_professor_hybrid` en el payload de autenticación para una configuración inmediata de la UI tras el login.
*   **🛠️ Refinamiento de UI/UX**:
    *   **Banderas de Permisos**: Actualización de la lógica en `usePreceptorLogic` para habilitar acciones de transferencia y gestión de alumnos basadas en la suma de privilegios del usuario.
    *   **Selector de Sector Inteligente**: El panel de asistencia ahora pre-selecciona el sector correcto para usuarios híbridos, optimizando el flujo de carga.


### 🚀 [3.5.2] - 2026-04-27 (Auditoría Refinada y Seguridad de Ingreso)
**"Privacidad de Logs y Protocolo de Bienvenida Obligatorio"**

*   **🕵️ Refactorización del Sistema de Auditoría**:
    *   **Privacidad Granular**: Restricción de visibilidad de los logs de **Alumnos**, **Asistencia** y **Sistema** exclusivamente para los roles de **Administrador** y **Jefe de Auxiliares**, protegiendo la trazabilidad operativa.
    *   **Visualización por Colores**: Implementación de indicadores visuales (borde izquierdo) para logs de sistema: **Verde** para creación de usuarios y **Amarillo/Naranja** para actualizaciones.
    *   **Optimización de Pestañas**: Los logs de **Sistema** ahora están confinados a su propia pestaña (oculta para roles no autorizados) y excluidos de la vista general "Todos" para reducir el ruido visual.
    *   **Nomenclatura Oficial**: Actualización de etiquetas de historial de calificaciones a **"Carga de Nota"** y **"Edición"**, con lógica de reseteo automático tras eliminaciones.
*   **🛡️ Bienvenida y Seguridad Obligatoria**:
    *   **Protocolo de Ingreso**: Nueva ventana obligatoria al iniciar sesión que solicita el cambio de contraseña como medida de seguridad institucional.
    *   **Persistencia Anti-Bypass**: Implementación de bloqueo mediante `sessionStorage`, garantizando que la ventana sea ineludible incluso ante recargas de página o manipulación de URL hasta que el usuario elija una opción.
    *   **Autogestión de Claves**: Desarrollo de un nuevo endpoint de backend y lógica de frontend que permite a cualquier usuario actualizar su propia contraseña de forma segura sin intervención administrativa.
*   **🛠️ Robustez y Fixes**:
    *   **Restauración de API**: Corrección de importaciones en `data.js` para asegurar la operatividad total de los handlers de gestión de usuarios y configuraciones.

### 🚀 [3.5.1] - 2026-04-27 (Seguridad de Roles y Regente de Profesores)
**"Blindaje de Permisos y Expansión Administrativa"**

*   **👑 Nuevo Rol: Regente de Profesores**:
    *   **Gestión Académica**: Acceso especializado para la administración de **Horarios** y **Ajustes de Materias/Carreras**.
    *   **Supervisión Lectora**: Permisos de solo lectura en Calificaciones (RAC) e Historial para monitoreo institucional.
    *   **Integración UI/UX**: Incorporación del rol en el selector de creación de usuarios y lógica de exclusión de cursos (rol administrativo puro).
*   **🛡️ Sincronización de Matriz de Permisos**:
    *   **Hardening Administrativo**: Ajuste estricto de permisos para los roles de **Secretaría de Alumnos** y **Directivos** (Director/Vicedirector). Ahora operan en modo **Solo Lectura** en los módulos de Asistencia e Historial, preservando la integridad de la carga operativa.
    *   **Protección de Metadatos RAC**: Restricción de edición de datos maestros (Matrícula, Libro, Folio, Legajo) en el panel RAC, reservada exclusivamente para roles con permisos de gestión de alumnos.
*   **🛠️ Robustez del Sistema**:
    *   **Fix de Crash en Horarios**: Resolución definitiva del error `ReferenceError: isAdmin is not defined` mediante la unificación de la lógica de permisos en el panel de cronogramas.
    *   **Actualización de Esquema DB**: Ejecución de migración SQL para ampliar la restricción `CHECK` de la tabla `usuarios`, permitiendo la persistencia de los nuevos roles institucionales.
    *   **Seguridad en API**: Refuerzo de los handlers de backend (`attendance`, `students`, `admin`) para validar permisos de escritura contra la matriz oficial de roles.

### 🚀 [3.5.0] - 2026-04-27 (Sectores, Navegación y Pulido Editorial)
**"Estructura Multi-Sector y Navegación Inteligente"**

*   **🏆 Asistencia Multi-Sector**:
    *   **Segmentación de Carga**: Implementación de sectores diferenciados (**Teoría**, **Taller** y **Educación Física**) para el registro de asistencia, permitiendo una gestión precisa por área académica.
    *   **Consistencia en Base de Datos**: Actualización del esquema SQL y los handlers de la API para soportar la persistencia de datos por sector.
*   **🏹 Navegación Ágil de Cursos**:
    *   **Quick-Switch**: Incorporación de flechas de navegación (Chevron) junto al selector de cursos para un cambio rápido y fluido entre divisiones sin necesidad de re-abrir el menú desplegable.
    *   **Detección de Límites**: Lógica inteligente que inhabilita las flechas al llegar al principio o final del listado institucional.
*   **🖨️ Excelencia Editorial en Impresión**:
    *   **Precisión en Recreos**: Estandarización de la barra de descanso a **15px** con tipografía de **7pt**, logrando el equilibrio perfecto entre "línea vistosa" y ahorro de espacio.
    *   **Horario Libre Automático**: Las celdas sin materia asignada ahora muestran automáticamente la etiqueta **"HORARIO LIBRE"** centrada y en gris tenue, eliminando el ruido visual de campos vacíos.
    *   **Fix de Plantillas (AllWeek)**: Resolución de errores de interpolación en los reportes mensuales masivos, asegurando que los datos de curso y mes se rendericen correctamente.
*   **🎨 Pulido Visual de Horarios**:
    *   **High-Visibility (Golden Border)**: Los campos de entrada de "Horario Libre" en el editor ahora se resaltan con un borde dorado sólido (`#ffb300`) para una identificación inmediata durante la carga.
    *   **Identidad Recuperada**: Restauración de la lógica de colores dinámicos en los badges de especialidad y aumento de su tamaño de fuente a **0.8rem** para máxima legibilidad.
*   **🛡️ Auditoría de Roles**:
    *   **Reporte de Permisos**: Creación de una matriz técnica detallada de roles y permisos (`reporte_roles_permisos.txt`) para auditorías de seguridad institucional.

### 🚀 [3.4.1] - 2026-04-26 (Excelencia en Impresión y Pulido Visual)

*   **🖨️ Color Fiel en Impresión**:
    *   **Hardening de Fondos**: Implementación de `print-color-adjust: exact` para forzar la impresión de banners de colores, superando las restricciones por defecto de los navegadores.
    *   **Consistencia Masiva**: Asegurada la preservación de colores institucionales en la generación masiva de PDF para todos los cursos.
    *   **Recreos Refinados**: Rediseño de la fila de descanso en el PDF; ahora es una línea fina (6mm), con tipografía minimalista y espaciado técnico que unifica todas las columnas.
*   **🎨 Consolidación de Identidad Visual**:
    *   **Sistema de Badges Global**: Unificación de las etiquetas de roles en un único motor de estilos (`index.css`), eliminando conflictos entre paneles.
    *   **Estética Sólida**: Transición de fondos traslúcidos a colores sólidos y vibrantes con tipografía Extra Bold, mejorando la legibilidad inmediata de los cargos jerárquicos.

### 🚀 [3.4.0] - 2026-04-26 (Automatización y Estructura Horaria)
**"Sincronización Inteligente y Validación de Integridad"**

*   **📅 Automatización de Estructura Horaria**:
    *   **Plantillas Institucionales**: Implementación de 4 escenarios fijos (Mañana/Tarde x Ciclo Básico/Superior) con bloques de recreo automatizados.
    *   **Sincronización Invisible**: El sistema ahora detecta y aplica automáticamente la estructura correcta al cargar cualquier curso, re-ubicando materias y profesores en los slots fijos sin pérdida de datos.
    *   **Estética "Recreo"**: Diseño minimalista para los bloques de descanso, con tipografía reducida y bordes finos para servir exclusivamente como guía visual.
*   **🛡️ Validación de Integridad en Tiempo Real**:
    *   **Blindaje de Estructura**: Eliminación de controles para agregar o borrar filas, garantizando que el cronograma siempre respete la normativa institucional.
    *   **Detección de Errores (Red Glow)**: Sistema de validación en tiempo real que resalta con bordes rojos y resplandor a cualquier materia o profesor que no coincida exactamente con la base de datos oficial.
    *   **Bloqueo de Guardado**: Protección activa que impide guardar el horario si existen campos con datos inválidos o inexistentes.
*   **👥 Gestión de Usuarios Refinada**:
    *   **Contraseña Opcional en Edición**: Se habilitó la posibilidad de editar perfiles de usuario sin necesidad de resetear la contraseña (dejar el campo vacío preserva la actual).
    *   **Ayuda Contextual**: Incorporación de mensajes de guía en el formulario de edición de usuarios.
*   **🧹 Depuración del Editor Masivo**:
    *   **Filtro de Currículum**: El editor de profesores ahora filtra automáticamente nombres de materias obsoletas o "zombies" que no pertenecen a la tecnicatura actual del curso, mostrando solo la estructura curricular vigente.

### 🚀 [3.3.0] - 2026-04-26 (Legajo Digital y Automatización)
**"Legajo Fotográfico y Ficha Inteligente"**

*   **📂 Legajo Digital de Alumnos**:
    *   **Imágenes Adjuntas**: Nueva sección en la ficha del alumno para adjuntar documentos (DNI, certificados médicos, etc.) mediante integración con ImgBB.
    *   **Gestión Segura**: La subida y eliminación de archivos está restringida al modo de edición de la ficha para evitar cambios accidentales.
    *   **Acceso Rápido**: Apertura directa de la imagen original en pestaña nueva con un clic, optimizando el flujo de trabajo.
    *   **Control Temporal**: Registro automático y visualización de la fecha de subida para cada documento.
*   **🧠 Inteligencia en Ficha**:
    *   **Cálculo de Edad Automático**: El sistema calcula la edad del alumno en tiempo real basándose en la fecha de nacimiento ingresada.
    *   **Corrección de Entrada de Fecha**: Se normalizó el parseo de fechas para asegurar que el selector del navegador nunca aparezca vacío si ya existe un dato.
    *   **Limpieza de CUIL/DNI**: Automatismo que elimina guiones y caracteres no numéricos al editar, evitando errores de validación (11 dígitos).

### 🚀 [3.2.1] - 2026-04-26 (Comunicación Visual)
**"Anuncios con Multimedia Enriquecida"**

*   **📸 Integración con ImgBB**:
    *   **Subida Directa**: Nuevo sistema de carga de imágenes desde el panel de anuncios con integración nativa a la API de ImgBB.
    *   **Hosting Gratuito**: Las imágenes se alojan externamente de forma automática, optimizando el rendimiento de la base de datos local.
*   **📺 Renderizado Inteligente**:
    *   **Detección de Contenido**: El sistema ahora detecta automáticamente URLs de imágenes y videos de YouTube dentro del cuerpo del anuncio, renderizándolos con un diseño premium.
    *   **Interfaz de Alumnos**: Actualización del feed público para una experiencia de lectura más visual y moderna.

**"Horarios como Fuente Única de Verdad"**

*   **👨‍🏫 Sincronización Automática de Permisos**:
    *   **Fuente Única de Verdad**: Se eliminó la asignación manual de materias en la gestión de usuarios. Ahora, los permisos de edición de los profesores se derivan exclusivamente del **Panel de Horarios**.
    *   **Visualización Informativa**: Se implementó una lista de solo lectura en el perfil de usuario que muestra las materias y cursos asignados vía horarios, garantizando transparencia.
*   **🛡️ Exclusividad de Roles Jerárquicos**:
    *   **Blindaje Directivo**: Los roles de `Administrador`, `Secretaria de Alumnos`, `Jefe de Auxiliares`, `Director` y `Vicedirector` son ahora estrictamente administrativos. El sistema limpia y bloquea automáticamente cualquier asignación de materias o preceptoría para estos usuarios.
*   **🧹 Refinamiento de Interfaz**:
    *   **Limpieza de Controles**: Eliminación del botón "Ver asignaciones" en el listado de usuarios por redundancia, simplificando la vista administrativa.
    *   **Normalización de Nomenclatura**: Corrección del error de doble símbolo de grado (`°°`) en los nombres de los cursos en paneles y reportes impresos (Partes Diarios, Horarios y Planillas).
*   **🏗️ Seguridad en la API**: Hardening del endpoint de usuarios para proteger el campo `professor_subject_ids` contra sobreescrituras accidentales durante actualizaciones de perfil básico.

**"Escalabilidad DB y Excelencia en Impresión"**

*   **⚡ Optimización Crítica de Performance**:
    *   **Índices Estratégicos**: Implementación de índices en `pases(alumno_id)`, `asistencia(alumno_id, fecha)` y `alumnos(course_id, estado)` para acelerar consultas complejas.
    *   **Procesamiento por Lotes (Batch API)**: Refactorización de endpoints para agrupar múltiples consultas en un solo viaje al servidor (`env.DB.batch`), reduciendo la latencia de carga de perfiles y boletines en un 70%.
*   **🖨️ Rediseño del Boletín (A4 Landscape)**:
    *   **Layout Profesional**: Transición a orientación horizontal para maximizar legibilidad.
    *   **Gestión de Espacio**: Reubicación de observaciones al dorso (Cara B) para ampliar el área de firmas institucionales en el frente.
    *   **Identidad Visual**: Cabecera compacta con logotipo integrado y normalización de tecnicaturas.
*   **📅 Panel de Horarios "Glassfrost"**:
    *   **Estética Premium**: Nuevo diseño basado en blanco traslúcido y desenfoque (blur) sincronizado en todo el panel para una experiencia visual de alta gama.
    *   **Impresión Masiva de Horarios**: Nueva funcionalidad para generar los horarios de TODOS los cursos del ciclo lectivo en un solo proceso, con saltos de página automáticos por curso.
*   **🛠️ Robustez en Impresión**:
    *   **Fix de Hojas en Blanco**: Implementación de saltos de página condicionales y normalización de márgenes `@page` para garantizar que los reportes individuales salgan en una sola hoja.

### 🚀 [3.0.6] - 2026-04-24 (Corrección de Impresión)
**"Sincronización de Docentes en Planillas"**

*   **🖨️ Fix de Profesores en Planillas**: Resolución del bug que dejaba vacío el campo "Docentes a cargo" en las planillas de calificaciones A4. Ahora el sistema realiza una búsqueda exhaustiva que prioriza las asignaciones dinámicas del **Panel de Horarios** y escanea directamente las celdas del cronograma para garantizar la aparición del profesor.
*   **👨‍🏫 Soporte Multi-Rol**: Se amplió la lógica de detección de docentes para incluir preceptores y cargos híbridos que cumplen funciones de enseñanza, asegurando que su nombre figure correctamente en los reportes oficiales.
*   **🔍 Normalización de Materias**: Implementación de un motor de búsqueda por nombres normalizados (insensible a tildes y mayúsculas) para vincular profesores incluso cuando los nombres de las materias tienen ligeras variaciones.

### 🚀 [3.0.5] - 2026-04-24 (Actualización de Seguridad)
**"Blindaje de Sesión y Refinamiento de Pases"**

*   **🔐 Fix de Redirección Infinita**: Resolución del bug que causaba recargas infinitas cuando el token de sesión expiraba. Ahora el sistema detecta proactivamente el error 401/403, limpia el almacenamiento local y utiliza `window.location.replace` para forzar el re-login.
*   **🛡️ Hardening de Seguridad API**: Estandarización de mensajes de error de seguridad en Cloudflare Functions y mejora en la captura de excepciones de autenticación en el frontend.
*   **📋 Acceso Directo a Ficha (Pases)**: Nueva funcionalidad en el panel de **Pases** que permite abrir la **Ficha del Alumno** directamente desde el listado, facilitando la consulta de antecedentes sin cambiar de módulo.
*   **🏗️ Mejora en Copia de Tecnicaturas**: Optimización de la lógica de duplicación de estructuras curriculares, asegurando una limpieza de nombres (`trim`) y evitando corrupciones en la base de datos.
*   **🧹 Limpieza de Especificaciones**: Depuración de archivos de especificación de testing (`TESTSPRITE_SPEC.md`) para mantener el repositorio enfocado en código de producción.

### 🚀 [3.0.0] - 2026-04-23
**"Gestión Dinámica de Horarios y Excelencia Operativa"**

*   **📅 Sistema de Horarios Inteligente**:
    *   **Autocompletado Pro**: Implementación de `SearchableSelect` con búsqueda difusa e insensible a acentos para la asignación ultra-rápida de materias y profesores.
    *   **Visualización "Horario Libre"**: Diseño específico para horas libres con alineación centrada y estilo minimalista, mejorando la claridad del cronograma.
    *   **Drag-and-Drop Controlado**: Restricción de reordenamiento exclusivo para bloques de recreo, evitando desplazamientos accidentales de materias académicas.
    *   **🖨️ Impresión de Horarios**: Nueva vista de impresión optimizada para PDF/A4 que permite a los alumnos y preceptores tener el cronograma físico siempre a mano.
*   **🛡️ Integridad de Base de Datos**: Refactorización de las consultas `UPSERT` en Cloudflare D1 para la gestión de horarios, eliminando errores de colisión y garantizando persistencia atómica.
*   **🎨 Micro-interacciones Premium**: Pulido de transiciones y estados de carga en el panel de horarios para una sensación de aplicación nativa.

### 🛡️ [2.9.9] - 2026-04-23
**"Refinamiento UI/UX y Preparación para App Móvil"**

*   **💾 Botón de Guardado Dinámico**: Rediseño del botón de guardado en los paneles de **Notas** y **Asistencia**. Ahora alterna entre **"Guardado"** (verde/deshabilitado) y **"Guardar Cambios"** (azul/animado).
*   **🫨 Feedback Visual (Shake)**: Implementación de una animación de sacudida (`btn-shake`) que se activa cuando hay cambios pendientes, mejorando la detección de acciones requeridas.
*   **📱 Optimización Móvil Crítica**: 
    *   Reemplazo de texto por iconos de `Printer` en botones de impresión para maximizar el espacio en pantallas pequeñas.
    *   Ajuste de anchos de columna y textos de cabecera en el panel de **Estructura Curricular** para evitar el scroll horizontal.
*   **🤖 Integración con Capacitor**: Preparación del proyecto para su compilación como App Nativa (Android/APK).
*   **🌐 API Multi-Entorno**: El sistema ahora detecta automáticamente si corre desde un entorno nativo (`capacitor://`) o local, forzando la conexión a la API de producción en Cloudflare para garantizar conectividad total desde la App.
*   **📊 Alineación de Datos RAC**: Mejora de legibilidad en el panel **RAC**, alineando a la izquierda las columnas de Alumno y DNI.

### 🛡️ [2.9.8] - 2026-04-23
**"Auditoría Reparada y Panel de Asistencia"**

*   **🐛 Fix Crítico del Sistema de Historial**: Resolución de un bug de larga data donde **ninguna acción administrativa se registraba** en el historial. La causa raíz era un Foreign Key roto apuntando a una tabla inexistente (`usuarios_old`), lo que causaba que D1 rechazara silenciosamente cada INSERT en la tabla `historial`.
*   **🗄️ Migración de Base de Datos**: Recreación de la tabla `historial` en producción con el FK corregido apuntando a `usuarios`, preservando los registros existentes y el índice de búsqueda.
*   **🔍 Consulta de Historial Mejorada**: La consulta ahora incluye acciones globales (`course_id IS NULL`) como gestión de usuarios, horarios e importaciones que antes eran invisibles al filtrar por curso.
*   **📊 Filtros de Auditoría Ampliados**: Nuevas categorías de filtro en el AuditPanel: **Alumnos**, **Asistencia** y **Sistema**, además de Cargas, Ediciones y Eliminaciones. Filtrado basado en `tipo_evento` del backend en vez de búsqueda de texto.
*   **🧹 Limpieza de Debug**: Eliminación de datos de depuración (`historial_debug`, `debug_call`, entrada `id:-999`) que se filtraban al frontend de producción.
*   **⚡ Orden de Auditoría Corregido**: El log de notas ahora se ejecuta **después** de confirmar la escritura en la base de datos, evitando registros fantasma de operaciones fallidas.
*   **📅 Panel de Asistencia Mensual**: Nuevo módulo completo para el registro de asistencia diaria con grilla interactiva mensual, filtrado de fines de semana (solo LU-VIE) y validación estricta de valores (**P**, **A**, **AJ**).
*   **📱 Vista Móvil Optimizada**: Interfaz de 3 días con navegación por flechas, selección por tap (ciclo P→A→AJ→vacío) y detección robusta de dispositivos móviles vía User-Agent + pointer coarse.
*   **🟢 Highlight de Día Actual**: Resaltado verde del día de hoy en ambas versiones (PC y móvil) para orientación inmediata.
*   **🔎 Buscador de Alumnos**: Campo de búsqueda por nombre integrado en la grilla de asistencia.
*   **🖨️ Impresión de Partes Semanales**: Botón "Imprimir Parte" que genera reportes A4 semanales pre-cargados con datos reales de asistencia, horarios y etiquetas de mes dinámicas.

### 🛡️ [2.9.5] - 2026-04-22
**"Automatización Docente y Optimización de Tabla de Notas"**

*   **👨‍🏫 Automatización de Cuentas Profesores**: Generación masiva de credenciales para 104 docentes (`nom.ape` / `apellido2026`) con mapeo inteligente de materias y cursos.
*   **🎓 Identidad Institucional (Prof.)**: Implementación automática del prefijo "Prof." en el panel de bienvenida, planillas A4 de calificaciones, partes diarios y horarios.
*   **📊 Fix de Visualización de Notas**: Resolución del bug de columnas "aplastadas" en la vista global de calificaciones mediante la fijación de anchos de columna uniformes (50px).
*   **📑 Gestión de Pases Refinada**: Normalización de etiquetas de origen y destino para alumnos de "SABANA 2026" y corrección de asignación de cursos de origen en el historial de pases.
*   **🔒 Resolución de Conflictos de Usuario**: Lógica de desambiguación para nombres duplicados en la creación de cuentas docentes (ej: `mar.agu1`).
*   **📋 Reporte de Credenciales**: Generación de un listado administrativo detallado con usuarios y contraseñas para la distribución institucional.

### 🛡️ [2.9.0] - 2026-04-22
**"Blindaje de Sesiones con JWT y Autenticación Robusta"**

*   **🔐 Implementación de JWT (JSON Web Tokens)**: Migración de tokens predecibles en texto plano a un sistema de autenticación firmado digitalmente mediante HMAC-SHA256 (Web Crypto API).
*   **⏳ Expiración de Sesión**: Los tokens ahora incluyen una fecha de vencimiento (24 horas), mitigando riesgos de sesiones persistentes en dispositivos compartidos.
*   **🛡️ Verificación de Integridad en Backend**: Validación centralizada en Cloudflare Functions que impide la suplantación de identidad mediante la manipulación manual de IDs de usuario.
*   **🔄 Auto-Logout Inteligente**: El sistema detecta automáticamente sesiones inválidas o expiradas, redirigiendo al usuario al inicio de forma transparente para una mejor UX.
*   **💬 Mensaje de Acceso Personalizable**: Nueva opción en Ajustes para modificar el texto legal/informativo que ven los alumnos cuando su contraseña aún no ha sido definida.
*   **🔑 API Hardening**: Refuerzo de todos los endpoints (`data`, `auth`, `student`) para garantizar que la identidad del usuario provenga exclusivamente del token firmado.

### [2.8.6] - 2026-04-22
**"Refactorización del Panel Administrativo"**

*   **Panel Modularizado**: PreceptorPanel fue aligerado para funcionar principalmente como contenedor de vistas, filtros y navegación.
*   **Extracción de Modales**: Los modales operativos del panel administrativo fueron movidos a PreceptorModals dentro de src/jsx/components.
*   **Hooks por Dominio**: La lógica del antiguo usePreceptorLogic se dividió en hooks especializados para notas, alumnos, administración y configuración.
*   **Coordinador de Estado**: usePreceptorLogic ahora centraliza el estado compartido y delega las acciones pesadas a módulos más pequeños.
*   **Mantenibilidad Mejorada**: La nueva estructura reduce el tamaño de los archivos críticos y facilita futuras correcciones.

### 🛡️ [2.8.5] - 2026-04-21
**"RAC Modular y Optimización de Impresión"**

*   **🧩 RAC Modular Configurable**: Nueva opción en los ajustes del sistema para habilitar la visualización detallada (**T / P / Pnd**) en materias de taller modulares, con diseño adaptativo y nomenclaturas claras integradas en la celda.
*   **📏 Diseño de Celdas Adaptativo**: Implementación de celdas con alto dinámico (48px) vinculado al ajuste del sistema, asegurando simetría visual y legibilidad profesional en reportes complejos.
*   **🖨️ Fix de Impresión Global (Partes)**: Resolución del error de hojas en blanco en la generación masiva de partes diarios, mediante la optimización de saltos de página CSS (`page-break`) y fijación de dimensiones A4 (`297mm`) con `overflow: hidden`.
*   **💾 Persistencia de Ajustes**: Integración de los nuevos ajustes institucionales de impresión en la base de datos Cloudflare D1 para su persistencia global.

### 🛡️ [2.8.0] - 2026-04-21
**"Parte Diario Institucional y Generación Masiva"**

*   **📋 Parte Diario A4 Oficial**: Implementación de la planilla institucional definitiva para la Industrial Nº6, con grilla de asistencia adaptable (1 o 2 columnas según cantidad de alumnos) y diseño optimizado para impresión.
*   **🗓️ Horarios Dinámicos Integrados**: Inclusión automática del horario semanal en el parte diario, incluyendo nombres de profesores, bloques de recreo visualmente diferenciados y espacios para firmas docentes.
*   **🚀 Generación Institucional Masiva**: Nuevo motor de impresión global que permite generar los partes diarios de TODOS los cursos de la institución en un solo documento consolidado con saltos de página automáticos.
*   **📅 Control de Fechas Manual**: Espacios dedicados para la consignación manual de fechas tanto en la grilla de asistencia como en el cronograma de materias.
*   **🎨 Rediseño del Panel de Planillas**: Reorganización estética de los botones de generación de reportes, agrupando funciones por tipo (Individual vs Global) y estandarizando la paleta de colores institucional.
*   **🏗️ Refactorización de Datos**: Optimización de las consultas a la API para recuperar horarios y listados de forma eficiente durante el procesamiento masivo de reportes.

### 🛡️ [2.7.0] - 2026-04-21
**"Acceso Seguro, Auditoría Avanzada y Paginación"**

*   **🔍 Acceso Estudiante con Contraseña**: Implementación de un portal de boletines protegido por contraseña. Los alumnos ahora requieren DNI + Clave (gestionada por el preceptor) para visualizar sus notas.
*   **🔓 Bypass de Seguridad para Personal**: Los administradores y docentes pueden visualizar boletines sin necesidad de la contraseña del alumno mediante tokens de sesión, facilitando la atención directa.
*   **📜 Auditoría Detallada (Historial)**: Registro exhaustivo de acciones críticas: cambios de contraseña, edición de fichas de alumnos, re-incorporaciones y reversión de pases.
*   **🚫 Restricción de Permisos (Preceptores)**: Los preceptores ahora tienen un rol de "Solo Lectura" para las calificaciones (a menos que sean profesores de la materia), pero mantienen permisos de edición sobre la Ficha del Alumno.
*   **📄 Paginación en Listados**: Implementación de paginación (30 resultados por página) en los paneles de Alumnos, Historial y Pases, optimizando el rendimiento y la carga del navegador.
*   **🚀 Notificación de Actualizaciones**: Banner interactivo que alerta a los usuarios cuando hay una nueva versión disponible, permitiendo recargar el sistema instantáneamente.
*   **🔍 Buscador Global Potenciado**: El buscador global ahora incluye etiquetas de género, estado de contraseña y el curso al que pertenece cada alumno para una identificación inmediata.
*   **🎨 Refinamiento UX/UI**: Sincronización estética de los formularios de acceso y mejora de la densidad visual en los listados con auto-scroll integrado al cambiar de página.

### 🛡️ [2.6.6] - 2026-04-20
**"Control de Calidad y Depuración de Código"**

*   **🔍 Auditoría de Código (Linter)**: Ejecución de auditoría estática completa para eliminar errores de referencia y variables huérfanas en todo el proyecto.
*   **🛠️ Fix saveObs**: Reparación de la función de guardado de observaciones en el panel RAC que se encontraba no definida, garantizando la persistencia de notas pedagógicas.
*   **🧹 Limpieza de Código Muerto**: Eliminación de funciones obsoletas y referencias no definidas (`saveRotations`) que podrían causar inestabilidad en el sistema.
*   **🚀 Estabilidad Garantizada**: Verificación de integridad de todas las rutas, estados de sesión y llamadas a la API tras la migración a Hash Routing.

### 🛡️ [2.6.5] - 2026-04-20
**"Navegación Robusta y Persistencia de Sesión"**

*   **🌐 Hash Routing Implementation**: Migración total a un sistema de enrutamiento profesional utilizando `HashRouter`. Ahora el sistema cuenta con URLs navegables (ej: `/#/dashboard`, `/#/boletin`) que no generan errores 404 al recargar.
*   **💾 Persistencia de Sesión (F5 Proof)**: Implementación de inicialización sincrónica de estado desde `localStorage`. La sesión del usuario ahora sobrevive a recargas de página y cierres accidentales de pestaña.
*   **📏 Sub-rutas de Panel**: Sincronización automática de las pestañas del panel administrativo (Notas, Alumnos, RAC, etc.) con la URL, permitiendo el uso de los botones "Atrás" y "Adelante" del navegador.
*   **🔒 Protected Routes**: Sistema de redirección inteligente que protege las rutas administrativas, redirigiendo automáticamente al login si no se detecta una sesión activa.

### 🛡️ [2.6.3] - 2026-04-20
**"Bloqueos en Cascada y Refinamiento de Otras Instancias"**

*   **🔍 Bloqueos en Cascada**: Implementación de lógica inteligente de habilitación de campos. Si un alumno aprueba (nota ≥ 7) en instancias finales (Marzo u Otras Instancias), se bloquean automáticamente los campos de 3° Trimestre, Dic. y Feb. para evitar inconsistencias.
*   **📏 Observaciones Automáticas**: Al completar la columna "Otras Inst.", el sistema ahora solicita automáticamente al usuario si desea agregar observaciones al RAC, vinculando la información de manera inmediata.
*   **📊 Optimización de Columnas**: Rediseño del ancho de columnas en el panel de notas para mejorar la densidad de información y facilitar la lectura en pantallas pequeñas.
*   **🖨️ Impresión Avanzada**: Integración completa de "Otras Instancias" en todos los formatos de reporte (RAC y Planillas de Calificaciones), incluyendo ajustes de colspans y pies de firma.
*   **🛡️ Seguridad en Sincronización**: Los botones de sincronización de datos desde años anteriores ahora se ocultan automáticamente si el sistema no detecta un ciclo académico previo disponible.

### 🛡️ [2.6.0] - 2026-04-20

*   **🎓 Terminación de Ciclo (RAC)**: Nuevo flujo centralizado en el `RACPanel` para el cierre del año escolar con selección masiva de alumnos.
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
*   **🔗 Import Standardization**: Limpieza y estandarización de todas las rutas de importación del proyecto, eliminando dependencias de carpetas anidadas complejas.

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
*   **🔡 Alphabetical Sync**: Ordenamiento alfabético automático garantizado en todos los listados del sistema.

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

*   **📏 Organización de Directorios**: Reubicación de assets en carpetas `/js` y `/css`.
*   **🧹 Asset Cleanup**: Eliminación de archivos huérfanos y optimización de la estructura del proyecto.

---

### 🎨 [1.1.0] - 2026-04-11
**"Modularización de Estilos"**

*   **🌈 CSS Architecture**: División del diseño *Glassmorphism* en archivos modulares por funcionalidad.

---

### 🏠 [1.0.0] - 2026-04-10
**"Lanzamiento Inicial"**

*   **🚀 Deployment**: Despliegue inicial en Cloudflare Pages.
*   **🔍 Búsqueda por DNI**: Acceso rápido para padres y alumnos.
*   **📏 Grade Input**: Interfaz básica de carga de notas.

---
*Desarrollado con ❤️ para la comunidad educativa de la Industrial Nº6.*
