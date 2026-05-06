# 🎓 Sistema de Gestión Escolar - Industrial Nº6

> **Suite administrativa profesional para la gestión de calificaciones, alumnos y reportes institucionales.**

---

## 📜 Registro de Cambios (Changelog)

### 🚀 [3.6.1] - 2026-05-06 (Refinamiento de Previas y Egresados)
**"Gestión Inteligente de Previas y Sincronización Global de Graduados"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🎓 Gestión Dinámica de Previas**:
    - **Normalización Curricular**: Motor de búsqueda inteligente que ignora tildes y mayúsculas, agrupando materias idénticas (ej: *Matemática*) entre distintos años.
    - **Diferenciación de Carga**: 
        - Las materias únicas autocompletan el año automáticamente.
        - Las materias repetidas habilitan un selector desplegable filtrado por la tecnicatura del alumno.
    - **UX de Búsqueda**: Inclusión de "pistas de año" visuales (ej: `Informatica (1°)`) en los resultados de búsqueda para una identificación inequívoca.
*   **📊 Registro de Egresados Interactivo**:
    - **Edición en Tiempo Real**: Los administradores ahora pueden modificar el estado de un graduado entre **Egresado** (con deuda) y **Recibido** (sin deuda) directamente desde la tabla.
    - **Sincronización de Historial (RAC)**: La actualización del estado se propaga automáticamente a la tabla de `historial_escolar`, garantizando que las impresiones de RAC y antecedentes reflejen el cambio al instante.
*   **🎨 Identidad Visual de Graduación**:
    - **Código de Colores Premium**:
        - **Dorado (Gold)**: Identificación visual para alumnos **Egresados**.
        - **Esmeralda (Green)**: Identificación visual para alumnos **Recibidos**.
    - Los badges y avatares ahora utilizan esta paleta institucional para una auditoría visual rápida del estado de titulación.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🩹 Robustez en API (D1)**: 
    - Implementación de actualizaciones parciales en el handler de alumnos para evitar errores de tipo (`D1_TYPE_ERROR`) ante campos omitidos.
    - Normalización de tipos de datos (`toNumber`) en las consultas de sincronización de historial para asegurar compatibilidad total con el motor SQL.

### 🚀 [3.6.0] - 2026-05-05 (Automatización de Impresión y Gestión de Suplentes)
**"Plantillas Horarias Institucionales y Detección Inteligente de Docentes"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📋 Plantillas Horarias Dinámicas**: 
    - Implementación de `HORARIOS_TEMPLATES` que se ajustan automáticamente según el **Turno** (Mañana/Tarde) y el **Ciclo** (Básico/Superior).
    - Esto garantiza que los bloques horarios (slots) y recreos coincidan exactamente con la estructura horaria oficial de la institución.
*   **👥 Gestión Avanzada de Suplentes en Impresión**:
    - **Detección Automática**: El sistema ahora analiza la metadata de asignaciones para identificar docentes suplentes.
    - **Visualización Dual**: Al imprimir el horario, si existe un suplente, se muestran ambos nombres (Titular y Suplente) de forma clara y profesional.
*   **📐 Optimización de Espacio A4**:
    - Cálculo dinámico del alto de filas (`rowHeight`) restando el espacio de los recreos para maximizar la legibilidad en la hoja impresa sin desbordamientos.
*   **🔄 Migración y Auto-corrección de Datos**:
    - Nueva lógica que valida y corrige automáticamente la estructura de la grilla al momento de imprimir, asegurando la compatibilidad de horarios antiguos con las nuevas plantillas institucionales.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🩹 Fix de Lógica de Ciclo**: Corrección en la comparación de años escolares (`parseInt`) para una clasificación precisa entre Ciclo Básico y Superior en todos los módulos de impresión.

 
### 🚀 [3.5.9] - 2026-05-04 (Optimización y Experiencia Móvil UI/UX)
**"Rediseño Responsivo de Horarios y Asistencias"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📱 Rediseño de Horarios Móvil**:
    - **Carrusel Interactivo**: Transformación de la grilla de horarios de escritorio en un carrusel dinámico para dispositivos móviles que centra automáticamente el día actual.
    - **Editor Masivo tipo Pilas**: Adaptación del asignador masivo de docentes a un formato vertical de "tarjetas" (cards), simplificando la visualización en pantallas pequeñas al ocultar campos redundantes (como N° y Tipo).
