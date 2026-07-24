// ======================================================
// DRUGSCLINICAL ENGINE - POINT-OF-CARE CORE
// ======================================================

// Base de datos clínica ampliada
const CLINICAL_DATABASE = [
  { id: '1', name: 'Warfarina 5mg', category: 'fármaco', type: 'pill', detail: 'Anticoagulante oral' },
  { id: '2', name: 'Aspirina 100mg', category: 'fármaco', type: 'pill', detail: 'Antiagregante plaquetario' },
  { id: '3', name: 'Hierba de San Juan', category: 'herbolaria', type: 'leaf', detail: 'Suplemento / Inductor CYP3A4' },
  { id: '4', name: 'Set Infusión PVC', category: 'dispositivo', type: 'syringe', detail: 'Material médico IV' },
  { id: '5', name: 'eGFR < 30 mL/min', category: 'condicion', type: 'activity', detail: 'Insuficiencia renal severa' },
  { id: '6', name: 'Furosemida', category: 'fármaco', type: 'pill', detail: 'Diurético de asa' },
  { id: '7', name: 'Midazolam', category: 'fármaco', type: 'pill', detail: 'Benzodiacepina' },
  { id: '8', name: 'Omeprazol', category: 'fármaco', type: 'pill', detail: 'Inhibidor de la bomba de protones' },
  { id: '9', name: 'Levotiroxina', category: 'fármaco', type: 'pill', detail: 'Hormona tiroidea' }
];

// Estado global de la prescripción activa
let activeItems = [
  'Warfarina 5mg',
  'Hierba de San Juan',
  'Set Infusión PVC',
  'eGFR < 30 mL/min',
  'Omeprazol',
  'Levotiroxina'
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
    action: 'Usar tubuladuras/sets libres de PVC (Polietileno o Poliolefina).'
  },
  {
    pair: ['Omeprazol', 'Levotiroxina'],
    severity: 'warning',
    title: 'Omeprazol + Levotiroxina',
    category: 'Interacción Fármaco-Fármaco',
    badge: 'Reducción de Absorción',
    mechanism: 'La supresión del ácido gástrico producida por el IBP disminuye la disolución y absorción de la levotiroxina.',
    consequence: 'Posible elevación de TSH y control subóptimo del hipotiroidismo.',
    action: 'Separar la toma de ambos medicamentos al menos 4 horas o ajustar la dosis de hormona tiroidea.'
  }
];

// Reglas de incompatibilidad Y-Site (Línea IV)
const Y_SITE_RULES = [
  {
    pair: ['Furosemida', 'Midazolam'],
    status: 'Incompatible',
    detail: 'Precipitación inmediata observada en infusión continua.'
  }
];

// ======================================================
// EVENTOS Y LÓGICA DE INTERFAZ
// ======================================================

document.addEventListener('DOMContentLoaded', () => {
  renderActivePills();
  evaluateInteractions();

  const addBtn = document.querySelector('button:has(i[data-lucide="plus"]), button:contains("+")') || document.querySelector('button.bg-gradient-to-r');
  const searchInput = document.querySelector('input[placeholder*="Añade Fármaco"]');

  if (addBtn && searchInput) {
    addBtn.addEventListener('click', () => {
      const value = searchInput.value.trim();
      if (value && !activeItems.includes(value)) {
        activeItems.push(value);
        searchInput.value = '';
        renderActivePills();
        evaluateInteractions();
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addBtn.click();
      }
    });
  }
});

