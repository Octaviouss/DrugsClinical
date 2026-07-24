// ======================================================
// DRUGSCLINICAL ENGINE - ADVANCE POINT CARE
// ======================================================

// Base de Datos Clínica Extendida
const CLINICAL_DATABASE = [
  { id: '1', name: 'Warfarina 5mg', category: 'fármaco', detail: 'Anticoagulante oral' },
  { id: '2', name: 'Aspirina 100mg', category: 'fármaco', detail: 'Antiagregante plaquetario' },
  { id: '3', name: 'Hierba de San Juan', category: 'herbolaria', detail: 'Suplemento / Inductor CYP3A4' },
  { id: '4', name: 'Jugo de Toronja', category: 'nutrimento', detail: 'Alimento / Inhibidor intestinal CYP3A4' },
  { id: '5', name: 'Simvastatina', category: 'fármaco', detail: 'Hipolipemiante' },
  { id: '6', name: 'Furosemida', category: 'fármaco', detail: 'Diurético de asa (Infusión IV)' },
  { id: '7', name: 'Midazolam', category: 'fármaco', detail: 'Sedante (Infusión IV)' },
  { id: '8', name: 'eGFR < 30 mL/min', category: 'condicion', detail: 'Insuficiencia renal severa' },
  { id: '9', name: 'Omeprazol IV', category: 'fármaco', detail: 'Inhibidor de la bomba de protones (Parenteral)' },
  { id: '10', name: 'Solución Glucosa 5%', category: 'nutrimento', detail: 'Vehículo parenteral ácido (pH 3.5 - 6.5)' },
  { id: '11', name: 'Solución Fisiológica 0.9%', category: 'nutrimento', detail: 'Vehículo parenteral isosmótico (pH neutro)' },
  { id: '12', name: 'Levotiroxina', category: 'fármaco', detail: 'Hormona tiroidea' },
  { id: '13', name: 'Nitroglicerina IV', category: 'fármaco', detail: 'Vasodilatador lipofílico' }
];

// Matriz de Reglas
const INTERACTION_RULES = [
  // 1. Medicamento - Medicamento
  {
    type: 'fármaco-fármaco',
    priority: 1,
    pair: ['Warfarina 5mg', 'Aspirina 100mg'],
    severity: 'danger',
    title: 'Warfarina + Aspirina 100mg',
    category: 'Interacción Medicamento - Medicamento',
    badge: 'Riesgo Alto de Sangrado',
    mechanism: 'Sinergismo farmacodinámico sobre la cascada de coagulación y agregación plaquetaria.',
    consequence: 'Elevado riesgo de hemorragia gastrointestinal o sistémica grave.',
    action: 'Evaluar necesidad estricta de anticoagulación doble. Considerar IBP de soporte.'
  },

  // 2. Medicamento - Nutrimento / Vehículo Parenteral
  {
    type: 'fármaco-nutrimento',
    priority: 2,
    pair: ['Omeprazol IV', 'Solución Glucosa 5%'],
    severity: 'danger',
    title: 'Omeprazol IV + Solución Glucosa 5%',
    category: 'Interacción Medicamento - Nutrimento / Vehículo',
    badge: 'Degradación Ácida Rápida',
    mechanism: 'El omeprazol es una molécula lábil en medio ácido. La Solución Glucosa 5% posee un pH ácido (3.5 - 6.5) que acelera la degradación e hidrólisis del fármaco.',
    consequence: 'Pérdida rápida de estabilidad, posible viraje de color/precipitación y pérdida total de eficacia terapéutica en infusiones > 2 a 4 horas.',
    action: 'Reconstituir y diluir exclusivamente en Solución Fisiológica 0.9% (estable hasta 12h) o administrarse en bolo/infusión inmediata (< 2 horas).'
  },
  {
    type: 'fármaco-nutrimento',
    priority: 2,
    pair: ['Simvastatina', 'Jugo de Toronja'],
    severity: 'danger',
    title: 'Simvastatina + Jugo de Toronja',
    category: 'Interacción Medicamento - Nutrimento',
    badge: 'Toxicidad Muscular',
    mechanism: 'El jugo de toronja inhibe de forma irreversible la enzima CYP3A4 del epitelio intestinal.',
    consequence: 'Incremento de la biodisponibilidad y riesgo severo de rabdomiólisis y mialgias.',
    action: 'Evitar el consumo simultáneo de jugo de toronja durante el tratamiento.'
  },

  // 3. Medicamento - Enfermedad
  {
    type: 'fármaco-enfermedad',
    priority: 3,
    pair: ['Warfarina 5mg', 'eGFR < 30 mL/min'],
    severity: 'warning',
    title: 'Warfarina + Insuficiencia Renal Severa',
    category: 'Interacción Medicamento - Enfermedad',
    badge: 'Ajuste Renal / Sangrado',
    mechanism: 'Alteración de la aclaración plasmática y fluctuación en la síntesis de factores de coagulación.',
    consequence: 'Mayor variabilidad en valores de INR y elevado riesgo de calciphylaxis.',
    action: 'Establecer monitoreo continuo de INR y considerar anticoagulantes de menor depuración renal.'
  },

  // 4. Medicamento - Herbolario
  {
    type: 'fármaco-herbolario',
    priority: 4,
    pair: ['Warfarina 5mg', 'Hierba de San Juan'],
    severity: 'danger',
    title: 'Warfarina + Hierba de San Juan',
    category: 'Interacción Medicamento - Herbolaria',
    badge: 'Contraindicación Mayor',
    mechanism: 'La Hierba de San Juan induce de manera potente el citocromo CYP3A4 y P-gp.',
    consequence: 'Pérdida drástica del efecto anticoagulante y alto riesgo de trombosis o embolismo.',
    action: 'Discontinuar Hierba de San Juan de inmediato. Monitorizar INR.'
  }
];