*   **📱 Mejoras en Panel de Asistencias Móvil**:
    - **Animaciones UI**: Se integró un efecto visual de deslizamiento suave (slide-fade) al navegar entre días de la semana mediante las flechas de control.
    - **Leyendas Optimizadas**: Reestructuración y agrupación responsiva de las referencias de asistencia para ajustarse armónicamente y evitar desbordamientos en la vista móvil.
*   **🛡️ UX y Seguridad (Asistencia)**:
    - Se añadió un control preventivo (`window.confirm`) al intentar marcar el Paro Docente general para evitar sobreescrituras accidentales en la grilla.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🩹 Accesibilidad de Módulos**: Remoción de los bloqueos condicionales (`!isMobile`) en el panel central que impedían el acceso al módulo de Horarios desde smartphones.

 
### 🚀 [3.5.8] - 2026-04-29 (Sistema Global de Egresados y Refinamiento Académico)
**"Registro Histórico Global, Egreso Diferenciado y Auditoría de Promoción"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🎓 Registro Global de Egresados**:
    - **Panel Centralizado**: Nueva pestaña "Egresados" restringida a roles administrativos (`admin`, `secretaria_de_alumnos`).
    - **Listado Histórico**: Repositorio global de todos los alumnos que finalizaron 6to año, con búsqueda y filtrado por estado de egreso.
    - **Ficha Técnica**: Acceso directo al legajo y antecedentes académicos de los graduados desde el listado global.
*   **🔄 Refactorización de Terminación de Ciclo (6to Año)**:
    - **Egreso Diferenciado**: Nueva lógica para alumnos de último año que permite clasificarlos como **Recibido** (sin deudas) o **Egresado** (con materias pendientes).
    - **Cierre Automático**: Al graduarse, el sistema desvincula al alumno del curso activo, registra su ciclo de egreso y actualiza su estado a "Graduado" (`estado = 2`).
*   **📝 Auditoría Automática de Promoción**:
    - **Etiquetado Inteligente**: El sistema ahora analiza automáticamente el total de previas y materias del año para registrar en la ficha del alumno:
        - *Promovido*: Sin materias adeudadas o previas.
        - *Promocionado*: Con materias adeudadas o previas.
        - *Repitente*: Con indicación del ciclo lectivo a recursar.
    - **Observaciones Pedagógicas**: Nueva sección en la Ficha del Alumno que consolida el historial de promociones y notas administrativas.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🩹 Fix de Referencia (FileText)**: Corrección de error `ReferenceError` en el componente de Ficha de Alumno tras la actualización de iconos.
*   **🗄️ Sincronización DB**: Actualización del esquema de producción para soportar metadatos de egreso (`egresado_tipo`, `ciclo_egreso`).

### 🚀 [3.5.7] - 2026-04-28 (Fix de Transferencias)
**"Acceso Global a Destinos de Transferencia para Preceptores"**

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🔄 Fix de Transferencia de Alumnos**: Resolución del error que mostraba una lista vacía de cursos destino para los auxiliares/preceptores.
*   **⚙️ Optimización de Visibilidad de Cursos**: Se independizó el listado institucional de cursos (`allCourses`) de las restricciones de navegación personal, garantizando que todas las operaciones administrativas de traslado cuenten con la información completa de la institución.

### 🚀 [3.5.6] - 2026-04-28 (Reportes de Año Lectivo y Estabilidad de Datos)
**"Resumen Académico, Fix de Historial y Optimización D1"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📊 Módulo de Resumen del Año Lectivo**:
    *   **Dashboard de Estadísticas**: Nueva función "Ver Detalles" en Ajustes que ofrece un desglose instantáneo del año escolar seleccionado.
    *   **Métricas de Población**: Cálculo en tiempo real de alumnos activos y alumnos dados de pase en todo el ciclo.
    *   **Desglose por Curso**: Reporte detallado de cada división que incluye:
        - Distribución por Género (Varones/Mujeres).
        - Conteo de Repitentes (basado en el historial académico registrado).
*   **🕵️ Refactorización de Conteo de Repitentes**:
    *   **Lógica basada en Historial**: El sistema ahora escanea la tabla de antecedentes (`historial_escolar`) buscando marcas de repitencia para garantizar que los reportes reflejen la realidad académica de los alumnos matriculados.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🩹 Fix de Visualización de Antecedentes**: Resolución de la inconsistencia que impedía ver el historial académico en ciertos perfiles de alumnos tras la última migración.
*   **⚙️ Estabilidad de API (D1 SQL)**: 
    *   Corrección de errores de binding de parámetros en Cloudflare D1 que causaban el fallo del módulo de resumen.
    *   Sincronización de esquema: Actualización de nombres de tablas y columnas en las consultas SQL para coincidir estrictamente con el esquema de producción (`años_lectivos`, `ano`, `division`, `turno`).