// Renderizar Pills Activas
function renderActivePills() {
  const container = document.querySelector('.max-w-3xl.mx-auto.mt-4.flex');
  if (!container) return;

  // Preservar la etiqueta "EVALUANDO:"
  container.innerHTML = `<span class="text-xs text-slate-400 uppercase tracking-wider font-mono mr-1">Evaluando:</span>`;

  activeItems.forEach((item, index) => {
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clinical-bg border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-fade-in';
    pill.innerHTML = `
      <i data-lucide="pill" class="w-3.5 h-3.5 text-cyan-400"></i>
      <span>${item}</span>
      <button onclick="removePill(${index})" class="hover:text-white ml-1 text-slate-400">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;
    container.appendChild(pill);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Quitar elemento
function removePill(index) {
  activeItems.splice(index, 1);
  renderActivePills();
  evaluateInteractions();
}

// Evaluar Matriz de Interacciones
function evaluateInteractions() {
  const detectedAlerts = [];
  
  INTERACTION_RULES.forEach(rule => {
    const [itemA, itemB] = rule.pair;
    if (activeItems.includes(itemA) && activeItems.includes(itemB)) {
      detectedAlerts.push(rule);
    }
  });

  renderAlerts(detectedAlerts);
  updateCounters(detectedAlerts);
}

// Renderizar tarjetas de alertas dinámicamente
function renderAlerts(alerts) {
  const alertContainer = document.querySelector('.lg\\:col-span-2');
  if (!alertContainer) return;

  if (alerts.length === 0) {
    alertContainer.innerHTML = `
      <div class="bg-clinical-card border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <i data-lucide="check-circle" class="w-6 h-6"></i>
        </div>
        <h3 class="text-base font-bold text-white">Sin Interacciones Severas Detectadas</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto">La combinación actual de fármacos, elementos herbolarios y parámetros seleccionados no presenta incompatibilidades en el motor de reglas activo.</p>
      </div>
    `;
  } else {
    alertContainer.innerHTML = alerts.map(alert => `
      <article class="bg-clinical-card rounded-2xl border ${alert.severity === 'danger' ? 'border-rose-500/40 glow-danger' : 'border-amber-500/40'} p-5 space-y-4">
        <div class="flex items-start justify-between border-b border-clinical-border/60 pb-3">
          <div class="flex items-center gap-3">
            <span class="p-2.5 rounded-xl ${alert.severity === 'danger' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}">
              <i data-lucide="${alert.severity === 'danger' ? 'leaf' : 'syringe'}" class="w-5 h-5"></i>
            </span>
            <div>
              <span class="text-[10px] font-mono uppercase text-slate-400 tracking-wider">${alert.category}</span>
              <h2 class="text-base font-bold text-white">${alert.title}</h2>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono ${alert.severity === 'danger' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'} uppercase">
            ${alert.badge}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="bg-clinical-bg p-3.5 rounded-xl border border-clinical-border">
            <span class="text-slate-400 font-semibold block mb-1 font-mono uppercase text-[10px]">Mecanismo</span>
            <p class="text-slate-300 leading-relaxed">${alert.mechanism}</p>
          </div>
          <div class="bg-clinical-bg p-3.5 rounded-xl border border-clinical-border">
            <span class="text-slate-400 font-semibold block mb-1 font-mono uppercase text-[10px]">Consecuencia Clínica</span>
            <p class="text-slate-300 leading-relaxed">${alert.consequence}</p>
          </div>
        </div>

        <div class="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-start gap-3 text-xs">
          <i data-lucide="shield-alert" class="w-5 h-5 text-cyan-400 shrink-0 mt-0.5"></i>
          <div>
            <strong class="text-cyan-300 block font-bold">Acción Sugerida:</strong>
            <p class="text-slate-300 mt-0.5">${alert.action}</p>
          </div>
        </div>
      </article>
    `).join('');
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Actualizar contadores del panel "Diagnóstico de Seguridad"
function updateCounters(alerts) {
  const dangerCount = alerts.filter(a => a.severity === 'danger').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const safeCount = Math.max(0, activeItems.length - (dangerCount + warningCount));

  const countElements = document.querySelectorAll('.space-y-2\\.5 .text-sm.font-bold');
  if (countElements.length >= 3) {
    countElements[0].textContent = dangerCount;
    countElements[1].textContent = warningCount;
    countElements[2].textContent = safeCount;
  }
}