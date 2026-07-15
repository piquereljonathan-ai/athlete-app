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

// ── GAINAGE PROTOCOL ──────────────────────────────────────────────────────────
const GAINAGE_PROTOCOL = [
  { id:'planche_coudes',   name:'Planche sur les coudes',    work:45, rest:15, tip:'Corps droit · abdos contractés · respire normalement' },
  { id:'dead_bug',         name:'Dead bug',                   work:45, rest:15, tip:'Dos plaqué au sol · bras et jambe opposés · contrôle total' },
  { id:'planche_lat_g',    name:'Planche latérale gauche',    work:45, rest:15, tip:'Hanche haute · corps aligné · bras tendu ou coude' },
  { id:'planche_lat_d',    name:'Planche latérale droite',    work:45, rest:15, tip:'Hanche haute · corps aligné · bras tendu ou coude' },
  { id:'planche_bras',     name:'Planche bras tendus',        work:45, rest:15, tip:'Mains sous épaules · abdos serrés · pas de cambrure' },
  { id:'gainage_dos',      name:'Gainage sur le dos',         work:45, rest:15, tip:'Épaules décollées · bras au ciel · jambes à 90° · lombaires au sol' },
  { id:'planche_avancees', name:'Planche coudes avancés',     work:45, rest:15, tip:'Coudes devant les épaules · tension maximale · respire' },
  { id:'banane_dynamique', name:'Banane dynamique',           work:45, rest:15, tip:'Mouvement contrôlé · recrutement total · finisseur' },
];

// ── MOBILITÉ PROTOCOL JEUDI ───────────────────────────────────────────────────
// Science-based · 60–90s par position · ~22 min total
const MOBILITE_PROTOCOL = [
  // BLOC 1 — Hanches & Fléchisseurs
  { id:'fente_basse_g',  name:'Fente basse — gauche',              work:60, rest:10, bloc:'🦵 Hanches & Fléchisseurs', tip:'Genou arrière au sol · hanches vers l\'avant · dos droit · sens l\'étirement du fléchisseur de hanche' },
  { id:'fente_basse_d',  name:'Fente basse — droite',              work:60, rest:10, bloc:'🦵 Hanches & Fléchisseurs', tip:'Genou arrière au sol · hanches vers l\'avant · dos droit · sens l\'étirement du fléchisseur de hanche' },
  { id:'pigeon_g',       name:'Pigeon au sol — gauche',            work:90, rest:10, bloc:'🦵 Hanches & Fléchisseurs', tip:'Jambe avant à 90° · hanche au sol · laisse tomber le poids · respire profondément · relâche' },
  { id:'pigeon_d',       name:'Pigeon au sol — droite',            work:90, rest:10, bloc:'🦵 Hanches & Fléchisseurs', tip:'Jambe avant à 90° · hanche au sol · laisse tomber le poids · respire profondément · relâche' },
  { id:'worlds_g',       name:'World\'s Greatest Stretch — gauche',work:45, rest:10, bloc:'🦵 Hanches & Fléchisseurs', tip:'Pied en avant · coude au sol · rotation thoracique · bras vers le ciel · 5 reps lentes et contrôlées' },
  { id:'worlds_d',       name:'World\'s Greatest Stretch — droite',work:45, rest:10, bloc:'🦵 Hanches & Fléchisseurs', tip:'Pied en avant · coude au sol · rotation thoracique · bras vers le ciel · 5 reps lentes et contrôlées' },
  // BLOC 2 — Thoracique & Épaules
  { id:'thread_g',       name:'Thread the Needle — gauche',        work:45, rest:10, bloc:'🫁 Thoracique & Épaules', tip:'À 4 pattes · glisse le bras sous le corps · épaule au sol · rotation thoracique maximale · expire' },
  { id:'thread_d',       name:'Thread the Needle — droite',        work:45, rest:10, bloc:'🫁 Thoracique & Épaules', tip:'À 4 pattes · glisse le bras sous le corps · épaule au sol · rotation thoracique maximale · expire' },
  { id:'pec_doorway',    name:'Étirement pectoraux',               work:60, rest:10, bloc:'🫁 Thoracique & Épaules', tip:'Bras à 90° contre un mur · tourne le corps opposé · sens l\'ouverture du pec · contre la rétraction' },
  { id:'cat_cow',        name:'Cat-Cow',                            work:60, rest:10, bloc:'🫁 Thoracique & Épaules', tip:'À 4 pattes · dos rond puis creux · lent et contrôlé · 10 respirations · décompression vertébrale' },
  // BLOC 3 — Ischios & Dos
  { id:'ischio_g',       name:'Étirement ischio — gauche',         work:60, rest:10, bloc:'🔙 Ischios & Dos', tip:'Jambe tendue devant · buste droit vers l\'avant · pas arrondir le dos · sens l\'étirement arrière cuisse' },
  { id:'ischio_d',       name:'Étirement ischio — droite',         work:60, rest:10, bloc:'🔙 Ischios & Dos', tip:'Jambe tendue devant · buste droit vers l\'avant · pas arrondir le dos · sens l\'étirement arrière cuisse' },
  { id:'child_pose',     name:'Child\'s Pose',                      work:60, rest:10, bloc:'🔙 Ischios & Dos', tip:'Genoux écartés · bras tendus devant · front au sol · décompression lombaire · essentiel à 1m93' },
  // BLOC 4 — Cheville & Mollets
  { id:'cheville_g',     name:'Mobilisation cheville — gauche',    work:45, rest:10, bloc:'🦶 Cheville & Mollets', tip:'Pied à 10cm d\'un mur · genou touche le mur · talon au sol · 10 reps · améliore la profondeur du squat' },
  { id:'cheville_d',     name:'Mobilisation cheville — droite',    work:45, rest:10, bloc:'🦶 Cheville & Mollets', tip:'Pied à 10cm d\'un mur · genou touche le mur · talon au sol · 10 reps · améliore la profondeur du squat' },
  { id:'mollet_g',       name:'Étirement mollet — gauche',         work:45, rest:10, bloc:'🦶 Cheville & Mollets', tip:'Jambe arrière tendue · talon au sol · appuie sur le mur · puis genou légèrement fléchi (soléaire)' },
  { id:'mollet_d',       name:'Étirement mollet — droite',         work:45, rest:10, bloc:'🦶 Cheville & Mollets', tip:'Jambe arrière tendue · talon au sol · appuie sur le mur · puis genou légèrement fléchi (soléaire)' },
];