*   **🛠️ Corrección de Importaciones**: Resolución de `ReferenceError: apiService is not defined` en el hook de acciones administrativas.

### 🚀 [3.5.5] - 2026-04-28 (Seguridad, Auditoría y Buscador Pro)
**"Bcrypt, Categorización de Historial y Búsqueda Avanzada"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔐 Seguridad de Contraseñas (Bcrypt)**:
    - **Hash Bcrypt**: Migración del almacenamiento de contraseñas de texto plano a hashes Bcrypt robustos.
    - **Auto-migración Transparente**: Sistema de validación dual que hashea automáticamente las contraseñas antiguas tras el primer inicio de sesión exitoso.
*   **🕵️ Auditoría y Validación Refinada**:
    - **Detección de Duplicados**: Nuevo sistema de validación en la creación de usuarios que impide registros duplicados, mostrando una advertencia visual clara ("letras rojas claras") en el modal de administración.
    - **Categorización Inteligente de Historial**: 
        - Los cambios y reseteos de contraseña ahora se agrupan estrictamente en el apartado **Sistema** (Pink/Config) para mejor trazabilidad administrativa.
        - Las actualizaciones de **Horarios** se han trasladado al apartado **Ediciones (Todos)** para que los preceptores tengan visibilidad directa de los cambios académicos.
*   **🔍 Buscador Pro en Ajustes**:
    - **Búsqueda Multi-Criterio**: El buscador de gestión de usuarios ahora permite filtrar por **Rol**, **Curso** (para preceptores) y **Materia** (para profesores), además del nombre e ID tradicional.
*   **⏳ Sesiones Deslizantes (Sliding Expiration)**:
    - **Expiración de 1 Hora**: Configuración de sesiones con vencimiento de una hora.
    - **Refresco Automático**: Implementación de un middleware en la API (`X-Refresh-Token`) y un interceptor global en el frontend que renuevan el token automáticamente ante la actividad del usuario, evitando cierres de sesión por inactividad.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   Resolución de `ReferenceError: setUserError is not defined` que impedía la apertura del modal de gestión de usuarios tras el último despliegue.

### 🚀 [3.5.4] - 2026-04-28 (Avisos de Seguridad Dinámicos)
**"Mensajería Especial para Reseteos Administrativos"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🛡️ Protocolo de Reseteo Mejorado**:
    - **Identificación de Origen**: Implementación de la bandera `reset_by_admin` en la base de datos y API para diferenciar entre el primer ingreso general y un reseteo forzado por administración.
    - **Aviso Especial de Seguridad**: El modal de bienvenida ahora detecta si la clave fue puesta por un administrador, mostrando un mensaje de advertencia específico ("Acción de Seguridad") con iconografía de alerta para incentivar el cambio de clave inmediata.
    - **Sincronización de Estado**: Limpieza automática de la marca de reseteo una vez que el usuario establece su propia contraseña o reconoce la actual.

### 🚀 [3.5.3] - 2026-04-28 (Permisos Híbridos y Estabilidad de Sesión)
**"Soporte Integral para Profesores/Preceptores y Robustez en Sesiones"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🎭 Soporte para Usuarios Híbridos (Profesor + Preceptor)**:
    - **Permisos Granulares**: Refactorización completa de los handlers de la API (**Asistencia**, **Alumnos**, **Calificaciones** y **Bloqueos**) para reconocer y agregar permisos de usuarios híbridos. Ahora los profesores con funciones de preceptoría pueden gestionar sus cursos asignados sin conflictos de rol.
    - **Interfaz Dinámica**: El panel del preceptor ahora detecta automáticamente si un profesor es híbrido, habilitando las pestañas de **Asistencia**, **Alumnos**, **Materias**, **RAC** e **Historial** que anteriormente estaban restringidas.
    - **Modos de Vista**: Se habilitó el acceso a la vista "Todas las Materias" para profesores híbridos, permitiéndoles supervisar el curso completo como preceptores.
*   **🛠️ Refinamiento de UI/UX**:
    - **Banderas de Permisos**: Actualización de la lógica en `usePreceptorLogic` para habilitar acciones de transferencia y gestión de alumnos basadas en la suma de privilegios del usuario.
    - **Selector de Sector Inteligente**: El panel de asistencia ahora pre-selecciona el sector correcto para usuarios híbridos, optimizando el flujo de carga.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Anti-Logout Proactivo**: Eliminación del error 403 (Forbidden) como disparador de cierre de sesión automático. Los usuarios ya no son expulsados del sistema al intentar acceder a secciones sin permisos; en su lugar, reciben una notificación de aviso preservando su token.
