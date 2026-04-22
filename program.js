const SUPABASE_URL = 'https://yraxajmpsjxdmxydyedn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyYXhham1wc2p4ZG14eWR5ZWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDczOTMsImV4cCI6MjA5MTU4MzM5M30.VwOO-9C9TCSc03uLMxt5ftNSW7n2fFd3HIPf6Ia-DAU';
const USER_ID = 'jonathan';

const PROFILE = { name:'Jonathan', weight:93, height:193, age:32, bmr:2050 };

// ── CALORIES ──────────────────────────────────────────────────────────────────
const CALORIE_BASE = {
  h:{ base:480, perKgVol:0.04 },
  l:{ base:350, perKgVol:0.03 },
  c:{ base:420, perKgVol:0.035 },
};
const CARDIO_KCAL = {
  marche:{ faible:160, moderee:220, intense:300 },
  velo:  { faible:200, moderee:280, intense:360 },
};

// ── GAINAGE PROTOCOL ─────────────────────────────────────────────────────────
// 45s effort · 15s repos · ordre optimal science + vidéo
const GAINAGE_PROTOCOL = [
  { id:'planche_coudes',    name:'Planche sur les coudes',       work:45, rest:15, tip:'Corps droit · abdos contractés · respire normalement' },
  { id:'dead_bug',          name:'Dead bug',                      work:45, rest:15, tip:'Dos plaqué au sol · bras et jambe opposés · contrôle total' },
  { id:'planche_lat_g',     name:'Planche latérale gauche',       work:45, rest:15, tip:'Hanche haute · corps aligné · bras tendu ou coude' },
  { id:'planche_lat_d',     name:'Planche latérale droite',       work:45, rest:15, tip:'Hanche haute · corps aligné · bras tendu ou coude' },
  { id:'planche_bras',      name:'Planche bras tendus',           work:45, rest:15, tip:'Mains sous épaules · abdos serrés · pas de cambrure' },
  { id:'gainage_dos',       name:'Gainage sur le dos',            work:45, rest:15, tip:'Épaules décollées · bras au ciel · jambes à 90° · lombaires au sol' },
  { id:'planche_avancees',  name:'Planche coudes avancés',        work:45, rest:15, tip:'Coudes devant les épaules · tension maximale · respire' },
  { id:'banane_dynamique',  name:'Banane dynamique',              work:45, rest:15, tip:'Mouvement contrôlé · recrutement total · finisseur' },
];
// Total : 8 exos × 60s = 8 min pile

// ── CARDIO PRESETS ────────────────────────────────────────────────────────────
const CARDIO_PRESETS = {
  mercredi: { type:'marche', vitesse:5, pente:12, duree:15, label:'Récupération active' },
  vendredi: { type:'marche', vitesse:5, pente:15, duree:20, label:'Cardio modéré' },
  dimanche: { type:'marche', vitesse:5, pente:15, duree:35, label:'Cardio principal' },
};

// ── HELPERS SÉRIES ────────────────────────────────────────────────────────────
// BASE lourd : Top+BO1+BO2
const BASE_H = [{ l:'Top',isTop:true },{ l:'BO1',isBO:true },{ l:'BO2',isBO:true }];
// ISO : n séries numérotées
const iso = n => Array.from({length:n},(_,i)=>({l:`${i+1}`}));

