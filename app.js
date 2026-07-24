// ==========================================
// DRUGSCLINICAL ENGINE - POINT-OF-CARE CORE
// ==========================================

// Base de datos clínica ampliada (extensible mediante APIs externas)
const CLINICAL_DATABASE = [
  { id: '1', name: 'Warfarina 5mg', category: 'fármaco', type: 'pill', detail: 'Anticoagulante oral' },
  { id: '2', name: 'Aspirina 100mg', category: 'fármaco', type: 'pill', detail: 'Antiagregante plaquetario' },
  { id: '3', name: 'Hierba de San Juan', category: 'herbolaria', type: 'leaf', detail: 'Suplemento / Inductor CYP3A4' },
  { id: '4', name: 'Set Infusión PVC', category: 'dispositivo', type: 'syringe', detail: 'Material médico IV' },
  { id: '5', name: 'eGFR < 30 mL/min', category: 'condicion', type: 'activity', detail: 'Insuficiencia renal severa' },
  { id: '6', name: 'Furosemida', category: 'fármaco', type: 'pill', detail: 'Diurético de asa' },
  { id: '7', name: 'Midazolam', category: 'fármaco', type: 'pill', detail: 'Benzodiacepina' },
  { id: '8', name: 'Jugo de Toronja', category: 'nutrimento', type: 'apple', detail: 'Inhibidor intestinal CYP3A4' }
];

// Matriz multidimensional de reglas interactivas
const INTERACTION_RULES = [
  {
    pair: ['Warfarina 5mg', 'Hierba de San Juan'],
    severity: 'danger',
    title: 'Warfarina + Hierba de San Juan',
    category: 'Interacción Herbolaria-Fármaco',
    badge: 'Contraindicación Mayor',
    mechanism: 'La Hierba de San Juan es un potente inductor de la isoenzima CYP3A4 y de la glicoproteína-P (P-gp).',
    consequence: 'Pérdida drástica de la eficacia anticoagulante (caída severa de INR), elevando el riesgo de trombosis o TEP.',
    action: 'Discontinuar la Hierba de San Juan. Monitorizar INR estrechamente cada 48h hasta estabilización.'
  },
  {
    pair: ['Warfarina 5mg', 'Aspirina 100mg'],
    severity: 'danger',
    title: 'Warfarina + Aspirina',
    category: 'Interacción Fármaco-Fármaco',
    badge: 'Riesgo Crítico de Hemorragia',
    mechanism: 'Sinergismo farmacodinámico en la inhibición de la hemostasia primaria y secundaria.',
    consequence: 'Aumento severo en la incidencia de sangrado gastrointestinal y mayor tiempo de protrombina.',
    action: 'Evaluar indicación estricta de doble terapia. Considerar profilaxis con IBP.'
  },
  {
    pair: ['Set Infusión PVC', 'Warfarina 5mg'],
    severity: 'warning',
    title: 'Dispositivo PVC + Adsorción',
    category: 'Interacción Dispositivo-Fármaco',
    badge: 'Adsorción en Paredes',
    mechanism: 'El polímero de PVC interactúa químicamente con lipofílicos reduciendo la concentración activa.',
    consequence: 'Disminución de la dosis efectiva entregada al paciente.',
    action: 'Utilizar líneas de infusión libres de PVC (Polietileno/Poliolefina).'
  },
  {
    pair: ['Furosemida', 'Midazolam'],
    severity: 'danger',
    title: 'Furosemida + Midazolam (Y-Site)',
    category: 'Incompatibilidad Y-Site',
    badge: 'Precipitación Inmediata',
    mechanism: 'Incompatibilidad física en solución por alteración brusca del pH.',
    consequence: 'Formación de microcristales e incompatibilidad en la vía venosa.',
    action: 'Lavar vía venosa con Solución Salina 0.9% entre administraciones o utilizar luces independientes.'
  }
];

// Estado global dinámico
let activeItems = [
  { id: '1', name: 'Warfarina 5mg', type: 'pill' },
  { id: '3', name: 'Hierba de San Juan', type: 'leaf' },
  { id: '4', name: 'Set Infusión PVC', type: 'syringe' },
  { id: '5', name: 'eGFR < 30 mL/min', type: 'activity' }
];

// Event Listeners y arranque
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const addBtn = document.getElementById('addBtn');

  // Búsqueda en tiempo real
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      searchResults.classList.add('hidden');
      return;
    }

    const filtered = CLINICAL_DATABASE.filter(item => 
      item.name.toLowerCase().includes(query) || item.detail.toLowerCase().includes(query)
    );

    renderSearchResults(filtered);
  });

  // Botón agregar manual
  addBtn.addEventListener('click', () => {
    const val = searchInput.value.trim();
    if (val) {
      addItem({ id: Date.now().toString(), name: val, type: 'pill' });
      searchInput.value = '';
      searchResults.classList.add('hidden');
    }
  });

  // Ocultar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add('hidden');
    }
  });

  // Carga inicial
  renderActivePills();
  evaluateInteractions();
});

