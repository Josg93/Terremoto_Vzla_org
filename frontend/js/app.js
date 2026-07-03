import { API, testBackendConnection } from './api.js';

const appState = {
  victimas: [],
  hospitales: [],
  ciudades: [],
  estados: [],
  selectedVictima: null,
  activeFilters: {
    search: '',
    status: '',
    estado_id: '',
    hospital_id: '',
    categoria_necesidad: ''
  }
};

const DOM = {
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeToggleBtnOverlay: document.getElementById('theme-toggle-btn-overlay'),
  demoBanner: document.getElementById('demo-banner'),

  metricTotalCases: document.getElementById('metric-total-cases'),
  metricCriticalCases: document.getElementById('metric-critical-cases'),
  metricSatisfiedNeeds: document.getElementById('metric-satisfied-needs'),
  metricHospitals: document.getElementById('metric-hospitals'),

  searchInput: document.getElementById('search-input'),
  filterEstado: document.getElementById('filter-estado'),
  filterHospital: document.getElementById('filter-hospital'),
  filterStatus: document.getElementById('filter-status'),
  filterCategoria: document.getElementById('filter-categoria'),
  filterChips: document.getElementById('filter-chips'),

  victimsList: document.getElementById('victims-list'),
  listCount: document.getElementById('list-count'),

  overlay: document.getElementById('victim-overlay'),
  overlayBody: document.getElementById('overlay-body'),
  overlayBackBtn: document.getElementById('btn-overlay-back'),

  btnOpenAddVictim: document.getElementById('btn-open-add-victim'),
  btnOpenAddHospital: document.getElementById('btn-open-add-hospital'),

  modalAddVictim: document.getElementById('modal-add-victim'),
  formAddVictim: document.getElementById('form-add-victim'),
  btnCloseAddVictim: document.getElementById('btn-close-add-victim'),
  victimHospitalSelect: document.getElementById('victim-hospital-select'),
  victimEstadoSelect: document.getElementById('victim-estado-select'),
  victimCiudadSelect: document.getElementById('victim-ciudad-select'),

  btnAddNeedRow: document.getElementById('btn-add-need-row'),
  formNeedsList: document.getElementById('form-needs-list'),
  btnAddContactRow: document.getElementById('btn-add-contact-row'),
  formContactsList: document.getElementById('form-contacts-list'),

  modalAddHospital: document.getElementById('modal-add-hospital'),
  formAddHospital: document.getElementById('form-add-hospital'),
  btnCloseAddHospital: document.getElementById('btn-close-add-hospital'),
  hospEstadoSelect: document.getElementById('hosp-estado-select'),
  hospCiudadSelect: document.getElementById('hosp-ciudad-select'),
};

document.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  setupEventListeners();

  await testBackendConnection();
  updateModeBanner(API.isMockMode());

  window.addEventListener('api-mode-change', () => {
    updateModeBanner(true);
    showToast('Conexión perdida. Corriendo en modo demo local.', 'warning');
    loadAllData();
  });

  await loadStaticMaesters();
  await loadAllData();

  addNeedFormRow();
  addContactFormRow();
});

function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    DOM.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    if (DOM.themeToggleBtnOverlay) {
      DOM.themeToggleBtnOverlay.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const icon = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  DOM.themeToggleBtn.innerHTML = icon;
  if (DOM.themeToggleBtnOverlay) {
    DOM.themeToggleBtnOverlay.innerHTML = icon;
  }
}

function updateModeBanner(isMock) {
  DOM.demoBanner.style.display = isMock ? 'flex' : 'none';
}

async function loadStaticMaesters() {
  try {
    appState.estados = await API.getEstados();
    appState.ciudades = await API.getCiudades();
    appState.hospitales = await API.getHospitales();
    populateDropdowns();
  } catch (error) {
    showToast('Error al cargar datos maestros.', 'error');
  }
}

async function loadAllData() {
  showSkeleton(4);
  try {
    appState.victimas = await API.getVictimas(appState.activeFilters);
    appState.hospitales = await API.getHospitales();

    renderMetrics();
    renderFilterChips();
    renderVictimsList();
  } catch (error) {
    showToast('Error al consultar el registro de víctimas.', 'error');
  }
}