// ── CARDIO PRESETS ────────────────────────────────────────────────────────────
const CARDIO_PRESETS = {
  mercredi: { type:'marche', vitesse:5, pente:12, duree:15, label:'Récupération active' },
  vendredi: { type:'marche', vitesse:5, pente:15, duree:20, label:'Cardio modéré' },
  dimanche: { type:'marche', vitesse:5, pente:15, duree:35, label:'Cardio principal' },
};

// ── HELPERS SÉRIES ────────────────────────────────────────────────────────────
const BASE_H = [{ l:'Top',isTop:true },{ l:'BO1',isBO:true }];
const iso = n => Array.from({length:n},(_,i)=>({l:`${i+1}`}));

// ── PROGRAMME ─────────────────────────────────────────────────────────────────
const PROGRAM = {

  lundi:{
    label:'Lun', name:'Pull Lourd', sub:'Dos · Biceps', type:'h',
    exos:[
      { id:'tractions_lestees', name:'Tractions lestées',         kpi:true, note:'Poids de lest libre · prise large',
        series:iso(4), reps:{iso:[5,6]} },
      { id:'rowing_unilat',    name:'Rowing machine (bras/bras)', kpi:true, note:'Un poids = 2 bras',
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'tirage_vert_u',    name:'Tirage vertical unilatéral', note:'Bras par bras',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'tirage_horiz',     name:'Tirage horizontal',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'pullover',         name:'Pull over poulie haute',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'curl_halt',        name:'Curl haltères',              supersetGroup:'C', supersetLabel:'SS C',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'curl_barre',       name:'Curl barre (17kg)',          supersetGroup:'C', supersetLabel:'SS C', note:'Enchaîné juste après curl haltères · 17kg fixe',
        series:iso(3), reps:{iso:[8,12]} },
    ],
    abdosExos:[
      { id:'leg_raises_lun',   name:'Leg raises',    series:iso(3), reps:{iso:[12,15]}, note:'Jambes tendues · montée lente · bas du ventre' },
      { id:'rev_crunch_lun',   name:'Reverse crunch',series:iso(3), reps:{iso:[12,15]}, note:'Bascule du bassin · pas d\'élan · bas du ventre' },
    ]
  },

  mardi:{
    label:'Mar', name:'Push Lourd', sub:'Pecs · Épaules · Triceps', type:'h',
    exos:[
      { id:'dips_lestes',      name:'Dips lestés',                kpi:true, note:'Poids de lest libre',
        series:iso(4), reps:{iso:[5,6]} },
      { id:'dev_couche',       name:'Développé couché',           kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'dev_incline',      name:'Développé incliné',          kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'dev_militaire',    name:'Développé militaire machine',kpi:true, note:'Fatigue actuelle sur ce mouvement · charge réduite temporairement',
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'pec_deck',         name:'Pec deck',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'rear_delt',        name:'Oiseau / Rear delt',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'elev_lat',         name:'Élévations latérales',       kpi:true,
        series:iso(3), reps:{iso:[12,15]} },
      { id:'triceps_poulie',   name:'Triceps poulie corde',
        series:iso(3), reps:{iso:[10,15]} },
    ],
    abdosExos:[
      { id:'leg_raises_mar',   name:'Leg raises',    series:iso(3), reps:{iso:[12,15]}, note:'Jambes tendues · montée lente · bas du ventre' },
      { id:'rev_crunch_mar',   name:'Reverse crunch',series:iso(3), reps:{iso:[12,15]}, note:'Bascule du bassin · pas d\'élan · bas du ventre' },
    ]
  },

  mercredi:{
    label:'Mer', name:'Legs Lourd', sub:'Jambes · Gainage', type:'h',
    gainage:true,
    exos:[
      { id:'leg_curl',           name:'Leg curl',                   note:'Échauffement · montée progressive avant le hack squat',
        series:iso(4), reps:{iso:[10,15]} },
      { id:'hack_squat',         name:'Hack squat',                 kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'leg_press',          name:'Leg press unilatéral',       kpi:true, note:'Unilatéral · meilleure amplitude de hanche',
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'fentes_bulgares_smith', name:'Fentes bulgares guidées (Smith machine)',
        series:iso(3), reps:{iso:[6,8]}, note:'Guidées à la barre smith · lourd' },
      { id:'hip_thrust',         name:'Hip thrust',                 kpi:true,
        series:BASE_H, reps:{top:[6,8],bo:[10,12]} },
      { id:'abducteurs',         name:'Abducteurs',
        series:iso(2), reps:{iso:[12,15]} },
      { id:'mollets',            name:'Mollets machine',
        series:iso(2), reps:{iso:[12,15]} },
    ],
    abdosExos:[
      { id:'leg_raises_mer',   name:'Leg raises',    series:iso(3), reps:{iso:[12,15]}, note:'Jambes tendues · montée lente · bas du ventre' },
      { id:'rev_crunch_mer',   name:'Reverse crunch',series:iso(3), reps:{iso:[12,15]}, note:'Bascule du bassin · pas d\'élan · bas du ventre' },
    ]
  },

  jeudi:{
    label:'Jeu', name:'Mobilité', sub:'Hanches · Thoracique · Ischios · Cheville', type:'m',
    mobilite:true,
  },

  vendredi:{
    label:'Ven', name:'Pull Léger', sub:'Dos · Biceps · Gainage', type:'l',
    gainage:true,
    exos:[
      { id:'tractions_bw',    name:'Tractions au poids du corps', note:'Tempo lent contrôlé · prise large · maximiser le nombre de reps',
        series:iso(4), reps:{iso:[10,20]} },
      { id:'rowing_unilat_l',  name:'Rowing machine (bras/bras)', refKpi:'rowing_unilat', note:'Un poids = 2 bras',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'tirage_vert_ul',   name:'Tirage vertical unilatéral', refKpi:'tirage_vert_u', note:'Bras par bras',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'tirage_horiz_l',   name:'Tirage horizontal',          refKpi:'tirage_horiz',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'pullover_l',       name:'Pull over poulie haute',     refKpi:'pullover',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'curl_halt_l',      name:'Curl haltères',              refKpi:'curl_halt',            supersetGroup:'C', supersetLabel:'SS C',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'curl_barre_l',     name:'Curl barre',                 refKpi:'curl_barre',            supersetGroup:'C', supersetLabel:'SS C', note:'Enchaîné juste après curl haltères',
        series:iso(3), reps:{iso:[10,15]} },
      { id:'rear_delt_l',      name:'Oiseau / Rear delt',         refKpi:'rear_delt',
        series:iso(3), reps:{iso:[12,15]} },
    ],
    abdosExos:[
      { id:'leg_raises_ven',   name:'Leg raises',    series:iso(3), reps:{iso:[12,15]}, note:'Jambes tendues · montée lente · bas du ventre' },
      { id:'rev_crunch_ven',   name:'Reverse crunch',series:iso(3), reps:{iso:[12,15]}, note:'Bascule du bassin · pas d\'élan · bas du ventre' },
    ]
  },

  samedi:{
    label:'Sam', name:'Push Léger', sub:'Pecs · Épaules · Triceps · Abdos', type:'l',
    gainage:true, abdos:true,
    exos:[
      { id:'dips_bw',          name:'Dips au poids du corps',     note:'Tempo lent contrôlé · maximiser le nombre de reps',
        series:iso(4), reps:{iso:[10,20]} },
      { id:'dev_couche_bl',    name:'Développé couché',           isBarre:true, isBloc:true,
        series:iso(4), reps:{bloc:[6,15]}, blocZones:[[12,15],[10,13],[8,11],[6,9]] },
      { id:'dev_incline_bl',   name:'Développé incliné',          isBarre:true, isBloc:true,
        series:iso(4), reps:{bloc:[6,15]}, blocZones:[[12,15],[10,13],[8,11],[6,9]] },
      { id:'dev_milit_l',      name:'Développé militaire machine',refKpi:'dev_militaire',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'pec_deck_l',       name:'Pec deck',                   refKpi:'pec_deck',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'elev_lat_l',       name:'Élévations latérales',       refKpi:'elev_lat',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'triceps_l',        name:'Triceps poulie',             refKpi:'triceps_poulie',
        series:iso(4), reps:{iso:[12,15]} },
    ],
    abdosExos:[
      { id:'crunchs_s',        name:'Crunchs machine',            series:iso(3), reps:{iso:[15,20]} },
      { id:'rotation_s',       name:'Rotation buste machine',     series:iso(3), reps:{iso:[15,15]}, note:'15 reps / côté' },
      { id:'leg_raises_s',     name:'Leg raises',                 series:iso(3), reps:{iso:[10,15]}, note:'Jambes tendues · bas du ventre' },
    ]
  },

  dimanche:{
    label:'Dim', name:'Legs Léger', sub:'Jambes · Abdos', type:'c',
    gainage:true, abdos:true,
    exos:[
      { id:'leg_curl_l',         name:'Leg curl',                 refKpi:'leg_curl', note:'Échauffement',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'hack_squat_l',       name:'Hack squat',               refKpi:'hack_squat',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'leg_press_unilat',   name:'Leg press unilatéral',     refKpi:'leg_press', note:'1 jambe à la fois · amplitude complète · corrige les déséquilibres',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'hip_thrust_l',       name:'Hip thrust',               refKpi:'hip_thrust',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'fentes_dim',         name:'Fentes bulgares',
        series:iso(3), reps:{iso:[10,12]} },
      { id:'leg_ext_l',          name:'Leg extension',            refKpi:'leg_ext',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'abducteurs_l',       name:'Abducteurs',
        series:iso(3), reps:{iso:[12,15]} },
      { id:'mollets_l',          name:'Mollets machine',          refKpi:'mollets',
        series:iso(2), reps:{iso:[12,15]} },
    ],
    abdosExos:[
      { id:'crunchs_d',          name:'Crunchs machine',          series:iso(3), reps:{iso:[15,20]} },
      { id:'rotation_d',         name:'Rotation buste machine',   series:iso(3), reps:{iso:[15,15]}, note:'15 reps / côté' },
      { id:'leg_raises_d',       name:'Leg raises',               series:iso(3), reps:{iso:[10,15]}, note:'Jambes tendues · bas du ventre' },
    ]
  },
};

