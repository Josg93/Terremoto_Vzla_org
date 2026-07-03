// Datos simulados para funcionamiento offline (sin backend FastAPI)
// Almacena los datos en localStorage para simular persistencia de datos.

const MOCK_ESTADOS = [
  { id: "e1", nombre: "La Guaira" },
  { id: "e2", nombre: "Distrito Capital" },
  { id: "e3", nombre: "Miranda" }
];

const MOCK_CIUDADES = [
  { id: "c1", estado_id: "e1", nombre: "Maiquetía" },
  { id: "c2", estado_id: "e1", nombre: "La Guaira" },
  { id: "c3", estado_id: "e1", nombre: "Macuto" },
  { id: "c4", estado_id: "e1", nombre: "Caraballeda" },
  { id: "c5", estado_id: "e1", nombre: "Naiguatá" },
  { id: "c6", estado_id: "e2", nombre: "Caracas" },
  { id: "c7", estado_id: "e3", nombre: "Los Teques" }
];

const MOCK_HOSPITALES = [
  { id: "h1", ciudad_id: "c1", nombre: "Hospital Dr. Rafael Medina Jiménez (Pariata)" },
  { id: "h2", ciudad_id: "c2", nombre: "Hospital José María Vargas de La Guaira" },
  { id: "h3", ciudad_id: "c3", nombre: "Materno Infantil de Macuto (Ana Teresa de Jesús)" },
  { id: "h4", ciudad_id: "c6", nombre: "Hospital de Niños J.M. de los Ríos" },
  { id: "h5", ciudad_id: "c6", nombre: "Hospital Universitario de Caracas (HUC)" }
];

const INITIAL_VICTIMAS = [
  {
    cedula: "12345678",
    nombre: "Carlos",
    apellidos: "Rodríguez",
    status: "critico",
    hospital_id: "h1",
    fecha_de_registro: new Date(Date.now() - 3600000 * 2).toISOString(), // Hace 2 horas
    necesidades: [
      { id: "n1", categoria: "medicamento", descripcion: "Albúmina humana al 20%, 5 frascos", satisfecha: false },
      { id: "n2", categoria: "insumo", descripcion: "Catéter venoso central de 7 Fr triple luz", satisfecha: false }
    ],
    contactos: [
      { id: "ct1", rol: "familiar", nombre_contacto: "María Rodríguez (Madre)", numero_telefono: "+584121112233" }
    ]
  },
  {
    cedula: "23456789",
    nombre: "Carmen",
    apellidos: "Gómez",
    status: "estable",
    hospital_id: "h2",
    fecha_de_registro: new Date(Date.now() - 3600000 * 24).toISOString(), // Hace 1 día
    necesidades: [
      { id: "n3", categoria: "sangre", descripcion: "3 donantes de sangre O Negativo", satisfecha: false }
    ],
    contactos: [
      { id: "ct2", rol: "familiar", nombre_contacto: "Juan Gómez (Hermano)", numero_telefono: "+584249998877" }
    ]
  },
  {
    cedula: "15987456",
    nombre: "Jesús",
    apellidos: "Pérez",
    status: "critico",
    hospital_id: "h4",
    fecha_de_registro: new Date(Date.now() - 3600000 * 48).toISOString(), // Hace 2 días
    necesidades: [
      { id: "n4", categoria: "medicamento", descripcion: "Meropenem 1g (ampollas), 14 unidades", satisfecha: false },
      { id: "n5", categoria: "insumo", descripcion: "Jeringas de 10cc y 20cc, 30 unidades cada una", satisfecha: true }
    ],
    contactos: [
      { id: "ct3", rol: "unidad_hospitalaria", nombre_contacto: "Enfermera Jefa Piso 3 (JM)", numero_telefono: "+584143332211" }
    ]
  }
];

// Inicializar localStorage si no existen las llaves
function initLocalStorage() {
  if (!localStorage.getItem("medinsumos_estados")) {
    localStorage.setItem("medinsumos_estados", JSON.stringify(MOCK_ESTADOS));
  }
  if (!localStorage.getItem("medinsumos_ciudades")) {
    localStorage.setItem("medinsumos_ciudades", JSON.stringify(MOCK_CIUDADES));
  }
  if (!localStorage.getItem("medinsumos_hospitales")) {
    localStorage.setItem("medinsumos_hospitales", JSON.stringify(MOCK_HOSPITALES));
  }
  if (!localStorage.getItem("medinsumos_victimas")) {
    localStorage.setItem("medinsumos_victimas", JSON.stringify(INITIAL_VICTIMAS));
  }
}

