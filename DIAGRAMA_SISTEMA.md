# 🗺️ Diagramas de Flujo del Sistema - Industrial Nº6

Este documento contiene la arquitectura lógica y el flujo de datos del sistema. 

> **Nota**: Este archivo utiliza el formato [Mermaid](https://mermaid.js.org/). Puedes visualizarlo directamente en GitHub o usando una extensión de Markdown en tu editor.

---

## 1. Diagrama de Flujo Maestro (End-to-End)

```mermaid
graph TD
    %% Inicio y Seguridad
    START((INICIO)) --> LOGIN[Login con Bcrypt]
    LOGIN --> AUTH_CHECK{¿Autenticado?}
    AUTH_CHECK -- No --> LOGIN
    AUTH_CHECK -- Sí --> WELCOME{¿Clave Admin?}
    WELCOME -- Sí --> SEC_MODAL[Modal de Cambio de Clave Obligatorio]
    SEC_MODAL --> DASH[Dashboard / Panel Principal]
    WELCOME -- No --> DASH

    %% Segmentación por Roles
    DASH --> ROLE_DIV{Acceso por Rol}

    %% Rama Administrativa (Admin/Secretaría/Jefe)
    ROLE_DIV -- Admin/Sec/Jefe --> ADM[Panel de Administración]
    ADM --> ADM_U[Gestión de Usuarios]
    ADM --> ADM_A[Ajustes Académicos: Carreras/Materias]
    ADM --> ADM_P[Módulo de Pases e Incorporaciones]
    ADM --> ADM_E[Registro Global de Egresados]
    ADM --> ADM_AUD[Historial de Auditoría / Logs]

    %% Rama Regente
    ROLE_DIV -- Regente --> REG[Panel de Regencia]
    REG --> REG_H[Gestión Maestra de Horarios]
    REG --> REG_M[Configuración Curricular]

    %% Rama Preceptoría
    ROLE_DIV -- Preceptor/Híbrido --> PRE[Panel de Preceptoría]
    PRE --> PRE_AS[Registro de Asistencia: Teoría/Taller/EF]
    PRE --> PRE_ST[Gestión de Legajo / Ficha del Alumno]
    PRE --> PRE_GR[Carga de Calificaciones Trimestrales]
    PRE --> PRE_RAC[Módulo RAC: Seguimiento y Cierre]

    %% Rama Profesor
    ROLE_DIV -- Profesor --> PROF[Panel de Profesor]
    PROF --> PROF_GR[Carga de Notas de Materias Asignadas]
    PROF --> PROF_REP[Generación de Planillas PDF]

    %% Flujo Académico Central y Cierre
    PRE_GR & PROF_GR --> ACAD_STATE[Estado Académico del Alumno]
    ACAD_STATE --> PRE_RAC
    PRE_RAC --> END_CYCLE{¿Terminación de Ciclo?}
    
    END_CYCLE -- Sí --> CYCLE_PROC[Proceso de Cierre de Año]
    CYCLE_PROC --> HIST[Snapshot: Guardado en Historial Escolar]
    CYCLE_PROC --> PREVIAS[Detección y Carga de Materias Pendientes]
    
    %% Ramificación Final
    CYCLE_PROC --> GRAD_CHECK{¿Es 6to Año?}
    GRAD_CHECK -- No --> PROM[Cálculo de Promoción / Repitencia]
    PROM --> NEW_COURSE[Transferencia a Nuevo Curso]
    
    GRAD_CHECK -- Sí --> GRAD_DEST[Módulo de Egresados]
    GRAD_DEST --> GRAD_TYPE[Clasificación: Recibido / Egresado]
    GRAD_TYPE --> GRAD_LIST[Inclusión en Padrón Histórico de Graduados]

    %% Infraestructura
    NEW_COURSE & GRAD_LIST --> DB[(Cloudflare D1 SQL)]
    ADM_AUD --> DB
    HIST --> DB
```

---

## 2. Ciclo de Vida del Alumno (Cierre de Ciclo)

```mermaid
graph TD
    A[Inicio Ciclo Lectivo] --> B[Carga de Notas/Asistencia]
    B --> C[Módulo RAC]
    C --> D{¿Terminación de Ciclo?}
    D -- No --> B
    D -- Sí --> E{¿6to Año?}
    
    E -- No --> F[Cálculo de Promoción]
    F --> G[Registro en Historial Escolar]
    G --> H[Transferencia a Nuevo Curso]

    E -- Sí --> I[Módulo Egresados]
    I --> J{¿Debe materias?}
    J -- Sí --> K[Estado: Egresado]
    J -- No --> L[Estado: Recibido]
    K & L --> M[Registro Global de Egresados]
```

---

## 3. Matriz de Responsabilidades

| Rol | Punto de Entrada | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Admin / Sec. Alumnos** | Ajustes / Egresados | Gestión global, usuarios y registro de egresados. |
| **Regente de Profesores** | Horarios / Materias | Configuración de la estructura académica y cronogramas. |
| **Preceptor (Teoría/Taller/EF)**| Asistencia / RAC | Gestión diaria de alumnos y cierre de actas (RAC). |
| **Profesor** | Notas | Evaluación de materias asignadas y reportes de notas. |
| **Profesor Híbrido** | Panel Preceptor | Funciones de docente con privilegios de preceptoría. |

---

## 4. Respaldo Automático (G:\)
Cada vez que se ejecuta `npm run backup`, el sistema realiza:
1. Compresión del código (excluyendo `node_modules`).
2. Sincronización inmediata con `G:\Mi unidad\Escuela\Respaldo_Colegio.zip`.