// ── PROGRAMME ─────────────────────────────────────────────────────────────────
const PROGRAM = {

  lundi:{
    label:'Lun', name:'Pull Lourd', sub:'Dos · Biceps', type:'h',
    exos:[
      { id:'tirage_serre',      name:'Tirage serré',                kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'rowing_unilat',     name:'Rowing machine (bras/bras)',  kpi:true, note:'Un poids = 2 bras',
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'tirage_vert_u',     name:'Tirage vertical unilatéral',  note:'Bras par bras',
        series:iso(4), reps:{iso:[10,15]} },
      { id:'tirage_horiz',      name:'Tirage horizontal',
        series:iso(4), reps:{iso:[10,15]} },
      { id:'pullover',          name:'Pull over poulie haute',
        series:iso(4), reps:{iso:[10,15]} },
      { id:'curl_halt',         name:'Curl haltères',
        series:iso(4), reps:{iso:[10,15]} },
    ]
  },

  mardi:{
    label:'Mar', name:'Push Lourd', sub:'Pecs · Épaules · Triceps', type:'h',
    exos:[
      { id:'dev_couche',        name:'Développé couché',            kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'dev_incline',       name:'Développé incliné',           kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'dev_militaire',     name:'Développé militaire machine', kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'pec_deck',          name:'Pec deck',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'rear_delt',         name:'Oiseau / Rear delt',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'elev_lat',          name:'Élévations latérales',        kpi:true,
        series:iso(3), reps:{iso:[12,15]} },
      { id:'triceps_poulie',    name:'Triceps poulie corde',
        series:iso(4), reps:{iso:[10,15]} },
    ]
  },

  mercredi:{
    label:'Mer', name:'Legs Lourd', sub:'Jambes · Gainage · Cardio', type:'h',
    gainage:true, cardio:true,
    exos:[
      { id:'hack_squat',        name:'Hack squat',                  kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'leg_press',         name:'Leg press',                   kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'leg_ext',           name:'Leg extension',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'fentes_mer',        name:'Fentes bulgares',
        series:iso(3), reps:{iso:[10,12]} },
      { id:'hip_thrust',        name:'Hip thrust',                  kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'leg_curl',          name:'Leg curl',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'abducteurs',        name:'Abducteurs',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'mollets',           name:'Mollets machine',
        series:iso(3), reps:{iso:[12,15]} },
    ]
  },

  vendredi:{
    label:'Ven', name:'Pull Léger', sub:'Dos · Biceps · Gainage · Cardio', type:'l',
    gainage:true, cardio:true,
    exos:[
      { id:'tirage_serre_l',    name:'Tirage serré',                refKpi:'tirage_serre',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'rowing_unilat_l',   name:'Rowing machine (bras/bras)',  refKpi:'rowing_unilat', note:'Un poids = 2 bras',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'tirage_vert_ul',    name:'Tirage vertical unilatéral',  refKpi:'tirage_vert_u', note:'Bras par bras',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'tirage_horiz_l',    name:'Tirage horizontal',           refKpi:'tirage_horiz',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'pullover_l',        name:'Pull over poulie haute',      refKpi:'pullover',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'curl_halt_l',       name:'Curl haltères',               refKpi:'curl_halt',
        series:iso(4), reps:{iso:[12,15]} },
      { id:'rear_delt_l',       name:'Oiseau / Rear delt',          refKpi:'rear_delt',
        series:iso(3), reps:{iso:[12,15]} },
    ]
  },

  samedi:{
    label:'Sam', name:'Push Léger', sub:'Pecs · Épaules · Bras · Abdos', type:'l',
    gainage:true, abdos:true,
    exos:[
      { id:'dev_couche_bl',     name:'Développé couché',            isBarre:true, isBloc:true,
        series:iso(4), reps:{bloc:[6,15]}, blocZones:[[12,15],[10,13],[8,11],[6,9]] },
      { id:'dev_incline_bl',    name:'Développé incliné',           isBarre:true, isBloc:true,
        series:iso(4), reps:{bloc:[6,15]}, blocZones:[[12,15],[10,13],[8,11],[6,9]] },
      { id:'dev_milit_l',       name:'Développé militaire machine', refKpi:'dev_militaire',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'pec_deck_l',        name:'Pec deck',                    refKpi:'pec_deck',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'rear_delt_s',       name:'Oiseau / Rear delt',          refKpi:'rear_delt',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'elev_lat_l',        name:'Élévations latérales',        refKpi:'elev_lat',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'triceps_l',         name:'Triceps poulie',              refKpi:'triceps_poulie',
        series:iso(4), reps:{iso:[12,15]} },
      { id:'curl_s',            name:'Curl haltères',               refKpi:'curl_halt',
        series:iso(4), reps:{iso:[12,15]} },
    ],
    abdosExos:[
      { id:'crunchs_s',         name:'Crunchs machine',             series:iso(3), reps:{iso:[15,20]} },
      { id:'rotation_s',        name:'Rotation buste machine',      series:iso(3), reps:{iso:[15,15]}, note:'15 reps / côté' },
      { id:'leg_raises_s',      name:'Leg raises',                  series:iso(3), reps:{iso:[10,15]} },
    ]
  },

  dimanche:{
    label:'Dim', name:'Legs Léger', sub:'Jambes · Abdos · Cardio', type:'c',
    gainage:true, abdos:true, cardio:true,
    exos:[
      { id:'hack_squat_l',      name:'Hack squat',                  refKpi:'hack_squat',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'leg_press_l',       name:'Leg press',                   refKpi:'leg_press',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'leg_ext_l',         name:'Leg extension',               refKpi:'leg_ext',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'hip_thrust_l',      name:'Hip thrust',                  refKpi:'hip_thrust',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'leg_curl_l',        name:'Leg curl',                    refKpi:'leg_curl',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'abducteurs_l',      name:'Abducteurs',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'mollets_l',         name:'Mollets machine',             refKpi:'mollets',
        series:iso(2), reps:{iso:[12,15]} },
    ],
    abdosExos:[
      { id:'crunchs_d',         name:'Crunchs machine',             series:iso(3), reps:{iso:[15,20]} },
      { id:'rotation_d',        name:'Rotation buste machine',      series:iso(3), reps:{iso:[15,15]}, note:'15 reps / côté' },
      { id:'leg_raises_d',      name:'Leg raises',                  series:iso(3), reps:{iso:[10,15]} },
    ]
  },
};

