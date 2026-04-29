# 🗺️ Diagramas de Flujo del Sistema - Industrial Nº6

Este documento contiene la arquitectura lógica y el flujo de datos del sistema. 

> **Nota**: Este archivo utiliza el formato [Mermaid](https://mermaid.js.org/). Puedes visualizarlo directamente en GitHub o usando una extensión de Markdown en tu editor.

---

## 1. Diagrama de Flujo Maestro (End-to-End)

```mermaid
graph TD
    %% Estilos de Nodos
    classDef security fill:#f43f5e,stroke:#fff,stroke-width:2px,color:#fff
    classDef admin fill:#8b5cf6,stroke:#fff,stroke-width:2px,color:#fff
    classDef preceptor fill:#0ea5e9,stroke:#fff,stroke-width:2px,color:#fff
    classDef professor fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff
    classDef closing fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff
    classDef infrastructure fill:#475569,stroke:#fff,stroke-width:2px,color:#fff

    %% Inicio y Seguridad
    START((INICIO)) --> LOGIN[Login con Bcrypt]
    LOGIN --> ROLE_DIV{Acceso por Rol}

    %% BLOQUE DIRECTIVO Y ADMINISTRATIVO
    subgraph "Nivel Directivo y Administrativo"
        ROLE_DIV -- Admin/Sec/Dir --> ADM_PANEL[Panel de Administración]:::admin
        ADM_PANEL --> ADM_U[Gestión de Usuarios]
        ADM_PANEL --> ADM_A[Ajustes y Config. Curricular]
        ADM_PANEL --> ADM_P[Módulo de Pases e Incorporaciones]
        ADM_PANEL --> ADM_E[Registro Global de Egresados]
        ADM_PANEL --> ADM_AN[Gestión de Anuncios]
        
        ROLE_DIV -- Dir/Vicedir --> DIR[Supervisión Directiva]:::admin
        DIR --> AUDIT[Historial de Auditoría / Logs]
    end

    %% BLOQUE REGENCIA
    subgraph "Nivel Regencia"
        ROLE_DIV -- Regente --> REG[Panel de Regencia]:::admin
        REG --> REG_H[Gestión Maestra de Horarios]
        REG --> REG_M[Gestión de Materias/Carreras]
    end

    %% BLOQUE JEFATURA (Preceptor Global)
    subgraph "Jefatura de Auxiliares"
        ROLE_DIV -- Jefe Aux --> JEFE[Supervisión Global de Preceptores]:::preceptor
        JEFE --> JEFE_ST[Supervisión de Asistencia/Notas de Todos los Cursos]
        JEFE --> JEFE_P[Gestión de Pases y RAC]
    end

    %% BLOQUE OPERATIVO (Preceptores y Profesores)
    subgraph "Gestión Diaria (Operativo)"
        ROLE_DIV -- Preceptor/Híbrido --> PRE[Panel de Preceptoría]:::preceptor
        ROLE_DIV -- Profesor --> PROF[Panel de Profesor]:::professor
        
        PRE --> PRE_AS[Registro de Asistencia: Teoría/Taller/EF]
        PRE --> PRE_ST[Ficha y Legajo del Alumno]
        PRE --> PRE_RAC[Módulo RAC: Seguimiento Académico]
        
        PROF --> PROF_GR[Carga de Notas]
    end

    %% INTERDEPENDENCIAS CRÍTICAS (Impacto)
    ADM_U -.-> |Crea/Resetea| PRE & PROF
    ADM_P -.-> |Extrae Alumno| PRE_AS & PRE_ST
    REG_H -.-> |Dicta agenda| PROF
    ADM_A -.-> |Modifica| REG_M
    ADM_PANEL -.-> |Injerencia en| REG_H & REG_M & PRE_ST

    %% FLUJO DE DATOS ACADÉMICOS
    PRE_GR[Carga de Calificaciones Preceptor/Prof]
    PROF_GR --> DB_GRADES[(Base de Datos de Notas)]:::infrastructure
    PRE_GR --> DB_GRADES
    
    DB_GRADES --> PROF_REP[Generación de Planillas PDF]
    DB_GRADES --> PRE_RAC

    %% FLUJO DE CIERRE
    PRE_RAC --> END_CYCLE{¿Cierre de Ciclo?}
    END_CYCLE -- Sí --> CYCLE_PROC[Proceso de Cierre de Año]:::closing
    CYCLE_PROC --> HIST[Snapshot: Historial Escolar]
    CYCLE_PROC --> PREVIAS[Carga de Materias Pendientes]
    
    CYCLE_PROC --> GRAD_CHECK{¿Es 6to Año?}
    GRAD_CHECK -- No --> PROM[Cálculo de Promoción]
    PROM --> NEW_COURSE[Transferencia a Nuevo Curso]
    
    GRAD_CHECK -- Sí --> GRAD_DEST[Módulo de Egresados]
    GRAD_DEST --> GRAD_LIST[Padrón Histórico de Graduados]
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
