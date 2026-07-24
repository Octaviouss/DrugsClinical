// ======================================================
// DRUGSCLINICAL ENGINE - ADVANCE POINT CARE
// ======================================================

// Catálogo Base de Datos Clínica
const CLINICAL_DATABASE = [
  { id: '1', name: 'Warfarina 5mg', category: 'fármaco', detail: 'Anticoagulante oral' },
  { id: '2', name: 'Aspirina 100mg', category: 'fármaco', detail: 'Antiagregante plaquetario' },
  { id: '3', name: 'Hierba de San Juan', category: 'herbolaria', detail: 'Suplemento / Inductor CYP3A4' },
  { id: '4', name: 'Furosemida', category: 'fármaco', detail: 'Diurético de asa (Infusión IV)' },
  { id: '5', name: 'Midazolam', category: 'fármaco', detail: 'Sedante (Infusión IV)' },
  { id: '6', name: 'eGFR < 30 mL/min', category: 'condicion', detail: 'Insuficiencia renal severa' },
  { id: '7', name: 'Omeprazol', category: 'fármaco', detail: 'Inhibidor de la bomba de protones' },
  { id: '8', name: 'Levotiroxina', category: 'fármaco', detail: 'Hormona tiroidea' },
  { id: '9', name: 'Nitroglicerina IV', category: 'fármaco', detail: 'Vasodilatador lipofílico' }
];

// Matriz de Reglas de Interacción
const INTERACTION_RULES = [
  {
    pair: ['Warfarina 5mg', 'Hierba de San Juan'],
    severity: 'danger',
    title: 'Warfarina + Hierba de San Juan',
    category: 'Interacción Herbolaria-Fármaco',
    badge: 'Contraindicación Mayor',
    mechanism: 'La Hierba de San Juan induce CYP3A4 y P-gp, reduciendo las concentraciones plasmáticas de warfarina.',
    consequence: 'Pérdida drástica del efecto anticoagulante y alto riesgo de eventos trombóticos.',
    action: 'Discontinuar Hierba de San Juan. Monitorizar INR estrechamente.'
  },
  {
    pair: ['Warfarina 5mg', 'Aspirina 100mg'],
    severity: 'danger',
    title: 'Warfarina + Aspirina 100mg',
    category: 'Interacción Fármaco-Fármaco',
    badge: 'Riesgo Alto de Sangrado',
    mechanism: 'Sinergismo sobre la cascada de coagulación y la función plaquetaria.',
    consequence: 'Elevado riesgo de hemorragia gastrointestinal o sistémica.',
    action: 'Evaluar necesidad estricta de anticoagulación doble. Considerar IBP de soporte.'
  },
  {
    pair: ['Omeprazol', 'Levotiroxina'],
    severity: 'warning',
    title: 'Omeprazol + Levotiroxina',
    category: 'Interacción Fármaco-Fármaco',
    badge: 'Reducción de Absorción',
    mechanism: 'El aumento del pH gástrico producido por el IBP disminuye la disolución de la levotiroxina.',
    consequence: 'Subcontrol del hipotiroidismo (posible elevación de TSH).',
    action: 'Separar las tomas al menos 4 horas o reajustar dosis de levotiroxina.'
  }
];

// Reglas de Incompatibilidad Y-Site (Línea IV Hospitalaria)
const Y_SITE_RULES = [
  {
    pair: ['Furosemida', 'Midazolam'],
    status: 'Incompatible',
    severity: 'danger',
    detail: 'Precipitación física inmediata en la línea IV de infusión por incompatibilidad de pH.'
  }
];

// Estado global
let currentAmbito = 'ambulatorio'; // 'ambulatorio' | 'hospitalario'
let activeItems = []; // Inicio limpio sin elementos precargados

