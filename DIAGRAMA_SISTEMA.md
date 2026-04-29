# 🗺️ Diagramas de Flujo del Sistema - Industrial Nº6

Este documento contiene la arquitectura lógica y el flujo de datos del sistema. 

> **Nota**: Este archivo utiliza el formato [Mermaid](https://mermaid.js.org/). Puedes visualizarlo directamente en GitHub o usando una extensión de Markdown en tu editor.

---

## 1. Flujo de Roles y Accesos

```mermaid
graph TD
    subgraph "Ingreso y Roles"
        A[Login Usuario] --> B{¿Cuál es el Rol?}
        
        B -- Admin/Sec/Jefe --> C[Gestión Total / Alumnos]
        B -- Preceptor --> D[Gestión de Curso / Asistencia]
        
        B -- Regente --> E[Gestión Académica]
        E --> E1[Config. de Horarios]
        E --> E2[Config. Materias/Carreras]
        E -.-> E3[Vista RAC/Historial - Solo Lectura]

        B -- Profesor --> F[Carga de Notas]
        F --> F1[Materias Asignadas]
        F --> F2[Planillas de Calificaciones]
        F -.-> F3[X Sin acceso a Asistencia/Alumnos]
    end

    subgraph "Flujo Académico Central"
        C & D & F1 --> G[Planilla de Calificaciones]
        G --> H[Módulo RAC]
        H --> I[Terminación de Ciclo]
        I --> J[Egresados o Promoción]
    end
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