*   **Persistencia de Status Híbrido**: Inclusión de la bandera `is_professor_hybrid` en el payload de autenticación para una configuración inmediata de la UI tras el login.

### 🚀 [3.5.2] - 2026-04-27 (Auditoría Refinada y Seguridad de Ingreso)
**"Privacidad de Logs y Protocolo de Bienvenida Obligatorio"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🕵️ Refactorización del Sistema de Auditoría**:
    *   **Privacidad Granular**: Restricción de visibilidad de los logs de **Alumnos**, **Asistencia** y **Sistema** exclusivamente para los roles de **Administrador** y **Jefe de Auxiliares**, protegiendo la trazabilidad operativa.
    *   **Visualización por Colores**: Implementación de indicadores visuales (borde izquierdo) para logs de sistema: **Verde** para creación de usuarios y **Amarillo/Naranja** para actualizaciones.
    *   **Optimización de Pestañas**: Los logs de **Sistema** ahora están confinados a su propia pestaña (oculta para roles no autorizados) y excluidos de la vista general "Todos" para reducir el ruido visual.
    *   **Nomenclatura Oficial**: Actualización de etiquetas de historial de calificaciones a **"Carga de Nota"** y **"Edición"**, con lógica de reseteo automático tras eliminaciones.
*   **🛡️ Bienvenida y Seguridad Obligatoria**:
    *   **Protocolo de Ingreso**: Nueva ventana obligatoria al iniciar sesión que solicita el cambio de contraseña como medida de seguridad institucional.
    *   **Persistencia Anti-Bypass**: Implementación de bloqueo mediante `sessionStorage`, garantizando que la ventana sea ineludible incluso ante recargas de página o manipulación de URL hasta que el usuario elija una opción.
    *   **Autogestión de Claves**: Desarrollo de un nuevo endpoint de backend y lógica de frontend que permite a cualquier usuario actualizar su propia contraseña de forma segura sin intervención administrativa.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Restauración de API**: Corrección de importaciones en `data.js` para asegurar la operatividad total de los handlers de gestión de usuarios y configuraciones.

### 🚀 [3.5.1] - 2026-04-27 (Seguridad de Roles y Regente de Profesores)
**"Blindaje de Permisos y Expansión Administrativa"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **👑 Nuevo Rol: Regente de Profesores**:
    *   **Gestión Académica**: Acceso especializado para la administración de **Horarios** y **Ajustes de Materias/Carreras**.
    *   **Supervisión Lectora**: Permisos de solo lectura en Calificaciones (RAC) e Historial para monitoreo institucional.
    *   **Integración UI/UX**: Incorporación del rol en el selector de creación de usuarios y lógica de exclusión de cursos (rol administrativo puro).
*   **🛡️ Sincronización de Matriz de Permisos**:
    *   **Hardening Administrativo**: Ajuste estricto de permisos para los roles de **Secretaría de Alumnos** y **Directivos** (Director/Vicedirector). Ahora operan en modo **Solo Lectura** en los módulos de Asistencia e Historial, preservando la integridad de la carga operativa.
    *   **Protección de Metadatos RAC**: Restricción de edición de datos maestros (Matrícula, Libro, Folio, Legajo) en el panel RAC, reservada exclusivamente para roles con permisos de gestión de alumnos.
*   **🛡️ Seguridad en API**: Refuerzo de los handlers de backend (`attendance`, `students`, `admin`) para validar permisos de escritura contra la matriz oficial de roles.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Crash en Horarios**: Resolución definitiva del error `ReferenceError: isAdmin is not defined` mediante la unificación de la lógica de permisos en el panel de cronogramas.
*   **Actualización de Esquema DB**: Ejecución de migración SQL para ampliar la restricción `CHECK` de la tabla `usuarios`, permitiendo la persistencia de los nuevos roles institucionales.

### 🚀 [3.5.0] - 2026-04-27 (Sectores, Navegación y Pulido Editorial)
**"Estructura Multi-Sector y Navegación Inteligente"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **🏆 Asistencia Multi-Sector**:
    *   **Segmentación de Carga**: Implementación de sectores diferenciados (**Teoría**, **Taller** y **Educación Física**) para el registro de asistencia, permitiendo una gestión precisa por área académica.
    *   **Consistencia en Base de Datos**: Actualización del esquema SQL y los handlers de la API para soportar la persistencia de datos por sector.