function reloadListOnly() {
  showSkeleton(4);
  API.getVictimas(appState.activeFilters).then(victimas => {
    appState.victimas = victimas;
    renderMetrics();
    renderFilterChips();
    renderVictimsList();
  }).catch(() => {});
}

function populateDropdowns() {
  DOM.filterEstado.innerHTML = '<option value="">Todos los Estados</option>';
  appState.estados.forEach(e => {
    DOM.filterEstado.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
  });

  DOM.victimEstadoSelect.innerHTML = '<option value="" disabled selected>Selecciona Estado</option>';
  appState.estados.forEach(e => {
    DOM.victimEstadoSelect.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
  });

  DOM.hospEstadoSelect.innerHTML = '<option value="" disabled selected>Selecciona Estado</option>';
  appState.estados.forEach(e => {
    DOM.hospEstadoSelect.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
  });

  updateHospitalFilterOptions();
}

async function updateHospitalFilterOptions() {
  const estadoId = DOM.filterEstado.value;
  const filteredHospitals = await API.getHospitales(estadoId);

  DOM.filterHospital.innerHTML = '<option value="">Todos los Hospitales</option>';
  filteredHospitals.forEach(h => {
    DOM.filterHospital.innerHTML += `<option value="${h.id}">${h.nombre} (${h.ciudad_nombre})</option>`;
  });
}

function renderFilterChips() {
  const chipsContainer = DOM.filterChips;
  chipsContainer.innerHTML = '';

  const f = appState.activeFilters;
  const chips = [];

  if (f.estado_id) {
    const estado = appState.estados.find(e => e.id === f.estado_id);
    if (estado) chips.push({ key: 'estado_id', label: estado.nombre });
  }
  if (f.hospital_id) {
    const hosp = appState.hospitales.find(h => h.id === f.hospital_id);
    chips.push({ key: 'hospital_id', label: hosp ? hosp.nombre : `Hospital #${f.hospital_id}` });
  }
  if (f.status) {
    const labels = { critico: 'Crítico', estable: 'Estable', alta: 'Alta', fallecido: 'Fallecido', desaparecido: 'Desaparecido' };
    chips.push({ key: 'status', label: labels[f.status] || f.status });
  }
  if (f.categoria_necesidad) {
    const labels = { medicamento: 'Medicamentos', insumo: 'Insumos', sangre: 'Sangre' };
    chips.push({ key: 'categoria_necesidad', label: labels[f.categoria_necesidad] || f.categoria_necesidad });
  }

  chips.forEach(chip => {
    const el = document.createElement('span');
    el.className = 'filter-chip';
    el.innerHTML = `${chip.label} <i class="fas fa-times" data-key="${chip.key}"></i>`;
    el.querySelector('i').addEventListener('click', (e) => {
      e.stopPropagation();
      appState.activeFilters[chip.key] = '';
      if (chip.key === 'estado_id') { DOM.filterEstado.value = ''; updateHospitalFilterOptions(); }
      else if (chip.key === 'hospital_id') DOM.filterHospital.value = '';
      else if (chip.key === 'status') DOM.filterStatus.value = '';
      else if (chip.key === 'categoria_necesidad') DOM.filterCategoria.value = '';
      loadAllData();
    });
    chipsContainer.appendChild(el);
  });
}

function renderMetrics() {
  const total = appState.victimas.length;
  const critical = appState.victimas.filter(v => v.status === 'critico').length;

  let totalNeeds = 0;
  let satisfiedNeeds = 0;
  appState.victimas.forEach(v => {
    v.necesidades.forEach(n => {
      totalNeeds++;
      if (n.satisfecha) satisfiedNeeds++;
    });
  });

  DOM.metricTotalCases.innerText = total;
  DOM.metricCriticalCases.innerText = critical;
  DOM.metricSatisfiedNeeds.innerText = totalNeeds > 0 ? `${satisfiedNeeds}/${totalNeeds}` : '0/0';
  DOM.metricHospitals.innerText = appState.hospitales.length;
}