// Renderizar desplegable de autocompletado
function renderSearchResults(results) {
  const container = document.getElementById('searchResults');
  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = `<div class="p-3 text-xs text-slate-400">No se encontraron coincidencias clínicas.</div>`;
  } else {
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'p-3 hover:bg-clinical-card cursor-pointer border-b border-clinical-border/50 flex items-center justify-between text-xs transition';
      div.innerHTML = `
        <div class="flex items-center gap-2">
          <i data-lucide="${item.type}" class="w-4 h-4 text-cyan-400"></i>
          <div>
            <span class="font-bold text-white block">${item.name}</span>
            <span class="text-[10px] text-slate-400 font-mono">${item.detail}</span>
          </div>
        </div>
        <span class="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded uppercase font-mono">${item.category}</span>
      `;
      div.onclick = () => {
        addItem(item);
        document.getElementById('searchInput').value = '';
        container.classList.add('hidden');
      };
      container.appendChild(div);
    });
  }

  container.classList.remove('hidden');
  lucide.createIcons();
}

// Agregar item
function addItem(item) {
  if (!activeItems.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
    activeItems.push(item);
    renderActivePills();
    evaluateInteractions();
  }
}

// Remover item
function removeItem(name) {
  activeItems = activeItems.filter(i => i.name !== name);
  renderActivePills();
  evaluateInteractions();
}

// Renderizar las Pills superiores
function renderActivePills() {
  const container = document.getElementById('activePillsContainer');
  container.innerHTML = '<span class="text-xs text-slate-400 uppercase tracking-wider font-mono mr-1">Evaluando:</span>';

  activeItems.forEach(item => {
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clinical-bg border border-cyan-500/30 text-cyan-300 text-xs font-semibold';
    pill.innerHTML = `
      <i data-lucide="${item.type || 'pill'}" class="w-3.5 h-3.5 text-cyan-400"></i>
      <span>${item.name}</span>
      <button onclick="removeItem('${item.name}')" class="hover:text-white ml-1"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    `;
    container.appendChild(pill);
  });

  lucide.createIcons();
}

// Motor de Evaluación de Interacciones
function evaluateInteractions() {
  const activeNames = activeItems.map(i => i.name);
  const matchedRules = [];

  INTERACTION_RULES.forEach(rule => {
    const match = rule.pair.every(p => activeNames.includes(p));
    if (match) matchedRules.push(rule);
  });

  renderDiagnostics(matchedRules);
  renderAlertCards(matchedRules);
}

// Actualizar panel izquierdo
function renderDiagnostics(matches) {
  const highRiskCount = matches.filter(m => m.severity === 'danger').length;
  const modRiskCount = matches.filter(m => m.severity === 'warning').length;

  document.getElementById('highRiskCount').textContent = highRiskCount;
  document.getElementById('modRiskCount').textContent = modRiskCount;
  document.getElementById('safeCount').textContent = Math.max(0, activeItems.length - (highRiskCount + modRiskCount));
}

// Renderizar Alertas Clínicas
function renderAlertCards(matches) {
  const container = document.getElementById('alertsContainer');
  container.innerHTML = '';

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="bg-clinical-card border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
        <i data-lucide="check-circle" class="w-12 h-12 text-emerald-400 mx-auto"></i>
        <h3 class="text-lg font-bold text-white">Sin Interacciones Severas Detectadas</h3>
        <p class="text-xs text-slate-400">La combinación de elementos seleccionados no registra conflicto en la matriz multidimensional activa.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  matches.forEach(rule => {
    const card = document.createElement('article');
    const isDanger = rule.severity === 'danger';
    
    card.className = `bg-clinical-card rounded-2xl border ${isDanger ? 'border-rose-500/40 glow-danger' : 'border-amber-500/40'} p-5 space-y-4`;
    card.innerHTML = `
      <div class="flex items-start justify-between border-b border-clinical-border/60 pb-3">
        <div class="flex items-center gap-3">
          <span class="p-2.5 rounded-xl ${isDanger ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
            <i data-lucide="${isDanger ? 'alert-triangle' : 'shield-alert'}" class="w-5 h-5"></i>
          </span>
          <div>
            <span class="text-[10px] font-mono uppercase text-slate-400 tracking-wider">${rule.category}</span>
            <h2 class="text-base font-bold text-white">${rule.title}</h2>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono ${isDanger ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'} uppercase">
          ${rule.badge}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div class="bg-clinical-bg p-3.5 rounded-xl border border-clinical-border">
          <span class="text-slate-400 font-semibold block mb-1 font-mono uppercase text-[10px]">Mecanismo</span>
          <p class="text-slate-300 leading-relaxed">${rule.mechanism}</p>
        </div>
        <div class="bg-clinical-bg p-3.5 rounded-xl border border-clinical-border">
          <span class="text-slate-400 font-semibold block mb-1 font-mono uppercase text-[10px]">Consecuencia Clínica</span>
          <p class="text-slate-300 leading-relaxed">${rule.consequence}</p>
        </div>
      </div>

      <div class="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-start gap-3 text-xs">
        <i data-lucide="shield-check" class="w-5 h-5 text-cyan-400 shrink-0 mt-0.5"></i>
        <div>
          <strong class="text-cyan-300 block font-bold">Acción Sugerida:</strong>
          <p class="text-slate-300 mt-0.5">${rule.action}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}