*   **🏹 Navegación Ágil de Cursos**:
    *   **Quick-Switch**: Incorporación de flechas de navegación (Chevron) junto al selector de cursos para un cambio rápido y fluido entre divisiones sin necesidad de re-abrir el menú desplegable.
    *   **Detección de Límites**: Lógica inteligente que inhabilita las flechas al llegar al principio o final del listado institucional.
*   **🖨️ Excelencia Editorial en Impresión**:
    *   **Precisión en Recreos**: Estandarización de la barra de descanso a **15px** con tipografía de **7pt**, logrando el equilibrio perfecto entre "línea vistosa" y ahorro de espacio.
    *   **Horario Libre Automático**: Las celdas sin materia asignada ahora muestran automáticamente la etiqueta **"HORARIO LIBRE"** centrada y en gris tenue, eliminando el ruido visual de campos vacíos.
*   **🎨 Pulido Visual de Horarios**:
    *   **High-Visibility (Golden Border)**: Los campos de entrada de "Horario Libre" en el editor ahora se resaltan con un borde dorado sólido (`#ffb300`) para una identificación inmediata durante la carga.
    *   **Identidad Recuperada**: Restauración de la lógica de colores dinámicos en los badges de especialidad y aumento de su tamaño de fuente a **0.8rem** para máxima legibilidad.
*   **🛡️ Auditoría de Roles**:
    *   **Reporte de Permisos**: Creación de una matriz técnica detallada de roles y permisos (`reporte_roles_permisos.txt`) para auditorías de seguridad institucional.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Plantillas (AllWeek)**: Resolución de errores de interpolación en los reportes mensuales masivos, asegurando que los datos de curso y mes se rendericen correctamente.

### 🚀 [3.4.1] - 2026-04-26 (Excelencia en Impresión y Pulido Visual)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🖨️ Color Fiel en Impresión**:
    *   **Hardening de Fondos**: Implementación de `print-color-adjust: exact` para forzar la impresión de banners de colores, superando las restricciones por defecto de los navegadores.
    *   **Consistencia Masiva**: Asegurada la preservación de colores institucionales en la generación masiva de PDF para todos los cursos.
*   **🎨 Consolidación de Identidad Visual**:
    *   **Sistema de Badges Global**: Unificación de las etiquetas de roles en un único motor de estilos (`index.css`), eliminando conflictos entre paneles.
    *   **Estética Sólida**: Transición de fondos traslúcidos a colores sólidos y vibrantes con tipografía Extra Bold, mejorando la legibilidad inmediata de los cargos jerárquicos.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Recreos Refinados**: Rediseño de la fila de descanso en el PDF; ahora es una línea fina (6mm), con tipografía minimalista y espaciado técnico que unifica todas las columnas.

### 🚀 [3.4.0] - 2026-04-26 (Automatización y Estructura Horaria)
**"Sincronización Inteligente y Validación de Integridad"**

#### ✨ Nuevas Implementaciones y Mejoras
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

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Depuración del Editor Masivo**: El editor de profesores ahora filtra automáticamente nombres de materias obsoletas o "zombies" que no pertenecen a la tecnicatura actual del curso, mostrando solo la estructura curricular vigente.

### 🚀 [3.3.0] - 2026-04-26 (Legajo Digital y Automatización)
**"Legajo Fotográfico y Ficha Inteligente"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📂 Legajo Digital de Alumnos**:
    *   **Imágenes Adjuntas**: Nueva sección en la ficha del alumno para adjuntar documentos (DNI, certificados médicos, etc.) mediante integración con ImgBB.
    *   **Gestión Segura**: La subida y eliminación de archivos está restringida al modo de edición de la ficha para evitar cambios accidentales.
    *   **Acceso Rápido**: Apertura directa de la imagen original en pestaña nueva con un clic, optimizando el flujo de trabajo.
    *   **Control Temporal**: Registro automático y visualización de la fecha de subida para cada documento.
*   **🧠 Inteligencia en Ficha**:
    *   **Cálculo de Edad Automático**: El sistema calcula la edad del alumno en tiempo real basándose en la fecha de nacimiento ingresada.
    *   **Limpieza de CUIL/DNI**: Automatismo que elimina guiones y caracteres no numéricos al editar, evitando errores de validación (11 dígitos).

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Corrección de Entrada de Fecha**: Se normalizó el parseo de fechas para asegurar que el selector del navegador nunca aparezca vacío si ya existe un dato.

### 🚀 [3.2.1] - 2026-04-26 (Comunicación Visual)
**"Anuncios con Multimedia Enriquecida"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📸 Integración Multimedia**:
    *   **Subida Directa**: Nuevo sistema de carga de imágenes desde el panel de anuncios con integración nativa a la API de ImgBB.
    *   **Detección de Contenido**: El sistema ahora detecta automáticamente URLs de imágenes y videos de YouTube dentro del cuerpo del anuncio, renderizándolos con un diseño premium.