function showSkeleton(count = 4) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card" style="animation-delay: ${i * 0.05}s">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line meta"></div>
        <div class="skeleton-line location"></div>
        <div class="skeleton-line tags"></div>
      </div>
    `;
  }
  DOM.victimsList.innerHTML = html;
  DOM.listCount.innerText = '...';
}

function renderVictimsList() {
  const count = appState.victimas.length;
  DOM.listCount.innerText = count;

  if (count === 0) {
    DOM.victimsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <h3>No se encontraron registros</h3>
        <p>Intenta ajustar los criterios de búsqueda o registra una nueva víctima necesitada.</p>
      </div>
    `;
    return;
  }

  DOM.victimsList.innerHTML = '';
  const fragment = document.createDocumentFragment();

  appState.victimas.forEach((v, index) => {
    const pendingNeeds = v.necesidades.filter(n => !n.satisfecha);
    const unsatisfiedCount = pendingNeeds.length;
    const statusLabel = {
      critico: 'Crítico', estable: 'Estable', alta: 'Alta',
      fallecido: 'Fallecido', desaparecido: 'Desaparecido'
    }[v.status] || v.status;

    let needsHtml = '';
    v.necesidades.slice(0, 3).forEach(n => {
      needsHtml += `
        <span class="need-tag ${n.satisfecha ? 'satisfied' : ''}">
          <span class="need-dot ${n.categoria}"></span>
          ${n.categoria}
        </span>
      `;
    });
    if (v.necesidades.length > 3) {
      needsHtml += `<span class="need-tag">+${v.necesidades.length - 3} más</span>`;
    }
    if (v.necesidades.length === 0) {
      needsHtml = '<span class="need-tag" style="color:var(--text-muted);font-style:italic;">Sin necesidades</span>';
    }

    const card = document.createElement('div');
    card.className = `victim-card ${v.status}`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.dataset.index = index;
    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3 class="victim-name">${v.nombre} ${v.apellidos}</h3>
          <span class="victim-meta">C.I. ${v.cedula}</span>
        </div>
        <span class="status-badge ${v.status}">${statusLabel}</span>
      </div>
      <div class="card-location">
        <i class="fas fa-hospital-alt"></i>
        <span>${v.hospital_nombre}, ${v.ciudad_nombre}</span>
      </div>
      <div class="card-needs">
        ${needsHtml}
      </div>
      <div class="card-time">
        <i class="fas fa-clock"></i> Registrado ${formatDate(v.fecha_de_registro)}
        ${unsatisfiedCount > 0 ? `<span style="margin-left:auto;color:var(--color-critical);font-weight:700;font-size:11px;">${unsatisfiedCount} pendiente${unsatisfiedCount > 1 ? 's' : ''}</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      appState.selectedVictima = v;
      renderOverlay(v);
      openOverlay();
    });

    fragment.appendChild(card);
  });

  DOM.victimsList.appendChild(fragment);

  requestAnimationFrame(() => {
    const cards = DOM.victimsList.querySelectorAll('.victim-card');
    cards.forEach((card, i) => {
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 50);
    });
  });
}

function openOverlay() {
  document.body.classList.add('overlay-open');
  DOM.overlay.classList.add('show');
}

function closeOverlay() {
  DOM.overlay.classList.remove('show');
  document.body.classList.remove('overlay-open');
  appState.selectedVictima = null;
}

function renderOverlay(v) {
  const body = DOM.overlayBody;

  const statusOptions = [
    { value: 'estable', label: 'Estable' },
    { value: 'critico', label: 'Crítico' },
    { value: 'alta', label: 'Alta (Apto para egresar)' },
    { value: 'fallecido', label: 'Fallecido' },
    { value: 'desaparecido', label: 'Desaparecido' }
  ];

  const statusLabel = {
    critico: 'Crítico', estable: 'Estable', alta: 'Alta',
    fallecido: 'Fallecido', desaparecido: 'Desaparecido'
  }[v.status] || v.status;

  const statusDropdownHtml = statusOptions.map(opt =>
    `<option value="${opt.value}" ${v.status === opt.value ? 'selected' : ''}>${opt.label}</option>`
  ).join('');

  body.innerHTML = `
    <div class="overlay-profile">
      <div class="overlay-profile-top">
        <div>
          <span class="status-badge ${v.status}">${statusLabel}</span>
          <h2 class="overlay-name">${v.nombre} ${v.apellidos}</h2>
          <p class="overlay-meta"><i class="fas fa-id-card" style="width:18px;color:var(--color-brand);"></i> C.I. ${v.cedula}</p>
        </div>
        <div class="overlay-status-select">
          <label>Estado Médico</label>
          <select id="detail-status-select" class="filter-select">${statusDropdownHtml}</select>
        </div>
      </div>
      <div class="overlay-location">
        <i class="fas fa-hospital-alt"></i> ${v.hospital_nombre}<br>
        <i class="fas fa-map-marker-alt"></i> ${v.ciudad_nombre}, ${v.estado_nombre}
      </div>
      <div class="overlay-date">
        <i class="fas fa-clock"></i> Registrado: ${formatDate(v.fecha_de_registro)}
      </div>
    </div>

    <div class="overlay-tabs" id="overlay-tabs">
      <button class="tab-btn active" data-tab="needs">
        <i class="fas fa-notes-medical"></i> Necesidades ${v.necesidades.length > 0 ? `<span class="list-count" style="font-size:10px;padding:2px 6px;">${v.necesidades.length}</span>` : ''}
      </button>
      <button class="tab-btn" data-tab="contacts">
        <i class="fas fa-address-book"></i> Contactos ${v.contactos.length > 0 ? `<span class="list-count" style="font-size:10px;padding:2px 6px;">${v.contactos.length}</span>` : ''}
      </button>
      <div class="tab-indicator"></div>
    </div>

    <div id="tab-needs" class="tab-content active"></div>
    <div id="tab-contacts" class="tab-content"></div>

    <div class="overlay-actions">
      <button id="btn-delete-victim" class="btn btn-danger" style="width:100%;justify-content:center;" ${v.status !== 'alta' ? 'disabled' : ''}>
        <i class="fas fa-archive"></i> Dar de Baja (Archivar)
      </button>
      ${v.status !== 'alta' ? '<p style="text-align:center;margin-top:6px;font-size:11px;color:var(--text-muted);">* Solo se pueden archivar víctimas con estado de Alta médica.</p>' : ''}
    </div>
  `;

  renderTabNeeds(v.necesidades);
  renderTabContacts(v.contactos);
  setupOverlayEvents(v);
  setupTabIndicator();
}

function renderTabNeeds(necesidades) {
  const container = document.getElementById('tab-needs');
  if (!container) return;

  if (necesidades.length === 0) {
    container.innerHTML = `
      <div class="overlay-empty-tab">
        <i class="fas fa-check-circle"></i>
        <p>No hay necesidades registradas.</p>
      </div>
    `;
    return;
  }

  const itemsHtml = necesidades.map(n => `
    <div class="overlay-need-item ${n.satisfecha ? 'satisfied' : ''}">
      <div class="need-left">
        <input type="checkbox" class="need-checkbox" data-id="${n.id}" ${n.satisfecha ? 'checked' : ''}>
        <span class="need-category-tag ${n.categoria}">${n.categoria}</span>
        <span class="need-text">${n.descripcion}</span>
      </div>
      <div class="need-actions">
        ${n.satisfecha ? `<button class="btn-delete-need" data-id="${n.id}" title="Eliminar del historial"><i class="fas fa-trash"></i></button>` : ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = itemsHtml;

  container.querySelectorAll('.need-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const necId = cb.dataset.id;
      const satisfied = cb.checked;
      try {
        await API.updateNecesidadSatisfecha(necId, satisfied);
        showToast(satisfied ? 'Necesidad marcada como satisfecha.' : 'Necesidad marcada como pendiente.', 'success');
        await refreshCurrentVictim();
      } catch (error) {
        showToast(error.message, 'error');
        cb.checked = !satisfied;
      }
    });
  });

  container.querySelectorAll('.btn-delete-need').forEach(btn => {
    btn.addEventListener('click', async () => {
      const necId = btn.dataset.id;
      if (confirm('¿Eliminar esta necesidad satisfecha del registro histórico?')) {
        try {
          await API.deleteNecesidad(necId);
          showToast('Necesidad eliminada del registro.', 'success');
          await refreshCurrentVictim();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
  });
}

function renderTabContacts(contactos) {
  const container = document.getElementById('tab-contacts');
  if (!container) return;

  if (contactos.length === 0) {
    container.innerHTML = `
      <div class="overlay-empty-tab">
        <i class="fas fa-address-book"></i>
        <p>No hay contactos de emergencia registrados.</p>
      </div>
    `;
    return;
  }

  const itemsHtml = contactos.map(c => {
    const wsUrl = `https://wa.me/${c.numero_telefono.replace(/[^0-9+]/g, '')}`;
    const isFamiliar = c.rol === 'familiar';
    return `
      <div class="overlay-contact-card">
        <div class="contact-info">
          <span class="contact-role">${isFamiliar ? 'Familiar' : 'Unidad Hospitalaria'}</span>
          <span class="contact-name">${c.nombre_contacto || 'Sin nombre'}</span>
          <span class="contact-phone"><i class="fas fa-phone-alt"></i> ${c.numero_telefono}</span>
        </div>
        <div class="contact-actions">
          <a href="tel:${c.numero_telefono}" class="contact-action-btn" title="Llamar">
            <i class="fas fa-phone"></i>
          </a>
          <a href="${wsUrl}" target="_blank" class="contact-action-btn whatsapp" title="WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = itemsHtml;
}

function setupOverlayEvents(v) {
  const statusSelect = document.getElementById('detail-status-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      try {
        await API.updateVictimaStatus(v.cedula, e.target.value);
        showToast('Estado médico actualizado.', 'success');
        await refreshCurrentVictim();
      } catch (error) {
        showToast(error.message, 'error');
        statusSelect.value = v.status;
      }
    });
  }

  const btnDelete = document.getElementById('btn-delete-victim');
  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if (confirm(`¿Dar de baja a ${v.nombre} ${v.apellidos}? Esta acción archivará su información.`)) {
        try {
          await API.deleteVictima(v.cedula);
          showToast('Víctima archivada exitosamente.', 'success');
          closeOverlay();
          await loadAllData();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
  }
}

function setupTabIndicator() {
  const tabsContainer = document.getElementById('overlay-tabs');
  if (!tabsContainer) return;

  const indicator = tabsContainer.querySelector('.tab-indicator');
  const buttons = tabsContainer.querySelectorAll('.tab-btn');

  function updateIndicator(btn) {
    indicator.style.width = `${btn.offsetWidth}px`;
    indicator.style.left = `${btn.offsetLeft}px`;
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateIndicator(btn);

      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      const tabId = `tab-${btn.dataset.tab}`;
      const tabContent = document.getElementById(tabId);
      if (tabContent) tabContent.classList.add('active');
    });
  });

  const activeBtn = tabsContainer.querySelector('.tab-btn.active');
  if (activeBtn) {
    requestAnimationFrame(() => updateIndicator(activeBtn));
  }

  window.addEventListener('resize', () => {
    const active = tabsContainer.querySelector('.tab-btn.active');
    if (active) updateIndicator(active);
  });
}

async function refreshCurrentVictim() {
  if (!appState.selectedVictima) return;
  if (!DOM.overlay.classList.contains('show')) return;
  try {
    const updated = await API.getVictimas({ search: appState.selectedVictima.cedula });
    const found = updated.find(v => v.cedula === appState.selectedVictima.cedula);
    if (found) {
      appState.selectedVictima = found;
      renderOverlay(found);
      setupTabIndicator();
    }
    reloadListOnly();
  } catch (error) {
    showToast('Error al actualizar datos.', 'error');
  }
}

function setupEventListeners() {
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  if (DOM.themeToggleBtnOverlay) {
    DOM.themeToggleBtnOverlay.addEventListener('click', toggleTheme);
  }

  DOM.searchInput.addEventListener('input', debounce(() => {
    appState.activeFilters.search = DOM.searchInput.value;
    loadAllData();
  }, 300));

  DOM.filterEstado.addEventListener('change', () => {
    appState.activeFilters.estado_id = DOM.filterEstado.value;
    appState.activeFilters.hospital_id = '';
    DOM.filterHospital.value = '';
    updateHospitalFilterOptions();
    loadAllData();
  });

  DOM.filterHospital.addEventListener('change', () => {
    appState.activeFilters.hospital_id = DOM.filterHospital.value;
    loadAllData();
  });

  DOM.filterStatus.addEventListener('change', () => {
    appState.activeFilters.status = DOM.filterStatus.value;
    loadAllData();
  });

  DOM.filterCategoria.addEventListener('change', () => {
    appState.activeFilters.categoria_necesidad = DOM.filterCategoria.value;
    loadAllData();
  });

  DOM.overlayBackBtn.addEventListener('click', closeOverlay);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.overlay.classList.contains('show')) {
        closeOverlay();
      } else if (DOM.modalAddVictim.classList.contains('show')) {
        closeSlideUp(DOM.modalAddVictim);
      } else if (DOM.modalAddHospital.classList.contains('show')) {
        closeSlideUp(DOM.modalAddHospital);
      }
    }
  });

  DOM.overlay.addEventListener('click', (e) => {
    if (e.target === DOM.overlay || e.target.classList.contains('overlay-scrim')) {
      closeOverlay();
    }
  });

  DOM.btnOpenAddVictim.addEventListener('click', () => {
    openSlideUp(DOM.modalAddVictim);
  });

  DOM.btnCloseAddVictim.addEventListener('click', () => {
    closeSlideUp(DOM.modalAddVictim);
    DOM.formAddVictim.reset();
    resetDynamicRows();
  });

  DOM.btnOpenAddHospital.addEventListener('click', () => {
    openSlideUp(DOM.modalAddHospital);
  });

  DOM.btnCloseAddHospital.addEventListener('click', () => {
    closeSlideUp(DOM.modalAddHospital);
    DOM.formAddHospital.reset();
  });

  DOM.modalAddVictim.querySelector('.slide-up-scrim').addEventListener('click', () => {
    closeSlideUp(DOM.modalAddVictim);
    DOM.formAddVictim.reset();
    resetDynamicRows();
  });

  DOM.modalAddHospital.querySelector('.slide-up-scrim').addEventListener('click', () => {
    closeSlideUp(DOM.modalAddHospital);
    DOM.formAddHospital.reset();
  });

  DOM.victimEstadoSelect.addEventListener('change', async () => {
    const estadoId = DOM.victimEstadoSelect.value;
    const ciudades = await API.getCiudades(estadoId);
    DOM.victimCiudadSelect.innerHTML = '<option value="" disabled selected>Selecciona Ciudad</option>';
    ciudades.forEach(c => {
      DOM.victimCiudadSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
    DOM.victimCiudadSelect.disabled = false;
    DOM.victimHospitalSelect.innerHTML = '<option value="" disabled selected>Primero selecciona ciudad</option>';
    DOM.victimHospitalSelect.disabled = true;
  });

  DOM.victimCiudadSelect.addEventListener('change', async () => {
    const ciudadId = DOM.victimCiudadSelect.value;
    const hospitales = await API.getHospitales(null, ciudadId);
    DOM.victimHospitalSelect.innerHTML = '<option value="" disabled selected>Selecciona Hospital</option>';
    hospitales.forEach(h => {
      DOM.victimHospitalSelect.innerHTML += `<option value="${h.id}">${h.nombre}</option>`;
    });
    DOM.victimHospitalSelect.disabled = false;
  });

  DOM.hospEstadoSelect.addEventListener('change', async () => {
    const estadoId = DOM.hospEstadoSelect.value;
    const ciudades = await API.getCiudades(estadoId);
    DOM.hospCiudadSelect.innerHTML = '<option value="" disabled selected>Selecciona Ciudad</option>';
    ciudades.forEach(c => {
      DOM.hospCiudadSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
    DOM.hospCiudadSelect.disabled = false;
  });

  DOM.btnAddNeedRow.addEventListener('click', addNeedFormRow);
  DOM.btnAddContactRow.addEventListener('click', addContactFormRow);

  DOM.formAddHospital.addEventListener('submit', onSubmitHospital);
  DOM.formAddVictim.addEventListener('submit', onSubmitVictima);
}

function openSlideUp(panel) {
  panel.classList.add('show');
  document.body.classList.add('overlay-open');
}

function closeSlideUp(panel) {
  panel.classList.remove('show');
  document.body.classList.remove('overlay-open');
}

function addNeedFormRow() {
  const row = document.createElement('div');
  row.className = 'dynamic-item';
  row.innerHTML = `
    <select class="filter-select need-category-input" style="width:140px;" required>
      <option value="medicamento">Medicamento</option>
      <option value="insumo" selected>Insumo</option>
      <option value="sangre">Sangre</option>
    </select>
    <input type="text" class="form-control need-desc-input" placeholder="Ej. Solución Fisiológica 0.9%, 10 frascos" style="flex:1;" required>
    <button type="button" class="btn-remove-item btn-remove-row" title="Eliminar fila">
      <i class="fas fa-times"></i>
    </button>
  `;
  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (DOM.formNeedsList.children.length > 1) {
      row.remove();
    } else {
      showToast('Debes ingresar al menos una necesidad inicial.', 'warning');
    }
  });
  DOM.formNeedsList.appendChild(row);
}

function addContactFormRow() {
  const row = document.createElement('div');
  row.className = 'dynamic-item';
  row.innerHTML = `
    <select class="filter-select contact-role-input" style="width:140px;" required>
      <option value="familiar" selected>Familiar</option>
      <option value="unidad_hospitalaria">Hospital</option>
    </select>
    <input type="text" class="form-control contact-name-input" placeholder="Nombre completo" style="flex:1;" required>
    <input type="text" class="form-control contact-phone-input" placeholder="Teléfono (ej. +584121234567)" style="width:180px;" required>
    <button type="button" class="btn-remove-item btn-remove-row" title="Eliminar fila">
      <i class="fas fa-times"></i>
    </button>
  `;
  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (DOM.formContactsList.children.length > 1) {
      row.remove();
    } else {
      showToast('Debes ingresar al menos un contacto de emergencia.', 'warning');
    }
  });
  DOM.formContactsList.appendChild(row);
}

function resetDynamicRows() {
  DOM.formNeedsList.innerHTML = '';
  DOM.formContactsList.innerHTML = '';
  addNeedFormRow();
  addContactFormRow();
  DOM.victimCiudadSelect.innerHTML = '<option value="" disabled selected>Primero selecciona estado</option>';
  DOM.victimCiudadSelect.disabled = true;
  DOM.victimHospitalSelect.innerHTML = '<option value="" disabled selected>Primero selecciona ciudad</option>';
  DOM.victimHospitalSelect.disabled = true;
}

async function onSubmitHospital(e) {
  e.preventDefault();
  const nombre = document.getElementById('hosp-name-input').value.trim();
  const ciudadId = DOM.hospCiudadSelect.value;

  if (!nombre || !ciudadId) {
    showToast('Por favor completa todos los campos.', 'warning');
    return;
  }

  try {
    await API.createHospital(nombre, ciudadId);
    showToast('Hospital agregado correctamente.', 'success');
    closeSlideUp(DOM.modalAddHospital);
    DOM.formAddHospital.reset();
    await loadStaticMaesters();
    await loadAllData();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function onSubmitVictima(e) {
  e.preventDefault();

  const cedula = document.getElementById('victim-cedula-input').value.trim();
  const nombre = document.getElementById('victim-name-input').value.trim();
  const apellidos = document.getElementById('victim-apellidos-input').value.trim();
  const status = document.getElementById('victim-status-select').value;
  const hospitalId = DOM.victimHospitalSelect.value;

  if (!cedula || !nombre || !apellidos || !hospitalId) {
    showToast('Completa los campos básicos de la víctima.', 'warning');
    return;
  }

  if (cedula.length > 8 || !/^[0-9]+$/.test(cedula)) {
    showToast('La Cédula de Identidad debe tener un máximo de 8 caracteres numéricos.', 'warning');
    return;
  }

  const necesidades = [];
  DOM.formNeedsList.querySelectorAll('.dynamic-item').forEach(row => {
    const cat = row.querySelector('.need-category-input').value;
    const desc = row.querySelector('.need-desc-input').value.trim();
    if (desc) necesidades.push({ categoria: cat, descripcion: desc, satisfecha: false });
  });

  const contactos = [];
  DOM.formContactsList.querySelectorAll('.dynamic-item').forEach(row => {
    const rol = row.querySelector('.contact-role-input').value;
    const name = row.querySelector('.contact-name-input').value.trim();
    const phone = row.querySelector('.contact-phone-input').value.trim();
    if (name && phone) contactos.push({ rol, nombre_contacto: name, numero_telefono: phone });
  });

  const payload = { cedula, nombre, apellidos, status, hospital_id: hospitalId, necesidades, contactos };

  try {
    await API.createVictima(payload);
    showToast('Víctima registrada exitosamente.', 'success');
    closeSlideUp(DOM.modalAddVictim);
    DOM.formAddVictim.reset();
    resetDynamicRows();
    await loadAllData();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function formatDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'justo ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr < 24) return `hace ${diffHr} hora${diffHr !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  return d.toLocaleDateString('es-VE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;

  const icon = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>'
  }[type];

  toast.innerHTML = `${icon} <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 2000;
  `;
  document.body.appendChild(container);
  return container;
}