// ── KPI EXERCICES ─────────────────────────────────────────────────────────────
const KPI_EXOS = [
  { id:'tirage_serre',   name:'Tirage serré',     day:'lundi' },
  { id:'dev_couche',     name:'Dév. couché',      day:'mardi' },
  { id:'dev_incline',    name:'Dév. incliné',     day:'mardi' },
  { id:'dev_militaire',  name:'Dév. militaire',   day:'mardi' },
  { id:'hack_squat',     name:'Hack squat',       day:'mercredi' },
  { id:'hip_thrust',     name:'Hip thrust',       day:'mercredi' },
  { id:'leg_press',      name:'Leg press',        day:'mercredi' },
];

// ── PALIERS ───────────────────────────────────────────────────────────────────
const MILESTONES = {
  dev_couche:   [{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:120,l:'120kg'},{kg:140,l:'140kg'},{kg:160,l:'160kg'}],
  dev_incline:  [{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:120,l:'120kg'}],
  dev_militaire:[{kg:40,l:'40kg'},{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'}],
  hack_squat:   [{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:130,l:'130kg'}],
  hip_thrust:   [{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:130,l:'130kg'},{kg:160,l:'160kg'}],
  leg_press:    [{kg:100,l:'100kg'},{kg:150,l:'150kg'},{kg:200,l:'200kg'},{kg:250,l:'250kg'}],
  tirage_serre: [{kg:40,l:'40kg'},{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'}],
  curl_halt:    [{kg:14,l:'14kg'},{kg:18,l:'18kg'},{kg:22,l:'22kg'},{kg:26,l:'26kg'}],
  elev_lat:     [{kg:12,l:'12kg'},{kg:16,l:'16kg'},{kg:20,l:'20kg'},{kg:24,l:'24kg'}],
};

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_session',  icon:'⚡', name:'Premier raid',        desc:'Première séance enregistrée' },
  { id:'streak_4',       icon:'🔥', name:'Sans faille',         desc:'4 semaines consécutives' },
  { id:'streak_8',       icon:'💪', name:'Machine',             desc:'8 semaines consécutives' },
  { id:'pr_10',          icon:'📈', name:'En progression',      desc:'10 PR battus' },
  { id:'pr_50',          icon:'🏆', name:'Briseur de records',  desc:'50 PR battus' },
  { id:'vol_100t',       icon:'⚖️', name:'100 tonnes',          desc:'100 000 kg cumulés' },
  { id:'dev_100',        icon:'🎯', name:'Club des 100',        desc:'100kg au développé couché' },
  { id:'overall_85',     icon:'⭐', name:'Avancé',              desc:'Overall 85 atteint' },
  { id:'overall_90',     icon:'👑', name:'Elite',               desc:'Overall 90 atteint' },
  { id:'gainage_10',     icon:'🛡️', name:'Sangle de fer',       desc:'10 séances de gainage' },
];

// ── FONCTIONS UTILITAIRES ─────────────────────────────────────────────────────

function calcORM(kg, reps) {
  if (!kg || !reps || reps <= 0) return 0;
  return Math.round(kg * (1 + reps / 30));
}

// Poids léger = 70% du top set lourd, arrondi au 2.5kg
function getSmartWeight(exo, cache, week) {
  if (!exo.refKpi) return null;
  const heavyDay = Object.keys(PROGRAM).find(dk =>
    PROGRAM[dk].exos.some(e => e.id === exo.refKpi)
  );
  if (!heavyDay) return null;
  for (let w = week; w >= 1; w--) {
    const kg = cache[`${w}_${heavyDay}_${exo.refKpi}_0_kg`];
    if (kg && parseFloat(kg) > 0)
      return Math.round(parseFloat(kg) * 0.70 / 2.5) * 2.5;
  }
  return null;
}

// Progression guidée +2.5kg si dépasse plafond reps
function calcProgression(exo, kg, reps) {
  if (!kg || !reps) return null;
  const isTopBO = exo.series?.some(s => s.isTop);
  if (isTopBO && parseInt(reps) > 8) return Math.round((parseFloat(kg) + 2.5) * 10) / 10;
  if (!isTopBO && parseInt(reps) > 15) return Math.round((parseFloat(kg) + 2.5) * 10) / 10;
  return null;
}

// Reco charge bloc hypertrophie
function calcBlocReco(repsArray) {
  const valid = repsArray.filter(r => r > 0);
  if (valid.length < 3) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (avg > 15) return { type:'up',   text:'Charge trop légère', sub:'Essaie +5kg la semaine prochaine' };
  if (avg < 6)  return { type:'down', text:'Charge trop lourde',  sub:'Descends de 5kg la semaine prochaine' };
  return { type:'ok', text:'Zone hypertrophie parfaite', sub:'Garde la même charge' };
}

function isDeloadWeek(w) { return w > 0 && w % 8 === 0; }
function getDeloadWeight(kg) { return Math.round(parseFloat(kg) * 0.80 / 2.5) * 2.5; }

function detectPlateau(eid, cache, week) {
  if (week < 3) return false;
  const kgs = [week-2, week-1, week].map(w => {
    for (const [k, v] of Object.entries(cache)) {
      if (k.includes(`_${eid}_0_kg`) && k.startsWith(`${w}_`)) return parseFloat(v) || 0;
    }
    return 0;
  });
  return kgs[0] > 0 && kgs[0] === kgs[1] && kgs[1] === kgs[2];
}

function calcPushPullRatio(cache) {
  let push = 0, pull = 0;
  for (const [k, v] of Object.entries(cache)) {
    if (!k.endsWith('_kg')) continue;
    const kg = parseFloat(v) || 0;
    const repsK = k.replace('_kg','_reps');
    const reps = parseInt(cache[repsK]) || 0;
    if (kg > 0 && reps > 0) {
      if (k.includes('_mardi_') || k.includes('_samedi_')) push += kg * reps;
      if (k.includes('_lundi_') || k.includes('_vendredi_')) pull += kg * reps;
    }
  }
  if (!push && !pull) return null;
  return { push:Math.round(push), pull:Math.round(pull), ratio:Math.round(push/Math.max(pull,1)*100)/100 };
}

function getTopSetPRFromCache(eid, cache) {
  let best = 0, bestW = 0;
  for (const [k, v] of Object.entries(cache)) {
    if (!k.endsWith('_kg') || !k.includes(`_${eid}_`)) continue;
    const kg = parseFloat(v) || 0;
    if (kg > best) { best = kg; const m = k.match(/^(\d+)_/); if(m) bestW = parseInt(m[1]); }
  }
  return best > 0 ? { kg:best, week:bestW } : null;
}

function getNextMilestone(eid, currentKg) {
  return (MILESTONES[eid] || []).find(m => m.kg > currentKg) || null;
}

function calcEstimatedCalories(dayType, volumeKg, durationSec, cardio) {
  const base = CALORIE_BASE[dayType] || CALORIE_BASE.h;
  const durFactor = Math.min((durationSec/60)/60, 1.5);
  let kcal = Math.round(base.base * durFactor + volumeKg * base.perKgVol);
  if (cardio?.type && cardio?.duration && cardio?.intensity) {
    const cardioKcal = CARDIO_KCAL[cardio.type]?.[cardio.intensity] || 0;
    kcal += Math.round(cardioKcal * cardio.duration / 30);
  }
  return Math.max(kcal, 80);
}

function getSerieInfo(serie, exo) {
  if (serie.isTop) return { label:'Top set', cls:'top', range:exo.reps?.top||[6,8] };
  if (serie.isBO)  return { label:serie.l,   cls:'bo',  range:exo.reps?.bo||[10,12] };
  if (exo.isBloc)  return { label:`S${serie.l}`, cls:'bloc', range:exo.reps?.bloc||[6,15] };
  return { label:`Série ${serie.l}`, cls:'iso', range:exo.reps?.iso||[10,15] };
}

// Détecter automatiquement le jour de la semaine
function getTodayDayKey() {
  const dow = new Date().getDay(); // 0=dim, 1=lun...
  const map = { 1:'lundi', 2:'mardi', 3:'mercredi', 4:null, 5:'vendredi', 6:'samedi', 0:'dimanche' };
  return map[dow] || 'lundi';
}
Terminé
Voilà le contenu complet de program.js — copie tout ce texte depuis le début jusqu'à la fin et colle-le dans l'éditeur GitHub après avoir sélectionné tout l'ancien contenu (Cmd+A).

Ensuite fais pareil pour app.js — tu veux que je te le donne aussi ? 💪



  
