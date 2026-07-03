import { MockAPI } from './mock-data.js';

// Configuración de la dirección de la API
// Si el sitio corre en local bajo file:// o en un puerto distinto al del backend de desarrollo (8000), 
// podemos configurar un baseUrl. De lo contrario, usará rutas relativas.
const IS_FILE_PROTOCOL = window.location.protocol === 'file:';
const API_PORT = '8000';
const DEFAULT_API_BASE = `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;

// Determinar el base URL del backend
let API_BASE_URL = '';
if (!IS_FILE_PROTOCOL) {
  // Si estamos en un puerto distinto a 8000 (ej. Live Server, Vite, etc.), conectamos al 8000.
  // Si ya estamos en el 8000, usamos rutas relativas para evitar problemas de dominio.
  if (window.location.port !== API_PORT && window.location.port !== '') {
    API_BASE_URL = DEFAULT_API_BASE;
  }
}

// Bandera para saber si el backend está activo o si debemos usar el mock
let useMock = IS_FILE_PROTOCOL;

// Función para testear la conexión al backend al cargar
export async function testBackendConnection() {
  if (IS_FILE_PROTOCOL) {
    useMock = true;
    console.warn("Corriendo desde protocolo file://. Se usará la API simulada (localStorage).");
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/estados`, { method: 'GET', signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      useMock = false;
      console.log("Conectado con éxito al backend de FastAPI.");
      return true;
    }
  } catch (error) {
    useMock = true;
    console.warn("No se pudo conectar al backend de FastAPI. Activando el modo demo (localStorage).", error);
  }
  return false;
}

// Wrapper para Fetch API
async function apiCall(endpoint, options = {}) {
  // Si está activo el mock o falló el backend, usamos la base de datos local
  if (useMock) {
    return handleMockCall(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: "Error desconocido en el servidor" }));
      throw new Error(errData.detail || `Error del servidor (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    // Si hay un error de conexión, intentar fallbacks
    if (error instanceof TypeError) {
      console.error("Error de conexión con el servidor. Intentando MockAPI.");
      useMock = true;
      // Disparar evento para alertar al UI
      window.dispatchEvent(new CustomEvent('api-mode-change', { detail: { mode: 'mock' } }));
      return handleMockCall(endpoint, options);
    }
    throw error;
  }
}

// Enrutador interno para mapear endpoints HTTP a funciones de MockAPI
function handleMockCall(endpoint, options) {
  console.log(`[Mock API Call] ${options.method || 'GET'} ${endpoint}`);
  
  // GET /api/v1/estados
  if (endpoint.startsWith('/api/v1/estados')) {
    return MockAPI.getEstados();
  }
  
  // GET /api/v1/ciudades
  if (endpoint.startsWith('/api/v1/ciudades')) {
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    return MockAPI.getCiudades(urlParams.get('estado_id'));
  }
  
  // GET /api/v1/hospitales
  if (endpoint.startsWith('/api/v1/hospitales')) {
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    return MockAPI.getHospitales(urlParams.get('estado_id'), urlParams.get('ciudad_id'));
  }
  
  // POST /api/v1/hospitales
  if (endpoint.startsWith('/api/v1/hospitales') && options.method === 'POST') {
    const body = JSON.parse(options.body);
    return MockAPI.createHospital(body.nombre, body.ciudad_id);
  }
  
  // GET /api/v1/victimas
  if (endpoint.startsWith('/api/v1/victimas')) {
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    return MockAPI.getVictimas({
      search: urlParams.get('search'),
      status: urlParams.get('status'),
      estadoId: urlParams.get('estado_id'),
      hospitalId: urlParams.get('hospital_id'),
      categoriaNecesidad: urlParams.get('categoria_necesidad')
    });
  }
  
  // POST /api/v1/victimas
  if (endpoint === '/api/v1/victimas' && options.method === 'POST') {
    const body = JSON.parse(options.body);
    return MockAPI.createVictima(body);
  }
  
  // PUT /api/v1/victimas/{cedula}
  if (endpoint.startsWith('/api/v1/victimas/') && options.method === 'PUT') {
    const parts = endpoint.split('/');
    const cedula = parts[parts.length - 1];
    const body = JSON.parse(options.body);
    return MockAPI.updateVictima(cedula, body);
  }
  
  // PUT /api/v1/necesidades/{id}
  if (endpoint.startsWith('/api/v1/necesidades/') && options.method === 'PUT') {
    const parts = endpoint.split('/');
    const necId = parts[parts.length - 1];
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    // Extraer satisfied de la query url
    const satisfied = urlParams.get('satisfied') === 'true';
    return MockAPI.updateNecesidad(necId, satisfied);
  }
  
  // DELETE /api/v1/necesidades/{id}
  if (endpoint.startsWith('/api/v1/necesidades/') && options.method === 'DELETE') {
    const parts = endpoint.split('/');
    const necId = parts[parts.length - 1];
    return MockAPI.deleteNecesidad(necId);
  }
  
  // DELETE /api/v1/victimas/{cedula}
  if (endpoint.startsWith('/api/v1/victimas/') && options.method === 'DELETE') {
    const parts = endpoint.split('/');
    const cedula = parts[parts.length - 1];
    return MockAPI.deleteVictima(cedula);
  }
  
  throw new Error(`Endpoint mock no implementado: ${endpoint}`);
}

// --- Cliente de API Exportado ---
export const API = {
  isMockMode: () => useMock,
  
  getEstados: () => apiCall('/api/v1/estados'),
  
  getCiudades: (estadoId = null) => {
    const query = estadoId ? `?estado_id=${estadoId}` : '';
    return apiCall(`/api/v1/ciudades${query}`);
  },
  
  getHospitales: (estadoId = null, ciudadId = null) => {
    const params = new URLSearchParams();
    if (estadoId) params.append('estado_id', estadoId);
    if (ciudadId) params.append('ciudad_id', ciudadId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/api/v1/hospitales${query}`);
  },
  
  createHospital: (nombre, ciudadId) => {
    return apiCall('/api/v1/hospitales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, ciudad_id: ciudadId })
    });
  },
  
  getVictimas: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.estado_id) params.append('estado_id', filters.estado_id);
    if (filters.hospital_id) params.append('hospital_id', filters.hospital_id);
    if (filters.categoria_necesidad) params.append('categoria_necesidad', filters.categoria_necesidad);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/api/v1/victimas${query}`);
  },
  
  createVictima: (victimaData) => {
    return apiCall('/api/v1/victimas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(victimaData)
    });
  },
  
  updateVictimaStatus: (cedula, status) => {
    return apiCall(`/api/v1/victimas/${cedula}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },
  
  updateNecesidadSatisfecha: (necId, satisfied) => {
    return apiCall(`/api/v1/necesidades/${necId}?satisfied=${satisfied}`, {
      method: 'PUT'
    });
  },
  
  deleteNecesidad: (necId) => {
    return apiCall(`/api/v1/necesidades/${necId}`, {
      method: 'DELETE'
    });
  },
  
  deleteVictima: (cedula) => {
    return apiCall(`/api/v1/victimas/${cedula}`, {
      method: 'DELETE'
    });
  }
};