*   **👨‍🏫 Sincronización Automática de Permisos**:
    *   **Fuente Única de Verdad**: Se eliminó la asignación manual de materias en la gestión de usuarios. Ahora, los permisos de edición de los profesores se derivan exclusivamente del **Panel de Horarios**.
*   **🛡️ Exclusividad de Roles Jerárquicos**:
    *   **Blindaje Directivo**: Los roles de `Administrador`, `Secretaria de Alumnos`, `Jefe de Auxiliares`, `Director` y `Vicedirector` son ahora estrictamente administrativos. El sistema limpia y bloquea automáticamente cualquier asignación de materias o preceptoría para estos usuarios.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Normalización de Nomenclatura**: Corrección del error de doble símbolo de grado (`°°`) en los nombres de los cursos en paneles y reportes impresos.
*   **Hardening de API**: Hardening del endpoint de usuarios para proteger el campo `professor_subject_ids` contra sobreescrituras accidentales durante actualizaciones de perfil básico.

### 🚀 [3.2.0] - 2026-04-25 (Escalabilidad DB y Excelencia en Impresión)

#### ✨ Nuevas Implementaciones y Mejoras
*   **⚡ Optimización Crítica de Performance**:
    *   **Procesamiento por Lotes (Batch API)**: Refactorización de endpoints para agrupar múltiples consultas en un solo viaje al servidor (`env.DB.batch`), reduciendo la latencia de carga de perfiles y boletines en un 70%.
*   **🖨️ Rediseño del Boletín (A4 Landscape)**:
    *   **Layout Profesional**: Transición a orientación horizontal para maximizar legibilidad.
    *   **Gestión de Espacio**: Reubicación de observaciones al dorso (Cara B) para ampliar el área de firmas institucionales en el frente.
*   **📅 Panel de Horarios "Glassfrost"**:
    *   **Estética Premium**: Nuevo diseño basado en blanco traslúcido y desenfoque (blur) sincronizado.
    *   **Impresión Masiva de Horarios**: Nueva funcionalidad para generar los horarios de TODOS los cursos del ciclo lectivo en un solo proceso.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Índices Estratégicos**: Implementación de índices en `pases(alumno_id)`, `asistencia(alumno_id, fecha)` y `alumnos(course_id, estado)` para acelerar consultas complejas.
*   **Fix de Hojas en Blanco**: Implementación de saltos de página condicionales y normalización de márgenes `@page` para garantizar que los reportes individuales salgan en una sola hoja.

### 🚀 [3.0.6] - 2026-04-24 (Corrección de Impresión)
**"Sincronización de Docentes en Planillas"**

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Profesores en Planillas**: Resolución del bug que dejaba vacío el campo "Docentes a cargo" en las planillas de calificaciones A4 mediante búsqueda exhaustiva en Horarios.
*   **Soporte Multi-Rol**: Se amplió la lógica de detección de docentes para incluir preceptores y cargos híbridos que cumplen funciones de enseñanza.
*   **Normalización de Materias**: Motor de búsqueda por nombres normalizados (insensible a tildes y mayúsculas) para vincular profesores.

### 🚀 [3.0.5] - 2026-04-24 (Actualización de Seguridad)
**"Blindaje de Sesión y Refinamiento de Pases"**

#### ✨ Nuevas Implementaciones y Mejoras
*   **📋 Acceso Directo a Ficha (Pases)**: Nueva funcionalidad en el panel de **Pases** que permite abrir la **Ficha del Alumno** directamente desde el listado.
*   **🏗️ Mejora en Copia de Tecnicaturas**: Optimización de la lógica de duplicación de estructuras curriculares, asegurando una limpieza de nombres (`trim`).

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix de Redirección Infinita**: Resolución del bug que causaba recargas infinitas cuando el token de sesión expiraba (Error 401/403).
*   **Hardening de Seguridad API**: Estandarización de mensajes de error de seguridad en Cloudflare Functions.

### 🚀 [3.0.0] - 2026-04-23 (Gestión Dinámica de Horarios)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📅 Sistema de Horarios Inteligente**:
    *   **Autocompletado Pro**: Implementación de `SearchableSelect` con búsqueda difusa e insensible a acentos.
    *   **Visualización "Horario Libre"**: Diseño específico para horas libres con alineación centrada y estilo minimalista.
    *   **🖨️ Impresión de Horarios**: Nueva vista de impresión optimizada para PDF/A4.