document.addEventListener('DOMContentLoaded', () => {
  setupSearchAutocomplete();
  renderActivePills();
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Selector de Ámbito
function setAmbito(ambito) {
  currentAmbito = ambito;
  const btnAmb = document.getElementById('btnAmbulatorio');
  const btnHosp = document.getElementById('btnHospitalario');
  const hospModule = document.getElementById('hospitalModule');
  const uciBadge = document.getElementById('uciBadge');

  if (ambito === 'ambulatorio') {
    btnAmb.className = "px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-white text-sky-700 shadow-sm border border-slate-200";
    btnHosp.className = "px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-slate-600 hover:text-slate-900";
    
    // Deshabilitar panel hospitalario
    hospModule.classList.add('opacity-40', 'pointer-events-none');
    uciBadge.textContent = "Solo Hospitalario";
  } else {
    btnHosp.className = "px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-white text-sky-700 shadow-sm border border-slate-200";
    btnAmb.className = "px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-slate-600 hover:text-slate-900";
    
    // Activar e iluminar panel hospitalario
    hospModule.classList.remove('opacity-40', 'pointer-events-none');
    uciBadge.textContent = "Módulo Activo";
  }
}

// Configuración de autocompletado en búsqueda
function setupSearchAutocomplete() {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const addBtn = document.getElementById('addBtn');

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      results.classList.add('hidden');
      return;
    }

    const matches = CLINICAL_DATABASE.filter(i => 
      i.name.toLowerCase().includes(query) || i.detail.toLowerCase().includes(query)
    );

    renderSearchResults(matches);
  });

  addBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (val && !activeItems.includes(val)) {
      activeItems.push(val);
      input.value = '';
      results.classList.add('hidden');
      renderActivePills();
    }
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.add('hidden');
    }
  });
}

function renderSearchResults(matches) {
  const container = document.getElementById('searchResults');
  container.innerHTML = '';

  if (matches.length === 0) {
    container.innerHTML = `<div class="p-3 text-xs text-slate-500">No se encontraron coincidencias en el catálogo.</div>`;
  } else {
    matches.forEach(item => {
      const div = document.createElement('div');
      div.className = 'p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center justify-between text-xs';
      div.innerHTML = `
        <div>
          <span class="font-bold text-slate-800 block">${item.name}</span>
          <span class="text-[10px] text-slate-500">${item.detail}</span>
        </div>
        <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">${item.category}</span>
      `;
      div.onclick = () => {
        if (!activeItems.includes(item.name)) {
          activeItems.push(item.name);
          renderActivePills();
        }
        document.getElementById('searchInput').value = '';
        container.classList.add('hidden');
      };
      container.appendChild(div);
    });
  }
  container.classList.remove('hidden');
}