// Invocación inicial de almacenamiento local
initLocalStorage();

// Métodos para simular la API localmente en memoria persistente
export const MockAPI = {
  getEstados: () => {
    return JSON.parse(localStorage.getItem("medinsumos_estados"));
  },
  
  getCiudades: (estadoId = null) => {
    const ciudades = JSON.parse(localStorage.getItem("medinsumos_ciudades"));
    if (estadoId) {
      return ciudades.filter(c => c.estado_id === estadoId);
    }
    return ciudades;
  },
  
  getHospitales: (estadoId = null, ciudadId = null) => {
    const hospitales = JSON.parse(localStorage.getItem("medinsumos_hospitales"));
    const ciudades = JSON.parse(localStorage.getItem("medinsumos_ciudades"));
    const estados = JSON.parse(localStorage.getItem("medinsumos_estados"));
    
    let results = hospitales.map(h => {
      const ciudad = ciudades.find(c => c.id === h.ciudad_id) || {};
      const estado = estados.find(e => e.id === ciudad.estado_id) || {};
      return {
        id: h.id,
        nombre: h.nombre,
        ciudad_id: h.ciudad_id,
        ciudad_nombre: ciudad.nombre || "Desconocida",
        estado_nombre: estado.nombre || "Desconocido"
      };
    });
    
    if (ciudadId) {
      results = results.filter(r => r.ciudad_id === ciudadId);
    }
    if (estadoId) {
      const ciudadesDelEstado = ciudades.filter(c => c.estado_id === estadoId).map(c => c.id);
      results = results.filter(r => ciudadesDelEstado.includes(r.ciudad_id));
    }
    
    return results;
  },
  
  createHospital: (nombre, ciudadId) => {
    const hospitales = JSON.parse(localStorage.getItem("medinsumos_hospitales"));
    const newH = {
      id: "h-" + Math.random().toString(36).substr(2, 9),
      ciudad_id: ciudadId,
      nombre: nombre
    };
    hospitales.push(newH);
    localStorage.setItem("medinsumos_hospitales", JSON.stringify(hospitales));
    return newH;
  },
  
  getVictimas: ({ search = null, status = null, estadoId = null, hospitalId = null, categoriaNecesidad = null } = {}) => {
    const victimas = JSON.parse(localStorage.getItem("medinsumos_victimas"));
    const hospitales = JSON.parse(localStorage.getItem("medinsumos_hospitales"));
    const ciudades = JSON.parse(localStorage.getItem("medinsumos_ciudades"));
    const estados = JSON.parse(localStorage.getItem("medinsumos_estados"));
    
    let results = victimas.map(v => {
      const hosp = hospitales.find(h => h.id === v.hospital_id) || {};
      const ciudad = ciudades.find(c => c.id === hosp.ciudad_id) || {};
      const estado = estados.find(e => e.id === ciudad.estado_id) || {};
      
      return {
        ...v,
        hospital_nombre: hosp.nombre || "Desconocido",
        ciudad_nombre: ciudad.nombre || "Desconocida",
        estado_nombre: estado.nombre || "Desconocido"
      };
    });
    
    // Aplicar filtros
    if (estadoId) {
      const ciudadesDelEstado = ciudades.filter(c => c.estado_id === estadoId).map(c => c.id);
      const hospitalesDelEstado = hospitales.filter(h => ciudadesDelEstado.includes(h.ciudad_id)).map(h => h.id);
      results = results.filter(r => hospitalesDelEstado.includes(r.hospital_id));
    }
    if (hospitalId) {
      results = results.filter(r => r.hospital_id === hospitalId);
    }
    if (status) {
      results = results.filter(r => r.status === status);
    }
    if (categoriaNecesidad) {
      results = results.filter(r => r.necesidades.some(n => n.categoria === categoriaNecesidad));
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(r => 
        r.nombre.toLowerCase().includes(q) || 
        r.apellidos.toLowerCase().includes(q) || 
        r.cedula.includes(q)
      );
    }
    
    // Ordenar de más reciente a más antiguo
    results.sort((a, b) => new Date(b.fecha_de_registro) - new Date(a.fecha_de_registro));
    return results;
  },
  
  createVictima: (victimaData) => {
    const victimas = JSON.parse(localStorage.getItem("medinsumos_victimas"));
    
    // Validar cédula duplicada
    if (victimas.some(v => v.cedula === victimaData.cedula)) {
      throw new Error(`La víctima con cédula ${victimaData.cedula} ya se encuentra registrada.`);
    }
    
    const newVictima = {
      cedula: victimaData.cedula,
      nombre: victimaData.nombre,
      apellidos: victimaData.apellidos,
      status: victimaData.status || "estable",
      hospital_id: victimaData.hospital_id,
      fecha_de_registro: new Date().toISOString(),
      necesidades: (victimaData.necesidades || []).map(n => ({
        id: "n-" + Math.random().toString(36).substr(2, 9),
        categoria: n.categoria,
        descripcion: n.descripcion,
        satisfecha: !!n.satisfecha
      })),
      contactos: (victimaData.contactos || []).map(c => ({
        id: "ct-" + Math.random().toString(36).substr(2, 9),
        rol: c.rol,
        numero_telefono: c.numero_telefono,
        nombre_contacto: c.nombre_contacto
      }))
    };
    
    victimas.push(newVictima);
    localStorage.setItem("medinsumos_victimas", JSON.stringify(victimas));
    return { status: "success", message: "Víctima registrada exitosamente", cedula: newVictima.cedula };
  },
  
  updateVictima: (cedula, updateData) => {
    const victimas = JSON.parse(localStorage.getItem("medinsumos_victimas"));
    const idx = victimas.findIndex(v => v.cedula === cedula);
    
    if (idx === -1) {
      throw new Error("Víctima no encontrada");
    }
    
    victimas[idx] = {
      ...victimas[idx],
      ...updateData
    };
    
    localStorage.setItem("medinsumos_victimas", JSON.stringify(victimas));
    return { status: "success", message: "Información de la víctima actualizada" };
  },
  
  updateNecesidad: (necId, satisfied) => {
    const victimas = JSON.parse(localStorage.getItem("medinsumos_victimas"));
    let found = false;
    
    for (let v of victimas) {
      const nec = v.necesidades.find(n => n.id === necId);
      if (nec) {
        nec.satisfecha = satisfied;
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error("Necesidad no encontrada");
    }
    
    localStorage.setItem("medinsumos_victimas", JSON.stringify(victimas));
    return { status: "success", message: "Necesidad actualizada" };
  },
  
  deleteNecesidad: (necId) => {
    const victimas = JSON.parse(localStorage.getItem("medinsumos_victimas"));
    let found = false;
    
    for (let v of victimas) {
      const idx = v.necesidades.findIndex(n => n.id === necId);
      if (idx !== -1) {
        const nec = v.necesidades[idx];
        if (!nec.satisfecha) {
          throw new Error("No se puede borrar una necesidad que no esté satisfecha.");
        }
        v.necesidades.splice(idx, 1);
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error("Necesidad no encontrada");
    }
    
    localStorage.setItem("medinsumos_victimas", JSON.stringify(victimas));
    return { status: "success", message: "Necesidad satisfecha eliminada" };
  },
  
  deleteVictima: (cedula) => {
    const victimas = JSON.parse(localStorage.getItem("medinsumos_victimas"));
    const idx = victimas.findIndex(v => v.cedula === cedula);
    
    if (idx === -1) {
      throw new Error("Víctima no encontrada");
    }
    
    const v = victimas[idx];
    if (v.status !== "alta") {
      throw new Error("Solo se pueden dar de baja (eliminar) a las víctimas que estén en estado de 'alta'.");
    }
    
    victimas.splice(idx, 1);
    localStorage.setItem("medinsumos_victimas", JSON.stringify(victimas));
    return { status: "success", message: "Víctima en estado de alta archivada" };
  }
};