*   **🎨 Micro-interacciones Premium**: Pulido de transiciones y estados de carga en el panel de horarios.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Integridad de Base de Datos**: Refactorización de las consultas `UPSERT` en Cloudflare D1 para la gestión de horarios, eliminando errores de colisión.

### 🚀 [2.9.9] - 2026-04-23 (Refinamiento UI/UX y Mobile App)

#### ✨ Nuevas Implementaciones y Mejoras
*   **💾 Botón de Guardado Dinámico**: Rediseño del botón de guardado que alterna entre **"Guardado"** y **"Guardar Cambios"**.
*   **🫨 Feedback Visual (Shake)**: Implementación de una animación de sacudida que se activa cuando hay cambios pendientes.
*   **📱 Optimización Móvil Crítica**: 
    *   Reemplazo de texto por iconos de `Printer` en botones de impresión.
    *   Ajuste de anchos de columna y textos de cabecera en **Estructura Curricular**.
*   **🤖 Integración con Capacitor**: Preparación del proyecto para su compilación como App Nativa (Android/APK) con detección automática de entorno (`capacitor://`).

### 🚀 [2.9.8] - 2026-04-23 (Auditoría y Asistencia)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📅 Panel de Asistencia Mensual**: Nuevo módulo completo para el registro de asistencia diaria con grilla interactiva mensual y vista móvil optimizada.
*   **🖨️ Impresión de Partes Semanales**: Botón "Imprimir Parte" que genera reportes A4 semanales pre-cargados con datos reales.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **Fix Crítico del Sistema de Historial**: Resolución de bug por Foreign Key roto apuntando a `usuarios_old`; recreación de la tabla `historial` en producción con el FK corregido.
*   **⚡ Orden de Auditoría Corregido**: El log de notas ahora se ejecuta **después** de confirmar la escritura en la base de datos, evitando registros fantasma.

### 🚀 [2.9.5] - 2026-04-22 (Automatización Docente)

#### ✨ Nuevas Implementaciones y Mejoras
*   **👨‍🏫 Automatización de Cuentas Profesores**: Generación masiva de credenciales para 104 docentes con mapeo inteligente de materias y cursos.
*   **🎓 Identidad Institucional (Prof.)**: Implementación automática del prefijo "Prof." en todos los reportes oficiales y bienvenida.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **📊 Fix de Visualización de Notas**: Resolución del bug de columnas "aplastadas" mediante la fijación de anchos de columna uniformes (50px).
*   **🔒 Resolución de Conflictos**: Lógica de desambiguación para nombres duplicados en la creación de cuentas docentes.

### 🚀 [2.9.0] - 2026-04-22 (Autenticación JWT)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔐 Implementación de JWT**: Migración a sistema de autenticación firmado digitalmente (HMAC-SHA256) con expiración de 24 horas.
*   **🛡️ Verificación en Backend**: Validación centralizada en Cloudflare Functions contra la manipulación de IDs de usuario.

### 🚀 [2.8.6] - 2026-04-22 (Refactorización Modular)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🏗️ Arquitectura Modular**: Fragmentación de `PreceptorPanel` en sub-módulos especializados y hooks por dominio (notas, alumnos, administración).

### 🚀 [2.8.5] - 2026-04-21 (RAC Modular e Impresión)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🧩 RAC Modular Configurable**: Nueva opción para habilitar la visualización detallada (**T / P / Pnd**) en materias de taller modulares.

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🖨️ Fix de Impresión Global (Partes)**: Resolución del error de hojas en blanco en la generación masiva de partes diarios mediante `page-break` optimizado.

### 🚀 [2.8.0] - 2026-04-21 (Parte Diario Institucional)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📋 Parte Diario A4 Oficial**: Generación institucional masiva de partes diarios para TODOS los cursos con horarios dinámicos integrados.

### 🚀 [2.7.0] - 2026-04-21 (Acceso Seguro y Auditoría)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔍 Acceso Estudiante con Contraseña**: Implementación de portal protegido por DNI + Clave (gestionada por preceptoría).
*   **📜 Auditoría Detallada (Historial)**: Registro de acciones críticas: cambios de contraseña, edición de fichas, re-incorporaciones y pases.
*   **📄 Paginación en Listados**: Implementación de paginación (30 resultados/pág) en Alumnos, Historial y Pases.

### 🚀 [2.6.6] - 2026-04-20 (Control de Calidad)

