# 🎓 Sistema de Gestión Escolar - Industrial Nº6

> **Suite administrativa profesional para la gestión de calificaciones, alumnos y reportes institucionales.**

---

## 📜 Registro de Cambios (Changelog)

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

### 🚀 [3.2.0] - 2026-04-25 (Integridad y Sincronización)
**"Horarios como Fuente Única de Verdad"**

*   **👨‍🏫 Sincronización Automática de Permisos**:
    *   **Fuente Única de Verdad**: Se eliminó la asignación manual de materias en la gestión de usuarios. Ahora, los permisos de edición de los profesores se derivan exclusivamente del **Panel de Horarios**.
    *   **Visualización Informativa**: Se implementó una lista de solo lectura en el perfil de usuario que muestra las materias y cursos asignados vía horarios, garantizando transparencia.
*   **🛡️ Exclusividad de Roles Jerárquicos**:
    *   **Blindaje Directivo**: Los roles de `Administrador`, `Secretaria de Alumnos`, `Jefe de Auxiliares`, `Director` y `Vicedirector` son ahora estrictamente administrativos. El sistema limpia y bloquea automáticamente cualquier asignación de materias o preceptoría para estos usuarios.