// Incompatibilidad Y-Site (Hospitalario)
const Y_SITE_RULES = [
  {
    pair: ['Furosemida', 'Midazolam'],
    status: 'Incompatible',
    severity: 'danger',
    detail: 'Precipitación física e inhabilitación del catéter en línea Y-Site por incompatibilidad de pH.'
  }
];

// Estado global
let currentAmbito = 'ambulatorio';
let activeItems = [];

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
    btnAmb.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white text-teal-800 shadow border border-slate-300";
    btnHosp.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-700 hover:text-slate-900";
    
    hospModule.classList.add('opacity-30', 'pointer-events-none');
    uciBadge.textContent = "Solo Hospitalario";
  } else {
    btnHosp.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white text-teal-800 shadow border border-slate-300";
    btnAmb.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-700 hover:text-slate-900";
    
    hospModule.classList.remove('opacity-30', 'pointer-events-none');
    uciBadge.textContent = "Módulo Activo";
  }
}

// Autocompletado de Búsqueda
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
    container.innerHTML = `<div class="p-3 text-xs font-bold text-slate-600">No se encontraron coincidencias.</div>`;
  } else {
    matches.forEach(item => {
      const div = document.createElement('div');
      div.className = 'p-3 hover:bg-teal-50 cursor-pointer border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900';
      div.innerHTML = `
        <div>
          <span class="block font-black text-slate-900">${item.name}</span>
          <span class="text-[11px] font-semibold text-slate-600">${item.detail}</span>
        </div>
        <span class="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono uppercase font-bold border border-slate-300">${item.category}</span>
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

// Render de Pills
function renderActivePills() {
  const container = document.getElementById('activePillsContainer');
  container.innerHTML = '';

  if (activeItems.length === 0) {
    container.innerHTML = `<span class="text-xs font-bold text-slate-500 italic">Lista vacía. Ingrese fármacos, vehículos o condiciones arriba.</span>`;
    return;
  }

  activeItems.forEach((item, index) => {
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-100 border-2 border-teal-600 text-teal-950 text-xs font-black shadow-sm';
    pill.innerHTML = `
      <span>${item}</span>
      <button onclick="removePill(${index})" class="hover:text-red-700 text-teal-800 transition">
        <i data-lucide="x" class="w-4 h-4 stroke-[3]"></i>
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

// EVALUAR Y ORDENAR INTERACCIONES
function evaluateInteractions() {
  let matchedRules = [];

  // Buscar reglas coincidentes
  INTERACTION_RULES.forEach(rule => {
    if (rule.pair.every(p => activeItems.includes(p))) {
      matchedRules.push(rule);
    }
  });

  // Módulo Hospitalario: Evaluar Adsorción, Y-Site y Estabilidad en el Tiempo
  if (currentAmbito === 'hospitalario') {
    const deviceSelect = document.getElementById('deviceSelect').value;
    const stabilityTime = document.getElementById('timeStabilitySelect').value;
    
    // Adsorción Nitroglicerina
    if (deviceSelect === 'pvc_adsorcion' && activeItems.includes('Nitroglicerina IV')) {
      matchedRules.push({
        type: 'fármaco-fármaco',
        priority: 1,
        severity: 'warning',
        title: 'Nitroglicerina IV + Set PVC Standard',
        category: 'Interacción Dispositivo - Fármaco',
        badge: 'Adsorción en Paredes',
        mechanism: 'La nitroglicerina lipofílica se adhiere fuertemente a la matriz de PVC del equipo.',
        consequence: 'Pérdida dramática de hasta un 80% de la dosificación programada.',
        action: 'Cambiar de inmediato a un Set de Infusión Libre de PVC.'
      });
    }

    // Evaluación de Estabilidad Temporal
    if ((stabilityTime === 'prolongado' || stabilityTime === 'critico') && activeItems.includes('Omeprazol IV') && activeItems.includes('Solución Glucosa 5%')) {
      matchedRules.push({
        type: 'fármaco-nutrimento',
        priority: 2,
        severity: 'danger',
        title: 'Estabilidad Excedida: Omeprazol en Glucosa 5%',
        category: 'Inestabilidad Físico-Química Temporal',
        badge: 'Degradación Total (> 6h)',
        mechanism: 'En mezcla con glucosa ácida a un tiempo transcurrido superior a 2-4 horas, la degradación por hidrólisis alcanza valores críticos.',
        consequence: 'Pérdida severa de potencia farmacológica e insumos de degradación visibles.',
        action: 'Reemplazar infusión actual inmediatamente por preparación fresca en Solución Fisiológica 0.9%.'
      });
    }

    evaluateYSiteCompatibility();
  }

  // ORDENAR SEGÚN JERARQUÍA EXIGIDA
  matchedRules.sort((a, b) => a.priority - b.priority);

  renderAlertsUI(matchedRules);
  updateCountersUI(matchedRules);
}

// Evaluar Y-Site
function evaluateYSiteCompatibility() {
  const ySiteBox = document.getElementById('ySiteStatus');
  let incompatibilityFound = false;

  Y_SITE_RULES.forEach(rule => {
    if (rule.pair.every(p => activeItems.includes(p))) {
      incompatibilityFound = true;
      ySiteBox.className = "p-3 bg-red-100 border-2 border-red-600 rounded-xl text-xs text-red-950 font-black space-y-1 animate-pulse";
      ySiteBox.innerHTML = `
        <div class="font-black flex items-center justify-between text-red-950">
          <span>${rule.pair.join(' + ')}</span>
          <span class="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded font-mono uppercase">Incompatible</span>
        </div>
        <p class="text-[11px] text-red-900 font-bold">${rule.detail}</p>
      `;
    }
  });

  if (!incompatibilityFound) {
    ySiteBox.className = "p-3 bg-emerald-100 border-2 border-emerald-600 rounded-xl text-xs text-emerald-950 font-bold";
    ySiteBox.innerHTML = `Sin incompatibilidades físicas directas detectadas en la línea IV.`;
  }
}

// RENDER DE ALERTAS
function renderAlertsUI(rules) {
  const container = document.getElementById('alertsContainer');
  const diagnosticPanel = document.getElementById('diagnosticPanel');
  const statusBadge = document.getElementById('statusBadge');
  
  diagnosticPanel.classList.remove('opacity-30', 'grayscale');
  container.innerHTML = '';

  if (rules.length === 0) {
    statusBadge.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 border-2 border-emerald-600 font-black uppercase";
    statusBadge.textContent = "Evaluado: Seguro";

    container.innerHTML = `
      <div class="bg-white border-2 border-emerald-600 rounded-2xl p-8 text-center space-y-3 shadow-md transition-all">
        <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border-2 border-emerald-600">
          <i data-lucide="check-circle-2" class="w-8 h-8"></i>
        </div>
        <h3 class="text-base font-black text-slate-900">Evaluación Completada: Sin Interacciones Detectadas</h3>
        <p class="text-xs font-bold text-slate-600 max-w-sm mx-auto">
          Los productos evaluados no presentan conflictos dentro del motor de prescripción.
        </p>
      </div>
    `;
  } else {
    statusBadge.className = "text-[10px] px-2 py-0.5 rounded bg-red-200 text-red-950 border-2 border-red-600 font-black uppercase animate-pulse";
    statusBadge.textContent = "Alertas Activas";

    rules.forEach(rule => {
      const isDanger = rule.severity === 'danger';
      const card = document.createElement('article');
      
      card.className = `bg-white border-2 ${
        isDanger 
          ? 'border-red-600 shadow-xl shadow-red-600/10 ring-2 ring-red-600' 
          : 'border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500'
      } rounded-2xl p-5 transition-all duration-300 space-y-4`;
      
      card.innerHTML = `
        <div class="flex items-start justify-between border-b-2 border-slate-200 pb-3">
          <div class="flex items-center gap-3">
            <span class="p-2.5 rounded-xl ${isDanger ? 'bg-red-700 text-white' : 'bg-amber-600 text-white'} shadow-md">
              <i data-lucide="${isDanger ? 'alert-triangle' : 'shield-alert'}" class="w-6 h-6"></i>
            </span>
            <div>
              <span class="text-[11px] font-mono font-black uppercase text-slate-700 tracking-wider">${rule.category}</span>
              <h2 class="text-lg font-black text-slate-900">${rule.title}</h2>
            </div>
          </div>
          <span class="px-3 py-1 rounded-md text-[10px] font-black font-mono ${
            isDanger ? 'bg-red-100 text-red-950 border-2 border-red-600' : 'bg-amber-100 text-amber-950 border-2 border-amber-600'
          } uppercase tracking-wide">
            ${rule.badge}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="bg-slate-100 p-3.5 rounded-xl border-2 border-slate-300">
            <span class="text-slate-900 font-black block mb-1 font-mono uppercase text-[10px]">Mecanismo</span>
            <p class="text-slate-800 font-bold leading-relaxed">${rule.mechanism}</p>
          </div>
          <div class="bg-slate-100 p-3.5 rounded-xl border-2 border-slate-300">
            <span class="text-slate-900 font-black block mb-1 font-mono uppercase text-[10px]">Consecuencia Clínica</span>
            <p class="text-slate-800 font-bold leading-relaxed">${rule.consequence}</p>
          </div>
        </div>

        <div class="p-3 bg-teal-100 border-2 border-teal-600 rounded-xl flex items-start gap-2.5 text-xs">
          <i data-lucide="info" class="w-5 h-5 text-teal-900 shrink-0 mt-0.5"></i>
          <div>
            <strong class="text-teal-950 block font-black text-xs uppercase font-mono">Acción Sugerida:</strong>
            <p class="text-slate-900 font-extrabold mt-0.5">${rule.action}</p>
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

// Actualizar Diagnóstico de Seguridad
function updateCountersUI(rules) {
  const highRisk = rules.filter(r => r.severity === 'danger').length;
  const modRisk = rules.filter(r => r.severity === 'warning').length;
  const safeCount = activeItems.length > 0 && (highRisk + modRisk === 0) ? activeItems.length : 0;

  document.getElementById('highRiskCount').textContent = highRisk;
  document.getElementById('modRiskCount').textContent = modRisk;
  document.getElementById('safeCount').textContent = safeCount;

  const highBox = document.getElementById('highRiskBox');
  const highDot = document.getElementById('highRiskDot');
  if (highRisk > 0) {
    highBox.className = "flex justify-between items-center p-3 rounded-xl bg-red-100 border-2 border-red-600 text-red-950 font-black shadow-sm";
    highDot.className = "w-3 h-3 rounded-full bg-red-700 animate-ping";
  } else {
    highBox.className = "flex justify-between items-center p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold";
    highDot.className = "w-3 h-3 rounded-full bg-slate-400";
  }

  const modBox = document.getElementById('modRiskBox');
  const modDot = document.getElementById('modRiskDot');
  if (modRisk > 0) {
    modBox.className = "flex justify-between items-center p-3 rounded-xl bg-amber-100 border-2 border-amber-600 text-amber-950 font-black shadow-sm";
    modDot.className = "w-3 h-3 rounded-full bg-amber-600";
  } else {
    modBox.className = "flex justify-between items-center p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold";
    modDot.className = "w-3 h-3 rounded-full bg-slate-400";
  }

  const safeBox = document.getElementById('safeBox');
  const safeDot = document.getElementById('safeDot');
  if (safeCount > 0) {
    safeBox.className = "flex justify-between items-center p-3 rounded-xl bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-black shadow-sm";
    safeDot.className = "w-3 h-3 rounded-full bg-emerald-700";
  } else {
    safeBox.className = "flex justify-between items-center p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold";
    safeDot.className = "w-3 h-3 rounded-full bg-slate-400";
  }
}