import React from 'react';

export const yearOptions = ['1°', '2°', '3°', '4°', '5°'];
export const divisionOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const shiftOptions = ['Mañana', 'Tarde'];
export const workshopI = ['Electricidad I', 'Carpintería', 'Hojalatería y herrería', 'Ajuste Mecánico I'];
export const workshopII = ['Electricidad II', 'Soldadura', 'Automotores', 'Materiales aeronáuticos'];
export const allWorkshopNames = [...workshopI, ...workshopII];

export const emptyStudent = {
  nombre: '', apellido: '', dni: '', genero: 'Masculino',
  cuil: '', fecha_nacimiento: '', edad: '',
  tutor_nombre: '', tutor_parentesco: '', tutor_dni: '', tutor_contacto: '', tutor_mail: '',
  domicilio: '', libro: '', folio: '', legajo: '', matricula: '', observaciones: ''
};
export const emptyCourse = { ano: '1°', division: 'I', turno: 'Mañana', tecnicatura_id: '', year_id: '' };
export const emptyYear = { nombre: '' };
export const emptyUser = { nombre: '', username: '', password: '', rol: 'preceptor', preceptor_course_ids: [], professor_course_ids: [], professor_subject_ids: [] };
export const emptyTec = { nombre: '', detalle: '', materias: [{ id: 'draft-1', nombre: '', tipo: 'comun' }] };

export const truncate = (value, max = 20) => (!value ? '' : value.length > max ? `${value.slice(0, max).trim()}...` : value);

export const normalizeCurricularName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const findDuplicateSubjectNames = (materias = []) => {
  const seen = new Map();
  const duplicates = new Set();

  materias.forEach((materia) => {
    const name = normalizeCurricularName(materia?.nombre);
    if (!name) return;
    if (seen.has(name)) duplicates.add(name);
    else seen.set(name, materia?.nombre?.trim() || '');
  });

  return Array.from(duplicates).map((key) => seen.get(key) || key);
};

export const abbreviateSubject = (name, threshold = 30) => {
  if (!name || name.length <= threshold) return name;

  let newName = name;
  const replacements = [
    [/Mantenimiento/gi, 'Mant.'],
    [/Operación/gi, 'Oper.'],
    [/Instalación/gi, 'Inst.'],
    [/Instalaciones/gi, 'Inst.'],
    [/Sistemas/gi, 'Sist.'],
    [/Equipos/gi, 'Eq.'],
    [/Electrónica/gi, 'Elec.'],
    [/Electrónico/gi, 'Elec.'],
    [/Electrónicos/gi, 'Elec.'],
    [/Eléctricos/gi, 'Eléc.'],
    [/Eléctrica/gi, 'Eléc.'],
    [/Tecnología/gi, 'Tec.'],
    [/Aeronáutica/gi, 'Aero.'],
    [/Aeronáutico/gi, 'Aero.'],
    [/Aeronáuticos/gi, 'Aero.'],
    [/Construcción/gi, 'Const.'],
    [/Prototipos/gi, 'Prot.'],
    [/Representación/gi, 'Repr.'],
    [/Gráfica/gi, 'Gráf.'],
    [/Introducción/gi, 'Introd.'],
    [/Educación/gi, 'Ed.'],
    [/Aplicada/gi, 'Apl.'],
    [/Inglés Técnico/gi, 'Ing. Téc.'],
    [/Técnico/gi, 'Téc.']
  ];

  replacements.forEach(([regex, replacement]) => {
    newName = newName.replace(regex, replacement);
  });

  return newName;
};

export const truncateSubject = (name, isMobile) => {
  if (!name) return '';
  const max = isMobile ? 12 : 30;
  return name.length > max ? name.slice(0, max) + '...' : name;
};

export const draftTec = (tec, subjects) => ({
  nombre: tec?.nombre ?? '',
  detalle: tec?.detalle ?? '',
  materias: subjects.length ? subjects.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    tipo: s.es_taller ? (s.tipo === 'modular' ? 'taller_modular' : 'taller') : s.tipo
  })) : [{ id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }]
});

export const selectedValues = (options) => Array.from(options).map((o) => Number(o.value));

export const simplifyTecName = (name) => {
  if (!name) return '';
  const clean = name
    .replace(/Tecnicatura en\s+/i, '')
    .replace(/Tecnicatura\s+/i, '')
    .split('(')[0]
    .trim();

  const parts = clean.split(' - ');
  if (parts.length > 1) return parts[1].trim().toUpperCase();

  return clean.toUpperCase();
};

export const formatGender = (g) => {
  if (!g) return '';
  const gl = g.toLowerCase();
  if (gl === 'm' || gl.startsWith('masc')) return 'Masculino';
  if (gl === 'f' || gl.startsWith('feme')) return 'Femenino';
  return g;
};

export const formatDNI = (val) => {
  if (!val) return '';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const numberToWords = (n) => {
  const words = {
    1: 'UNO', 2: 'DOS', 3: 'TRES', 4: 'CUATRO', 5: 'CINCO',
    6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE', 10: 'DIEZ'
  };
  return words[Number(n)] || '';
};

export const PERIOD_GROUPS = {
  '1T': { label: '1° Trimestre', pids: [1, 2], letterPid: 2 },
  '2T': { label: '2° Trimestre', pids: [3, 4], letterPid: 4 },
  '3T': { label: '3° Trimestre', pids: [5, 6], letterPid: 6 },
  'Final': { label: 'Calificación Final', pids: [7, 8, 9, 10] }
};

export const getCoursePreceptor = (data, courseId) => {
  return (data.users || [])
    .filter(u =>
      (u.rol === 'preceptor' || u.rol === 'preceptor_taller' || u.rol === 'preceptor_ef') &&
      String(u.preceptor_course_id || '').split(',').includes(String(courseId))
    )
    .map(u => u.nombre)
    .join(', ') || 'Sin asignar';
};