// Renderizar elementos activos (Pills)
function renderActivePills() {
  const container = document.getElementById('activePillsContainer');
  container.innerHTML = '';

  if (activeItems.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 italic">Lista vacía. Ingrese fármacos o condiciones arriba.</span>`;
    return;
  }

  activeItems.forEach((item, index) => {
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium';
    pill.innerHTML = `
      <span>${item}</span>
      <button onclick="removePill(${index})" class="hover:text-red-600 text-sky-500 transition">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;
    container.appendChild(pill);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

function removePill(index) {
  activeItems.splice(index, 1);
  renderActivePills();
}

// EJECUCIÓN AL PRESIONAR "EVALUAR INTERACCIÓN"
function evaluateInteractions() {
  const matchedRules = [];

  // 1. Evaluar interacciones farmacológicas y herbolarias
  INTERACTION_RULES.forEach(rule => {
    if (rule.pair.every(p => activeItems.includes(p))) {
      matchedRules.push(rule);
    }
  });

  // 2. Si está en modo Hospitalario, evaluar equipo IV e incompatividades Y-Site
  if (currentAmbito === 'hospitalario') {
    const deviceSelect = document.getElementById('deviceSelect').value;
    
    // Evaluación de adsorción en PVC
    if (deviceSelect === 'pvc_adsorcion' && activeItems.includes('Nitroglicerina IV')) {
      matchedRules.push({
        severity: 'warning',
        title: 'Nitroglicerina IV + Set PVC Standard',
        category: 'Interacción Dispositivo-Fármaco',
        badge: 'Adsorción en Paredes',
        mechanism: 'La nitroglicerina es adsorbida por el material plastificado de PVC del equipo.',
        consequence: 'Pérdida de hasta un 40-80% de la dosis administrada al paciente.',
        action: 'Cambiar a Set de Infusión Libre de PVC (Polietileno/Poliolefina).'
      });
    }

    // Evaluación Y-Site
    evaluateYSiteCompatibility();
  }

  renderAlertsUI(matchedRules);
  updateCountersUI(matchedRules);
}

// Evaluar Compatibilidad Y-Site
function evaluateYSiteCompatibility() {
  const ySiteBox = document.getElementById('ySiteStatus');
  let incompatibilityFound = false;

  Y_SITE_RULES.forEach(rule => {
    if (rule.pair.every(p => activeItems.includes(p))) {
      incompatibilityFound = true;
      ySiteBox.className = "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 font-medium space-y-1";
      ySiteBox.innerHTML = `
        <div class="font-bold flex items-center justify-between text-red-700">
          <span>${rule.pair.join(' + ')}</span>
          <span class="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded uppercase font-mono">Incompatible</span>
        </div>
        <p class="text-[11px] text-red-800 font-normal">${rule.detail}</p>
      `;
    }
  });

  if (!incompatibilityFound) {
    ySiteBox.className = "p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium";
    ySiteBox.innerHTML = `Sin incompatibilidades físicas directas detectadas en la línea IV.`;
  }
}

// Renderizar tarjetas de Alertas
function renderAlertsUI(rules) {
  const container = document.getElementById('alertsContainer');
  const statusBadge = document.getElementById('statusBadge');
  container.innerHTML = '';

  if (rules.length === 0) {
    statusBadge.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold";
    statusBadge.textContent = "Evaluado: Seguro";

    container.innerHTML = `
      <div class="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <i data-lucide="check-circle-2" class="w-6 h-6"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">Evaluación Finalizada: Sin Interacciones Severas</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          Los elementos ingresados no presentan incompatibilidades ni alertas dentro del motor clínico actual.
        </p>
      </div>
    `;
  } else {
    statusBadge.className = "text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-bold";
    statusBadge.textContent = "Atención Requerida";

    rules.forEach(rule => {
      const isDanger = rule.severity === 'danger';
      const card = document.createElement('article');
      card.className = `bg-white border ${isDanger ? 'border-red-200 bg-red-50/20' : 'border-amber-200 bg-amber-50/20'} rounded-2xl p-5 shadow-sm space-y-4`;
      
      card.innerHTML = `
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="p-2 rounded-xl ${isDanger ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">
              <i data-lucide="${isDanger ? 'alert-triangle' : 'shield-alert'}" class="w-5 h-5"></i>
            </span>
            <div>
              <span class="text-[10px] font-mono uppercase text-slate-500 tracking-wider">${rule.category}</span>
              <h2 class="text-base font-bold text-slate-900">${rule.title}</h2>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono ${isDanger ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'} uppercase">
            ${rule.badge}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-semibold block mb-1 font-mono uppercase text-[10px]">Mecanismo</span>
            <p class="text-slate-700 leading-relaxed">${rule.mechanism}</p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-semibold block mb-1 font-mono uppercase text-[10px]">Consecuencia Clínica</span>
            <p class="text-slate-700 leading-relaxed">${rule.consequence}</p>
          </div>
        </div>

        <div class="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5 text-xs">
          <i data-lucide="info" class="w-4 h-4 text-sky-600 shrink-0 mt-0.5"></i>
          <div>
            <strong class="text-sky-900 block font-bold">Acción Sugerida:</strong>
            <p class="text-slate-700 mt-0.5">${rule.action}</p>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Actualizar contadores del Diagnóstico de Seguridad
function updateCountersUI(rules) {
  const highRisk = rules.filter(r => r.severity === 'danger').length;
  const modRisk = rules.filter(r => r.severity === 'warning').length;
  
  document.getElementById('highRiskCount').textContent = highRisk;
  document.getElementById('modRiskCount').textContent = modRisk;
  document.getElementById('safeCount').textContent = activeItems.length > 0 && (highRisk + modRisk === 0) ? activeItems.length : 0;
}