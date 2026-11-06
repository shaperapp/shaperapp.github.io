/* Ritmiq · inglês e espanhol, e botão de transmitir para a TV
   Idioma em S.lang ("pt", "en" ou "es"). Traduz os nomes dos exercícios, a voz do treinador e os
   textos principais da tela (abas, títulos, botões, player). O passo a passo dos exercícios e
   alguns textos longos continuam em português. Primeiro uso: segue o idioma do celular. */
(function () {
  "use strict";
  const LANGS = [["pt", "🇧🇷 Português"], ["en", "🇺🇸 English"], ["es", "🇪🇸 Español"]];
  if (!S.lang) { const n = (navigator.language || "pt").toLowerCase(); S.lang = n.startsWith("es") ? "es" : n.startsWith("en") ? "en" : "pt"; save(); }
  const L = () => (S.lang === "en" ? 0 : S.lang === "es" ? 1 : -1);

  /* ---------- nomes dos exercícios: id | inglês | espanhol ---------- */
  const NAMES = `Crunches|Crunches|Abdominales
Tuck_Crunch|Tuck crunch|Abdominal encogido
Toe_Touchers|Toe touches|Toque de pies
Reverse_Crunch|Reverse crunch|Abdominal inverso
Bent-Knee_Hip_Raise|Bent-knee hip raise|Elevación de cadera
Scissor_Kick|Scissor kicks|Tijeras
Leg_Pull-In|Leg pull-in|Encogimiento de piernas
Air_Bike|Bicycle crunch|Abdominal bicicleta
Russian_Twist|Russian twist|Giro ruso
Oblique_Crunches_-_On_The_Floor|Oblique crunch|Abdominal oblicuo
Alternate_Heel_Touchers|Heel touches|Toque de talones
Cross-Body_Crunch|Cross-body crunch|Abdominal cruzado
Elbow_to_Knee|Elbow to knee|Codo a rodilla
Jackknife_Sit-Up|Jackknife sit-up|Abdominal navaja
Cocoons|Cocoons|Capullo
Plank|Plank|Plancha
Side_Bridge|Side plank|Plancha lateral
Butt-Ups|Butt-ups|Plancha con cadera
Spider_Crawl|Spider crawl|Plancha araña
Dead_Bug|Dead bug|Bicho muerto
Stomach_Vacuum|Stomach vacuum|Vacío abdominal
Mountain_Climbers|Mountain climbers|Escaladores
Star_Jump|Star jump|Salto estrella
Freehand_Jump_Squat|Jump squat|Sentadilla con salto
Knee_Tuck_Jump|Tuck jump|Salto con rodillas
Bodyweight_Squat|Squat|Sentadilla
Pushups|Push-ups|Flexiones
Superman|Superman|Superman
Butt_Lift_Bridge|Glute bridge|Puente de glúteos
Standing_Lateral_Stretch|Side stretch|Estiramiento lateral
Lower_Back_Curl|Back extension|Extensión lumbar
walk|Walk|Caminata
Lunge|Lunge|Zancada
Sumo_Squat|Sumo squat|Sentadilla sumo
Donkey_Kick|Donkey kick|Patada de burro
Fire_Hydrant|Fire hydrant|Hidrante
Wall_Sit|Wall sit|Sentadilla en pared
Calf_Raise|Calf raise|Elevación de talones
Wide_Pushup|Wide push-up|Flexión abierta
Incline_Pushup|Incline push-up|Flexión inclinada
Diamond_Pushup|Diamond push-up|Flexión diamante
Tricep_Dip|Triceps dip|Fondos de tríceps
Burpee|Burpee|Burpee
High_Knees|High knees|Rodillas arriba
Bulgarian_Split_Squat|Bulgarian split squat|Sentadilla búlgara
Reverse_Lunge|Reverse lunge|Zancada atrás
Side_Lunge|Side lunge|Zancada lateral
Curtsy_Lunge|Curtsy lunge|Zancada cruzada
Walking_Lunge|Walking lunge|Zancada caminando
Jump_Lunge|Jump lunge|Zancada con salto
Step_Up|Step-up|Subida al banco
Pistol_Squat|Pistol squat|Sentadilla a una pierna
Goblet_Squat|Goblet squat|Sentadilla goblet
Romanian_Deadlift|Romanian deadlift|Peso muerto rumano
Single_Leg_Deadlift|Single-leg deadlift|Peso muerto a una pierna
Squat_Pulse|Squat pulses|Sentadilla con pulsos
Skater_Jump|Skater jump|Salto de patinador
Single_Leg_Calf_Raise|Single-leg calf raise|Talón a una pierna
Cossack_Squat|Cossack squat|Sentadilla cosaca
Lateral_Band_Walk|Lateral band walk|Paso lateral con banda
Box_Jump|Box jump|Salto al cajón
Broad_Jump|Broad jump|Salto largo
Single_Leg_Glute_Bridge|Single-leg glute bridge|Puente a una pierna
Hip_Thrust|Hip thrust|Hip thrust
Frog_Pump|Frog pumps|Puente mariposa
Clamshell|Clamshell|Almeja
Side_Lying_Leg_Raise|Side-lying leg raise|Elevación lateral tumbado
Standing_Glute_Kickback|Standing glute kickback|Patada de glúteo de pie
Good_Morning|Good morning|Buenos días
Donkey_Kick_Pulse|Donkey kick pulses|Patada de burro con pulsos
Knee_Pushup|Knee push-up|Flexión de rodillas
Decline_Pushup|Decline push-up|Flexión declinada
Archer_Pushup|Archer push-up|Flexión arquero
Clap_Pushup|Clap push-up|Flexión con palmada
Hindu_Pushup|Hindu push-up|Flexión hindú
Spiderman_Pushup|Spiderman push-up|Flexión Spiderman
Dumbbell_Floor_Press|Dumbbell floor press|Press en suelo con mancuerna
Dumbbell_Fly|Dumbbell fly|Aperturas con mancuerna
Pike_Pushup|Pike push-up|Flexión pike
Pull_Up|Pull-up|Dominadas
Chin_Up|Chin-up|Dominadas supinas
Inverted_Row|Inverted row|Remo invertido
Dumbbell_Row|Dumbbell row|Remo con mancuerna
Band_Pull_Apart|Band pull-apart|Aperturas con banda
Reverse_Snow_Angel|Reverse snow angel|Ángel invertido
Bird_Dog|Bird dog|Perro de caza
Prone_YTW|Prone Y-T-W|Y-T-W boca abajo
Prone_Swimmer|Prone swimmer|Nadador
Dumbbell_Shoulder_Press|Dumbbell shoulder press|Press de hombros con mancuerna
Lateral_Raise|Lateral raise|Elevación lateral
Front_Raise|Front raise|Elevación frontal
Rear_Delt_Fly|Rear delt fly|Pájaro
Arm_Circles|Arm circles|Círculos de brazos
Wall_Handstand|Wall handstand|Pino en la pared
Plank_Shoulder_Tap|Plank shoulder taps|Plancha con toque de hombro
Bicep_Curl|Biceps curl|Curl de bíceps
Hammer_Curl|Hammer curl|Curl martillo
Overhead_Tricep_Extension|Overhead triceps extension|Extensión de tríceps
Tricep_Kickback|Triceps kickback|Patada de tríceps
Concentration_Curl|Concentration curl|Curl concentrado
V_Up|V-up|Abdominal en V
Hollow_Hold|Hollow hold|Canoa
Hollow_Rock|Hollow rock|Canoa balanceo
Flutter_Kick|Flutter kicks|Patadas alternas
Lying_Leg_Raise|Lying leg raise|Elevación de piernas
Hanging_Knee_Raise|Hanging knee raise|Rodillas a la barra
Sit_Up|Sit-up|Abdominal completo
Windshield_Wiper|Windshield wipers|Limpiaparabrisas
Plank_Hip_Dip|Plank hip dips|Plancha con giro de cadera
Side_Plank_Dip|Side plank dips|Plancha lateral con elevación
Woodchopper|Woodchopper|Leñador
Standing_Oblique_Crunch|Standing oblique crunch|Oblicuo de pie
Cross_Mountain_Climber|Cross mountain climber|Escalador cruzado
Plank_Jack|Plank jacks|Plancha con saltos
Plank_Up_Down|Plank up-downs|Plancha arriba y abajo
Reverse_Plank|Reverse plank|Plancha invertida
Bear_Plank|Bear plank|Plancha del oso
Bear_Crawl|Bear crawl|Paso del oso
Heel_Tap_Crunch|Heel tap crunch|Abdominal con toque de talón
Crunch_Kick|Crunch kicks|Abdominal con patada
Jumping_Jack|Jumping jacks|Saltos de tijera
Butt_Kicks|Butt kicks|Talones al glúteo
Jump_Rope|Jump rope|Saltar la cuerda
Shadow_Boxing|Shadow boxing|Boxeo de sombra
Inchworm|Inchworm|Gusano
Lateral_Shuffle|Lateral shuffle|Desplazamiento lateral
Squat_Thrust|Squat thrust|Sentadilla con plancha
Seal_Jack|Seal jacks|Saltos de foca
Fast_Feet|Fast feet|Pies rápidos
Kettlebell_Swing|Kettlebell swing|Swing con pesa rusa
Dumbbell_Thruster|Dumbbell thruster|Thruster con mancuerna
Burpee_Pushup|Burpee with push-up|Burpee con flexión
Cat_Cow|Cat-cow|Gato-vaca
Childs_Pose|Child's pose|Postura del niño
Cobra_Stretch|Cobra stretch|Cobra
Downward_Dog|Downward dog|Perro boca abajo
Hip_Flexor_Stretch|Hip flexor stretch|Estiramiento de cadera
Hamstring_Stretch|Hamstring stretch|Estiramiento de isquios
Pigeon_Pose|Pigeon pose|Paloma
Worlds_Greatest_Stretch|World's greatest stretch|El mejor estiramiento del mundo
Thread_The_Needle|Thread the needle|Enhebrar la aguja
Quad_Stretch|Quad stretch|Estiramiento de cuádriceps
Figure_Four_Stretch|Figure-four stretch|Estiramiento de glúteo
Supine_Twist|Supine twist|Torsión tumbado
Butterfly_Stretch|Butterfly stretch|Mariposa
Cross_Body_Shoulder_Stretch|Shoulder stretch|Estiramiento de hombro
Chest_Stretch|Chest stretch|Estiramiento de pecho
Neck_Stretch|Neck stretch|Estiramiento de cuello
Calf_Stretch|Calf stretch|Estiramiento de pantorrilla
Deep_Squat_Hold|Deep squat hold|Sentadilla profunda`;
  const N = {}; NAMES.split("\n").forEach(l => { const [id, en, es] = l.split("|"); N[id] = [en, es]; });
  Object.keys(EX).forEach(id => { if (EX[id].n0 == null) EX[id].n0 = EX[id].n; });
  function names() { const i = L(); Object.keys(EX).forEach(id => { const e = EX[id]; e.n = i < 0 || !N[id] ? e.n0 : N[id][i]; }); }

  /* ---------- textos da tela: pt → [en, es] ---------- */
  const D = {
    "Início": ["Home", "Inicio"], "Treino": ["Workout", "Entreno"], "Feed": ["Feed", "Feed"], "Ranking": ["Ranking", "Ranking"], "Grupo": ["Group", "Grupo"], "Mais": ["More", "Más"],
    "Timer": ["Timer", "Temporizador"], "Progresso": ["Progress", "Progreso"], "Dieta": ["Diet", "Dieta"], "Ajustes": ["Settings", "Ajustes"], "Admin": ["Admin", "Admin"],
    "Bom dia,": ["Good morning,", "Buenos días,"], "Boa tarde,": ["Good afternoon,", "Buenas tardes,"], "Boa noite,": ["Good evening,", "Buenas noches,"],
    "Atalhos": ["Shortcuts", "Atajos"], "Treinar": ["Train", "Entrenar"], "Peso": ["Weight", "Peso"], "Treino de hoje": ["Today's workout", "Entreno de hoy"],
    "Começar treino": ["Start workout", "Empezar entreno"], "Treinar de novo": ["Train again", "Entrenar de nuevo"], "Concluído hoje": ["Done today", "Hecho hoy"],
    "Versão leve": ["Light version", "Versión ligera"], "Datas do programa": ["Program dates", "Fechas del programa"], "Dica do dia": ["Tip of the day", "Consejo del día"],
    "Plano semanal": ["Weekly plan", "Plan semanal"], "Fazer este treino": ["Do this workout", "Hacer este entreno"], "Exercícios": ["Exercises", "Ejercicios"],
    "Programas": ["Programs", "Programas"], "Seu programa": ["Your program", "Tu programa"], "Começar programa": ["Start program", "Empezar programa"], "Sair do programa": ["Leave program", "Salir del programa"],
    "Repetir programa": ["Repeat program", "Repetir programa"], "Fazer descanso ativo": ["Do active rest", "Hacer descanso activo"],
    "Descanso": ["Rest", "Descanso"], "Aquecimento": ["Warm-up", "Calentamiento"], "Prepare-se": ["Get ready", "Prepárate"], "Volta à calma": ["Cool-down", "Vuelta a la calma"],
    "Descanso entre voltas": ["Rest between rounds", "Descanso entre rondas"], "Recuperação": ["Recovery", "Recuperación"], "a seguir": ["up next", "a continuación"],
    "Pausar": ["Pause", "Pausa"], "Continuar": ["Resume", "Continuar"], "Começar": ["Start", "Empezar"], "Iniciar": ["Start", "Iniciar"], "Reiniciar": ["Restart", "Reiniciar"],
    "Sair do treino?": ["Leave workout?", "¿Salir del entreno?"], "Sair": ["Leave", "Salir"], "Treino concluído": ["Workout complete", "Entreno completado"],
    "Como foi o treino?": ["How was the workout?", "¿Qué tal el entreno?"], "Fácil": ["Easy", "Fácil"], "Na medida": ["Just right", "Justo"], "Pesado": ["Hard", "Duro"], "Fechar": ["Close", "Cerrar"],
    "Como fazer": ["How to do it", "Cómo hacerlo"], "Seu histórico": ["Your history", "Tu historial"], "Novo recorde!": ["New record!", "¡Nuevo récord!"],
    "Peso e cintura": ["Weight and waist", "Peso y cintura"], "Registrar hoje": ["Log today", "Registrar hoy"], "Fotos de progresso": ["Progress photos", "Fotos de progreso"],
    "Frente": ["Front", "Frente"], "Lado": ["Side", "Lado"], "Costas": ["Back", "Espalda"], "Conquistas": ["Achievements", "Logros"], "Histórico": ["History", "Historial"],
    "Músculos da semana": ["Muscles this week", "Músculos de la semana"], "Resumo da semana": ["Weekly summary", "Resumen semanal"],
    "dias treinados": ["days trained", "días entrenados"], "em sequência": ["day streak", "días seguidos"], "kg desde o início": ["kg since start", "kg desde el inicio"],
    "dias p/ meta": ["days to goal", "días para la meta"], "do plano feito": ["of plan done", "del plan hecho"], "kg atual": ["kg now", "kg actual"],
    "Meta diária": ["Daily target", "Meta diaria"], "kcal por dia": ["kcal per day", "kcal por día"], "proteína": ["protein", "proteína"], "carboidrato": ["carbs", "carbohidratos"], "gordura": ["fat", "grasa"],
    "Hoje": ["Today", "Hoy"], "Proteína": ["Protein", "Proteína"], "Água": ["Water", "Agua"], "Calorias": ["Calories", "Calorías"], "Carbo": ["Carbs", "Carbos"], "Gordura": ["Fat", "Grasa"],
    "Refeições de hoje": ["Today's meals", "Comidas de hoy"], "Café da manhã": ["Breakfast", "Desayuno"], "Almoço": ["Lunch", "Almuerzo"], "Lanche": ["Snack", "Merienda"], "Jantar": ["Dinner", "Cena"],
    "+ Adicionar": ["+ Add", "+ Añadir"], "Adicionar": ["Add", "Añadir"], "Cardápio de hoje": ["Today's menu", "Menú de hoy"], "Lista de compras da semana": ["Weekly shopping list", "Lista de compras semanal"],
    "Regras para secar": ["Fat-loss rules", "Reglas para definir"], "Desfazer": ["Undo", "Deshacer"],
    "Notificações": ["Notifications", "Notificaciones"], "Som e voz": ["Sound and voice", "Sonido y voz"], "Demonstração": ["Demo", "Demostración"], "Perfil": ["Profile", "Perfil"],
    "Backup": ["Backup", "Copia de seguridad"], "Sobre": ["About", "Acerca de"], "Aparência": ["Appearance", "Apariencia"], "Idioma": ["Language", "Idioma"],
    "Backup na nuvem": ["Cloud backup", "Copia en la nube"], "Fazer backup agora": ["Back up now", "Copiar ahora"], "Restaurar": ["Restore", "Restaurar"],
    "Salvar perfil": ["Save profile", "Guardar perfil"], "Idade": ["Age", "Edad"], "Sexo": ["Sex", "Sexo"], "Masculino": ["Male", "Masculino"], "Feminino": ["Female", "Femenino"],
    "Altura (cm)": ["Height (cm)", "Altura (cm)"], "Peso inicial (kg)": ["Starting weight (kg)", "Peso inicial (kg)"], "Meta de peso (kg)": ["Goal weight (kg)", "Peso meta (kg)"],
    "Voz do treinador": ["Coach voice", "Voz del entrenador"], "Testar alarme": ["Test alarm", "Probar alarma"], "Testar voz": ["Test voice", "Probar voz"],
    "Convidar amigos": ["Invite friends", "Invitar amigos"], "Ver o tutorial": ["See the tutorial", "Ver el tutorial"],
    "Passos do dia": ["Steps today", "Pasos del día"], "Ativar contador de passos": ["Turn on step counter", "Activar contador de pasos"],
    "Antes e depois": ["Before and after", "Antes y después"], "Compartilhar": ["Share", "Compartir"], "Postar no Feed": ["Post to Feed", "Publicar en el Feed"],
    "Transmitir para a TV": ["Cast to TV", "Transmitir a la TV"], "Novo post": ["New post", "Nueva publicación"]
  };
  const R = [
    [/^Dia (\d+) de 90$/, "Day $1 of 90", "Día $1 de 90"], [/^Dia (\d+)$/, "Day $1", "Día $1"], [/^Exercício (\d+) de (\d+)$/, "Exercise $1 of $2", "Ejercicio $1 de $2"],
    [/^Volta (\d+) de (\d+)$/, "Round $1 of $2", "Ronda $1 de $2"], [/^Fase (\d+) · (.+)$/, "Phase $1 · $2", "Fase $1 · $2"], [/^(\d+) treinos$/, "$1 workouts", "$1 entrenos"],
    [/^Fazer o dia (\d+)$/, "Do day $1", "Hacer el día $1"], [/^Nível (\d+)$/, "Level $1", "Nivel $1"], [/^Dia (\d+) · (.+)$/, "Day $1 · $2", "Día $1 · $2"],
    [/^Missão diária · (.+)$/i, "Daily mission · $1", "Misión diaria · $1"], [/^Chefe disponível$/i, "Boss available", "Jefe disponible"], [/^feito$/, "done", "hecho"],
    [/^Enfrentar ›$/, "Fight ›", "Enfrentar ›"], [/^(\d+) exercícios$/, "$1 exercises", "$1 ejercicios"], [/^~(\d+) min$/, "~$1 min", "~$1 min"], [/^(\d+) passos hoje$/, "$1 steps today", "$1 pasos hoy"], [/^Depois:$/, "Next:", "Después:"]
  ];
  const RX = [[/segundos/g, "seconds", "segundos"], [/minutos/g, "minutes", "minutos"], [/meta ~/g, "target ~", "meta ~"], [/repetições/g, "reps", "repeticiones"],
    [/última:/g, "last:", "última:"], [/recorde:/g, "record:", "récord:"], [/troca de lado na metade/g, "switch sides halfway", "cambia de lado a la mitad"],
    [/⬆ meta subiu/g, "⬆ target up", "⬆ meta subió"], [/carga:/g, "load:", "carga:"]];
  function tr(s) {
    const i = L(); if (i < 0 || !s) return s;
    const t = s.trim(); if (!t) return s;
    if (D[t]) return s.replace(t, D[t][i]);
    for (const r of R) if (r[0].test(t)) return s.replace(t, t.replace(r[0], r[1 + i]));
    // linha da receita do exercício: "30 segundos · meta ~15 repetições · última: 15"
    if (/\d+ (segundos|minutos)\b/.test(t)) { let x = s; RX.forEach(r => { x = x.replace(r[0], r[1 + i]); }); return x; }
    return s;
  }
  window.tr = tr;
  function walk(root) {
    if (L() < 0 || !root) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = it.nextNode())) { const v = n.nodeValue, t = tr(v); if (t !== v) n.nodeValue = t; }
    root.querySelectorAll && root.querySelectorAll("[placeholder],[aria-label]").forEach(e => {
      ["placeholder", "aria-label"].forEach(a => { const v = e.getAttribute(a); if (v) { const t = tr(v); if (t !== v) e.setAttribute(a, t); } });
    });
  }
  let queued = false;
  const mo = new MutationObserver(() => { if (queued || L() < 0) return; queued = true; requestAnimationFrame(() => { queued = false; mo.disconnect(); walk(document.body); watch(); }); });
  const watch = () => mo.observe(document.body, { childList: true, subtree: true, characterData: true });

  /* ---------- voz e avisos ---------- */
  const V = [[/Descanso entre voltas/g, "Rest between rounds", "Descanso entre rondas"], [/Descanso/g, "Rest", "Descanso"], [/Próximo:/g, "Next:", "Siguiente:"],
    [/Meta de (\d+) repetições/g, "Target $1 reps", "Meta de $1 repeticiones"], [/Troque de lado na metade/g, "Switch sides halfway", "Cambia de lado a la mitad"], [/Troque de lado/g, "Switch sides", "Cambia de lado"],
    [/Faltam 10 segundos/g, "10 seconds left", "Faltan 10 segundos"], [/Metade! Continue firme/g, "Halfway! Keep going", "¡Mitad! Sigue así"], [/Treino concluído\. Mandou bem!/g, "Workout complete. Great job!", "Entreno completado. ¡Muy bien!"],
    [/Timer concluído\. Mandou bem!/g, "Timer done. Great job!", "Temporizador terminado. ¡Muy bien!"], [/Novo recorde!/g, "New record!", "¡Nuevo récord!"], [/Volta (\d+)\. Vai!/g, "Round $1. Go!", "Ronda $1. ¡Vamos!"],
    [/Vai!/g, "Go!", "¡Vamos!"], [/(\d+) segundos/g, "$1 seconds", "$1 segundos"], [/(\d+) minutos/g, "$1 minutes", "$1 minutos"], [/1 minuto/g, "1 minute", "1 minuto"], [/ e /g, " and ", " y "]];
  const _say = say;
  say = function (t) { const i = L(); if (i >= 0 && t) V.forEach(r => { t = t.replace(r[0], r[1 + i]); }); _say(t); };
  const _toast = toast;
  toast = function (m) { _toast(tr(m)); };

  /* ---------- escolher idioma nos Ajustes ---------- */
  function apply() {
    names(); nat("setVoiceLang", S.lang);
    document.documentElement.lang = S.lang === "en" ? "en" : S.lang === "es" ? "es" : "pt-BR";
    if (L() >= 0) { walk(document.body); watch(); } else mo.disconnect();
  }
  const _aj = vAjustes;
  vAjustes = function () {
    const h = _aj(), k = h.indexOf('<div class="sec"><div class="sechead"><h3>Notificações');
    const box = '<div class="sec"><div class="sechead"><h3>Idioma</h3><span>Language</span></div><div class="card" style="padding-block:4px"><div class="setrow wr"><div style="width:100%"><div class="wr-chips">' +
      LANGS.map(([c, l]) => '<button data-lang="' + c + '" aria-pressed="' + (S.lang === c) + '">' + l + '</button>').join("") + '</div><span class="note" style="margin-top:6px">' +
      (S.lang === "pt" ? "Inglês e espanhol traduzem a tela principal, os nomes dos exercícios e a voz. O passo a passo dos exercícios fica em português." : S.lang === "en" ? "Main screens, exercise names and the coach voice are in English. Step-by-step instructions are still in Portuguese." : "Pantallas principales, nombres de ejercicios y la voz en español. Los pasos de cada ejercicio siguen en portugués.") + '</span></div></div></div></div>';
    return k < 0 ? h + box : h.slice(0, k) + box + h.slice(k);
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-lang]");
    if (b) { S.lang = b.dataset.lang; save(); apply(); render(); return; }
    if (e.target.closest("[data-cast]")) nat("castToTv");
  });

  /* ---------- transmitir o treino para a TV ---------- */
  const _rp = renderPlayer;
  renderPlayer = function () {
    _rp();
    if (!NATIVE || !PL || PL.fin) return;
    const info = $("#plInfo"); if (info && !$("#plCast")) info.insertAdjacentHTML("beforebegin", '<button class="roundbtn" id="plCast" data-cast aria-label="Transmitir para a TV" title="Transmitir para a TV" style="margin-left:auto;width:40px;height:40px">📺</button>');
    if (info) info.style.marginLeft = "0";
  };
  const TV = '<button class="mx-invite mx-tv" data-cast><span>📺</span><div><b>Transmitir para a TV</b><small>Espelhe o treino na Smart TV ou Chromecast para ver o vídeo grande.</small></div><i>↗</i></button>';
  if (window.EXTRA_VIEWS && EXTRA_VIEWS.mais) { const _m = EXTRA_VIEWS.mais; EXTRA_VIEWS.mais = function () { const h = _m(); return NATIVE ? h.replace('<button class="mx-invite" data-invite>', TV + '<button class="mx-invite" data-invite>') : h; }; }

  apply();
})();