// ── KPI EXERCICES ─────────────────────────────────────────────────────────────
const KPI_EXOS = [
  { id:'tractions_lestees', name:'Tractions lestées', day:'lundi' },
  { id:'dev_couche',     name:'Dév. couché',      day:'mardi' },
  { id:'dev_incline',    name:'Dév. incliné',     day:'mardi' },
  { id:'dev_militaire',  name:'Dév. militaire',   day:'mardi' },
  { id:'dips_lestes',    name:'Dips lestés',      day:'mardi' },
  { id:'hack_squat',     name:'Hack squat',       day:'mercredi' },
  { id:'hip_thrust',     name:'Hip thrust',       day:'mercredi' },
  { id:'leg_press',      name:'Leg press unilatéral', day:'mercredi' },
];

// ── PALIERS ───────────────────────────────────────────────────────────────────
const MILESTONES = {
  dev_couche:   [{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:120,l:'120kg'},{kg:140,l:'140kg'},{kg:160,l:'160kg'}],
  dev_incline:  [{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:120,l:'120kg'}],
  dev_militaire:[{kg:40,l:'40kg'},{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'}],
  hack_squat:   [{kg:60,l:'60kg'},{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:130,l:'130kg'}],
  hip_thrust:   [{kg:80,l:'80kg'},{kg:100,l:'100kg'},{kg:130,l:'130kg'},{kg:160,l:'160kg'}],
  leg_press:    [{kg:100,l:'100kg'},{kg:150,l:'150kg'},{kg:200,l:'200kg'},{kg:250,l:'250kg'}],
  curl_halt:    [{kg:14,l:'14kg'},{kg:18,l:'18kg'},{kg:22,l:'22kg'},{kg:26,l:'26kg'}],
  elev_lat:     [{kg:12,l:'12kg'},{kg:16,l:'16kg'},{kg:20,l:'20kg'},{kg:24,l:'24kg'}],
  tractions_lestees: [{kg:5,l:'5kg'},{kg:10,l:'10kg'},{kg:15,l:'15kg'},{kg:20,l:'20kg'},{kg:25,l:'25kg'},{kg:30,l:'30kg'}],
  dips_lestes:  [{kg:5,l:'5kg'},{kg:10,l:'10kg'},{kg:15,l:'15kg'},{kg:20,l:'20kg'},{kg:25,l:'25kg'}],
};

// ── TIPS TECHNIQUE (exercices muscu) ──────────────────────────────────────────
const TIPS = {
  tractions_lestees: 'Rétracte les omoplates avant de tirer · menton passe la barre · descente contrôlée',
  tractions_bw:       'Prise large · tempo lent contrôlé · monte jusqu\'au menton au-dessus de la barre',
  rowing_unilat:      'Dos gainé · tire avec le coude, pas le bras · pause 1s en contraction',
  tirage_vert_u:      'Poitrine sortie · tire vers le bas des côtes · évite de tirer avec les biceps',
  tirage_horiz:       'Buste fixe · tire les coudes vers l\'arrière · pas d\'à-coups avec le dos',
  pullover:           'Coudes légèrement fléchis et fixes · étire bien en haut avant de revenir',
  curl_halt:          'Coudes fixes le long du corps · pas d\'élan · contrôle la descente',
  curl_barre:         'Prise à largeur d\'épaules · évite de cambrer le dos pour finir la rep',
  dips_lestes:        'Buste légèrement penché en avant · descends jusqu\'à 90° de coude · épaules basses',
  dips_bw:            'Tempo lent contrôlé · descends jusqu\'à sentir l\'étirement pec/épaule',
  dev_couche:         'Omoplates rétractées et fixes · trajectoire légèrement en diagonale · touche la poitrine',
  dev_couche_bl:      'Omoplates rétractées et fixes · trajectoire légèrement en diagonale · touche la poitrine',
  dev_incline:        'Banc à 30-45° max · évite de trop monter en épaules',
  dev_incline_bl:     'Banc à 30-45° max · évite de trop monter en épaules',
  dev_militaire:      'Gaine les abdos · pousse dans l\'axe · évite de cambrer le bas du dos',
  pec_deck:           'Amplitude complète · pause en contraction · évite de balancer le buste',
  rear_delt:          'Coudes légèrement fléchis · tire avec les épaules, pas le trapèze',
  elev_lat:           'Légère flexion des coudes · monte jusqu\'à hauteur d\'épaule · pas d\'élan du buste',
  triceps_poulie:     'Coudes fixes collés au corps · extension complète · pas de bascule du buste',
  leg_curl:           'Bassin plaqué au banc · contraction complète en haut · descente contrôlée',
  hack_squat:         'Pieds à largeur d\'épaules · descends jusqu\'à 90° · genoux dans l\'axe des pieds',
  leg_press:          'Amplitude complète sans décoller le bas du dos · ne verrouille pas les genoux en haut',
  fentes_bulgares_smith: 'Pied arrière surélevé · buste droit · descends jusqu\'à effleurer le genou au sol',
  fentes_dim:         'Buste droit · pas trop long · genou avant aligné avec la cheville',
  hip_thrust:         'Menton rentré · pousse par les talons · contraction max des fessiers en haut',
  abducteurs:         'Buste droit · mouvement contrôlé · évite de tricher avec le bassin',
  abducteurs_l:       'Buste droit · mouvement contrôlé · évite de tricher avec le bassin',
  mollets:            'Amplitude complète · pause en étirement bas · pas de rebond',
  leg_ext:            'Dos plaqué au dossier · pause 1s en haut · descente contrôlée',
};

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_session', icon:'⚡', name:'Premier raid',       desc:'Première séance enregistrée' },
  { id:'streak_4',      icon:'🔥', name:'Sans faille',        desc:'4 semaines consécutives' },
  { id:'streak_8',      icon:'💪', name:'Machine',            desc:'8 semaines consécutives' },
  { id:'pr_10',         icon:'📈', name:'En progression',     desc:'10 PR battus' },
  { id:'pr_50',         icon:'🏆', name:'Briseur de records', desc:'50 PR battus' },
  { id:'vol_100t',      icon:'⚖️', name:'100 tonnes',         desc:'100 000 kg cumulés' },
  { id:'dev_100',       icon:'🎯', name:'Club des 100',       desc:'100kg au développé couché' },
  { id:'overall_85',    icon:'⭐', name:'Avancé',             desc:'Overall 85 atteint' },
  { id:'overall_90',    icon:'👑', name:'Elite',              desc:'Overall 90 atteint' },
  { id:'gainage_10',    icon:'🛡️', name:'Sangle de fer',      desc:'10 séances de gainage' },
  { id:'mobilite_10',   icon:'🧘', name:'Corps souple',       desc:'10 séances de mobilité complètes' },
];

// ── FONCTIONS UTILITAIRES ─────────────────────────────────────────────────────

function calcORM(kg, reps) {
  if (!kg || !reps || reps <= 0) return 0;
  return Math.round(kg * (1 + reps / 30));
}

function getSmartWeight(exo, cache, week) {
  if (!exo.refKpi) return null;
  const heavyDay = Object.keys(PROGRAM).find(dk =>
    PROGRAM[dk].exos && PROGRAM[dk].exos.some(e => e.id === exo.refKpi)
  );
  if (!heavyDay) return null;
  for (let w = week; w >= 1; w--) {
    const kg = cache[`${w}_${heavyDay}_${exo.refKpi}_0_kg`];
    if (kg && parseFloat(kg) > 0)
      return Math.round(parseFloat(kg) * 0.70 / 2.5) * 2.5;
  }
  return null;
}

function calcProgression(exo, kg, reps) {
  if (!kg || !reps) return null;
  const isTopBO = exo.series?.some(s => s.isTop);
  if (isTopBO && parseInt(reps) > 8) return Math.round((parseFloat(kg) + 2.5) * 10) / 10;
  if (!isTopBO && parseInt(reps) > 15) return Math.round((parseFloat(kg) + 2.5) * 10) / 10;
  return null;
}

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

function getTodayDayKey() {
  const dow = new Date().getDay();
  const map = { 1:'lundi', 2:'mardi', 3:'mercredi', 4:'jeudi', 5:'vendredi', 6:'samedi', 0:'dimanche' };
  return map[dow] || 'lundi';
}