#### 🛠️ Parches y Correcciones (Patch Fixes)
*   **🔍 Auditoría de Código (Linter)**: Eliminación de errores de referencia y variables huérfanas en todo el proyecto.
*   **🛠️ Fix saveObs**: Reparación de la función de guardado de observaciones en el panel RAC.
*   **🧹 Limpieza de Código Muerto**: Eliminación de funciones obsoletas (`saveRotations`).

### 🚀 [2.6.5] - 2026-04-20 (Navegación Hash)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🌐 Hash Routing**: Migración a `HashRouter` para URLs navegables y persistencia de sesión ante recargas (F5).
*   **🔒 Protected Routes**: Sistema de redirección inteligente que protege las rutas administrativas.

### 🚀 [2.6.3] - 2026-04-20 (Bloqueos en Cascada)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔍 Bloqueos en Cascada**: Lógica inteligente que inhabilita campos de trimestres anteriores tras aprobación en instancias finales.
*   **📏 Observaciones Automáticas**: Solicitud automática de observaciones al RAC al completar "Otras Instancias".

### 🚀 [2.6.0] - 2026-04-20 (Cierre de Ciclo Académico)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🎓 Terminación de Ciclo (RAC)**: Flujo centralizado para cierre de año, automatización de repitencia y control de promoción.
*   **📋 Historial Escolar**: Automatización del registro histórico (Boletín snapshot) durante la transición de ciclo.

### 🚀 [2.5.0] - 2026-04-19 (Jerarquía Institucional)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🏢 Jerarquía Institucional**: Soporte para roles `Director`, `Vicedirector` y `Secretaria de Alumnos`.
*   **📣 Centro de Anuncios**: Nuevo módulo de comunicación institucional multimedia.
*   **🕵️ Auditoría Visual**: Actualización con códigos de rol y paleta de colores distintiva para trazabilidad.

### 🚀 [2.4.0] - 2026-04-19 (Modularización)

#### ✨ Nuevas Implementaciones y Mejoras
*   **✂️ Print Decoupling**: Extracción masiva de lógica de impresión a `PrintHelpers.jsx`.
*   **📄 Ficha del Alumno**: Implementación de nuevo modal de ficha técnica centralizada.

### 🚀 [2.3.0] - 2026-04-19 (Blindaje de Datos)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🔒 System Hardening**: Implementación de campo `estado` (Activo/Inactivo) robusto para integridad histórica.
*   **Bone Skeleton Loading**: Pantallas de carga inteligentes para una experiencia fluida.

### 🚀 [2.2.0] - 2026-04-18 (Arquitectura Consolidada)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📂 Global Consolidation**: Reestructuración total en carpetas planas `src/jsx/` y `src/css/`.
*   **🧩 CSS Modular**: Fragmentación del núcleo estético en módulos independientes.

### 🚀 [2.1.0] - 2026-04-18 (Motor de Impresión)

#### ✨ Nuevas Implementaciones y Mejoras
*   **📏 A4 Print Engine**: Motor de renderizado basado en unidades métricas (`mm`) para precisión absoluta.
*   **📦 Generación Masiva Global**: Creación de "Planillas de Seguimiento" de todos los cursos en un solo documento.

### 🚀 [2.0.0] - 2026-04-18 (Modularización Core)

#### ✨ Nuevas Implementaciones y Mejoras
*   **🧩 Modularización**: Fragmentación del componente `PreceptorPanel` en sub-módulos especializados.
*   **💾 Optimización D1**: Implementación de índices SQL y lógica de protección `COALESCE`.

---

### Versiones Iniciales (1.x.x)

*   **[1.7.0]**: Implementación de **Mobile Access Toggle** y panel de configuración de ciclos lectivos.
*   **[1.6.0]**: Restricciones de borrado exclusivas para Admin y estados de curso **Activo/Inactivo**.
*   **[1.5.0]**: Ajuste de layouts para impresión **A4 Ready**, branding institucional y ordenamiento alfabético automático.
*   **[1.4.0]**: Sistema de Roles (Admin, Preceptor, Profesor, Visor) y Calendario Académico dinámico.
*   **[1.3.0]**: Migración total desde KV a **Cloudflare D1 (SQL)** para consistencia en tiempo real y optimización de latencia.
*   **[1.2.0]**: Organización de assets en directorios `/js` y `/css` con depuración de archivos huérfanos.
*   **[1.1.0]**: Arquitectura CSS modular para el diseño *Glassmorphism*.
*   **[1.0.0]**: Lanzamiento inicial: Despliegue en Cloudflare Pages, búsqueda por DNI y carga básica de notas.

---
*Desarrollado con ❤️ para la comunidad educativa de la Industrial Nº6.*
