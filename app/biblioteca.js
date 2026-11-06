/* Shaper · biblioteca de exercícios
   Exercícios extras (com e sem equipamento) somados aos do app. Cada um tem grupo muscular,
   equipamento, passo a passo, dica, pose do boneco animado (mq) e um vídeo demonstrativo
   (videos.js, de canais diferentes do YouTube, com o nome do canal nos créditos).
   Linha: [id, nome, músculos, grupo, equipamento, pose, busca do vídeo, passos (|), dica, lados] */
(function () {
  "use strict";
  const L = [
    // ---------- Pernas ----------
    ["Bulgarian_Split_Squat", "Agachamento búlgaro", "Coxas e glúteos", "Pernas", "banco", "lunge", "bulgarian split squat bodyweight how to", "Pé de trás apoiado num banco ou sofá.|Desça o quadril até a coxa da frente ficar paralela ao chão.|Suba empurrando com o pé da frente.", "Tronco levemente inclinado à frente ativa mais o glúteo.", 1],
    ["Reverse_Lunge", "Afundo para trás", "Coxas e glúteos", "Pernas", "", "lunge", "reverse lunge exercise how to", "Em pé, dê um passo largo para trás.|Desça até os dois joelhos ficarem a 90°.|Volte à posição inicial e troque a perna.", "Mais fácil para o joelho que o afundo para a frente."],
    ["Side_Lunge", "Afundo lateral", "Coxas, adutores e glúteos", "Pernas", "", "squat", "side lunge lateral lunge how to", "Em pé, dê um passo largo para o lado.|Dobre o joelho desse lado levando o quadril para trás.|Empurre o chão e volte ao centro.", "A perna de apoio fica esticada e o pé inteiro no chão.", 1],
    ["Curtsy_Lunge", "Afundo cruzado", "Glúteos e coxas", "Pernas", "", "lunge", "curtsy lunge how to", "Em pé, cruze uma perna para trás da outra.|Desça como numa reverência.|Volte e troque o lado.", "Quadril de frente, sem girar o tronco."],
    ["Walking_Lunge", "Afundo caminhando", "Coxas e glúteos", "Pernas", "", "lunge", "walking lunge proper form", "Dê um passo largo à frente e desça.|Suba trazendo a perna de trás para a frente.|Continue andando, alternando as pernas.", "Passos firmes e tronco reto."],
    ["Jump_Lunge", "Afundo com salto", "Pernas e cardio", "Pernas", "", "jumpsquat", "jumping lunge exercise how to", "Comece em posição de afundo.|Salte e troque as pernas no ar.|Aterrisse suave já em afundo.", "Versão leve: troque as pernas sem saltar."],
    ["Step_Up", "Subida no banco", "Coxas e glúteos", "Pernas", "banco", "lunge", "step up exercise how to", "Apoie um pé inteiro num degrau firme.|Suba empurrando com esse pé.|Desça devagar e repita.", "Não dê impulso com o pé de baixo.", 1],
    ["Pistol_Squat", "Agachamento unilateral", "Coxas e equilíbrio", "Pernas", "", "squat", "pistol squat progression beginner", "Em pé numa perna, a outra esticada à frente.|Desça devagar o máximo que conseguir.|Suba controlando.", "Comece segurando num batente ou sentando numa cadeira.", 1],
    ["Goblet_Squat", "Agachamento com halter", "Pernas e glúteos", "Pernas", "halter", "squat", "goblet squat how to", "Segure um halter junto ao peito.|Desça com os cotovelos entre os joelhos.|Suba empurrando o chão.", "Peito aberto e calcanhares no chão."],
    ["Romanian_Deadlift", "Levantamento terra romeno", "Posterior de coxa e glúteos", "Pernas", "halter", "stand", "dumbbell romanian deadlift form", "Halteres à frente das coxas, joelhos levemente dobrados.|Leve o quadril para trás descendo os pesos rente às pernas.|Suba contraindo os glúteos.", "Costas sempre retas; o movimento é do quadril."],
    ["Single_Leg_Deadlift", "Terra com uma perna", "Posterior, glúteos e equilíbrio", "Pernas", "", "stand", "single leg deadlift bodyweight how to", "Em pé numa perna.|Incline o tronco à frente levando a outra perna para trás.|Volte contraindo o glúteo.", "Quadril alinhado, sem abrir para o lado.", 1],
    ["Squat_Pulse", "Agachamento pulsado", "Coxas e glúteos", "Pernas", "", "squat", "squat pulses exercise", "Desça em agachamento.|Suba e desça só alguns centímetros, sem levantar.|Mantenha o ritmo.", "Queima bastante: respire fundo."],
    ["Skater_Jump", "Salto do patinador", "Pernas, glúteos e cardio", "Cardio", "", "jumpsquat", "skater jumps exercise how to", "Salte para o lado aterrissando numa perna.|Leve a outra perna cruzada para trás.|Salte para o outro lado.", "Aterrisse com o joelho macio."],
    ["Single_Leg_Calf_Raise", "Panturrilha unilateral", "Panturrilhas", "Pernas", "", "calf", "single leg calf raise how to", "Em pé numa perna, apoiado numa parede.|Suba na ponta do pé.|Desça devagar.", "Num degrau, desça o calcanhar abaixo da borda.", 1],
    ["Cossack_Squat", "Agachamento cossaco", "Adutores, coxas e mobilidade", "Pernas", "", "squat", "cossack squat how to", "Pés bem afastados.|Desça para um lado, a outra perna esticada com a ponta para cima.|Passe para o outro lado.", "Vá só até onde a mobilidade deixa."],
    ["Lateral_Band_Walk", "Caminhada lateral com elástico", "Glúteo médio", "Glúteos", "elástico", "squat", "lateral band walk how to", "Elástico acima dos joelhos ou nos tornozelos.|Semiagachado, dê passos para o lado.|Volte para o outro lado.", "Não deixe os joelhos caírem para dentro."],
    ["Box_Jump", "Salto na caixa", "Pernas e explosão", "Cardio", "banco", "jumpsquat", "box jump how to beginner", "De frente para um degrau firme e baixo.|Salte com os dois pés e aterrisse em cima.|Desça andando.", "Comece baixo; segurança em primeiro lugar."],
    ["Broad_Jump", "Salto à frente", "Pernas e explosão", "Cardio", "", "jumpsquat", "broad jump exercise how to", "Pés na largura do quadril.|Balance os braços e salte o mais longe possível.|Aterrisse agachado e volte.", "Aterrisse com joelhos dobrados."],
    // ---------- Glúteos ----------
    ["Single_Leg_Glute_Bridge", "Ponte com uma perna", "Glúteos e posterior", "Glúteos", "", "bridge", "single leg glute bridge how to", "Deitado, um pé no chão e a outra perna esticada.|Eleve o quadril empurrando com o calcanhar.|Desça devagar.", "Quadril reto, sem cair para o lado.", 1],
    ["Hip_Thrust", "Elevação pélvica no banco", "Glúteos", "Glúteos", "banco", "bridge", "hip thrust bodyweight bench how to", "Costas apoiadas na borda de um sofá ou banco.|Eleve o quadril até o tronco ficar reto.|Segure 1 segundo e desça.", "Queixo para baixo e costelas fechadas."],
    ["Frog_Pump", "Ponte borboleta", "Glúteos", "Glúteos", "", "bridge", "frog pumps glute exercise", "Deitado, solas dos pés juntas e joelhos abertos.|Eleve o quadril apertando os glúteos.|Desça e repita rápido.", "Ótimo para ativar o glúteo antes do treino."],
    ["Clamshell", "Concha", "Glúteo médio", "Glúteos", "", "hydrant", "clamshell exercise how to", "Deitado de lado, joelhos dobrados.|Abra o joelho de cima mantendo os pés juntos.|Feche devagar.", "Quadril parado; com elástico fica mais forte.", 1],
    ["Side_Lying_Leg_Raise", "Elevação lateral deitado", "Glúteo médio e quadril", "Glúteos", "", "hydrant", "side lying leg raise how to", "Deitado de lado, pernas esticadas.|Eleve a perna de cima.|Desça devagar sem encostar.", "Ponta do pé levemente para baixo.", 1],
    ["Standing_Glute_Kickback", "Coice em pé", "Glúteos", "Glúteos", "elástico", "stand", "standing glute kickback resistance band", "Em pé, apoiado numa parede.|Leve uma perna esticada para trás.|Volte controlando.", "Não arqueie a lombar.", 1],
    ["Good_Morning", "Bom dia", "Posterior e lombar", "Glúteos", "", "stand", "bodyweight good morning exercise", "Em pé, mãos atrás da cabeça.|Incline o tronco à frente levando o quadril para trás.|Volte contraindo glúteos.", "Joelhos levemente dobrados, costas retas."],
    ["Donkey_Kick_Pulse", "Coice pulsado", "Glúteos", "Glúteos", "", "donkey", "donkey kick pulses", "De quatro apoios, eleve uma perna dobrada.|Faça pequenos pulsos para cima.|Troque o lado na metade.", "Abdômen firme o tempo todo.", 1],
    // ---------- Peito ----------
    ["Knee_Pushup", "Flexão com joelhos", "Peito e tríceps (iniciante)", "Peito", "", "pushup", "knee push up proper form", "Mãos no chão e joelhos apoiados.|Desça o peito em direção ao chão.|Empurre de volta.", "Corpo reto dos joelhos à cabeça."],
    ["Decline_Pushup", "Flexão declinada", "Parte de cima do peito e ombros", "Peito", "banco", "pushup", "decline push up how to", "Pés num banco ou sofá, mãos no chão.|Desça o peito.|Empurre de volta.", "Abdômen firme para não arquear."],
    ["Archer_Pushup", "Flexão arqueiro", "Peito e braços (avançado)", "Peito", "", "pushup", "archer push up tutorial", "Mãos bem afastadas.|Desça o corpo para um lado, o outro braço esticado.|Suba e troque o lado.", "Passo para a flexão com um braço."],
    ["Clap_Pushup", "Flexão com palma", "Peito e explosão", "Peito", "", "pushup", "clap push up how to", "Desça como numa flexão.|Empurre forte e bata palma no ar.|Aterrisse com cotovelos macios.", "Só quando a flexão normal estiver fácil."],
    ["Hindu_Pushup", "Flexão hindu", "Peito, ombros e mobilidade", "Peito", "", "pushup", "hindu push up how to", "Comece em V invertido.|Desça o peito rente ao chão indo para a frente.|Termine olhando para cima e volte.", "Movimento fluido, como uma onda."],
    ["Spiderman_Pushup", "Flexão Homem-Aranha", "Peito, core e oblíquos", "Peito", "", "pushup", "spiderman push up how to", "Desça na flexão levando um joelho ao cotovelo.|Suba e volte a perna.|Troque o lado.", "Quadril baixo e estável."],
    ["Dumbbell_Floor_Press", "Supino no chão com halter", "Peito e tríceps", "Peito", "halter", "crunch", "dumbbell floor press how to", "Deitado, halteres acima do peito.|Desça até os cotovelos tocarem o chão.|Empurre para cima.", "Cotovelos a 45° do corpo."],
    ["Dumbbell_Fly", "Crucifixo com halter", "Peito", "Peito", "halter", "crunch", "dumbbell chest fly floor", "Deitado, braços abertos com halteres.|Feche os braços acima do peito.|Abra devagar.", "Cotovelos levemente dobrados."],
    ["Pike_Pushup", "Flexão pike", "Ombros e tríceps", "Ombros", "", "pushup", "pike push up how to", "Em V invertido, quadril alto.|Desça a cabeça em direção ao chão.|Empurre de volta.", "Prepara para a parada de mão."],
    // ---------- Costas ----------
    ["Pull_Up", "Barra fixa", "Costas e bíceps", "Costas", "barra", "stand", "pull up proper form beginner", "Segure a barra com as palmas para a frente.|Puxe até o queixo passar a barra.|Desça devagar.", "Sem conseguir? Faça só a descida bem lenta."],
    ["Chin_Up", "Barra supinada", "Costas e bíceps", "Costas", "barra", "stand", "chin up how to", "Segure a barra com as palmas para você.|Puxe até o queixo passar a barra.|Desça controlando.", "Ombros para baixo, longe das orelhas."],
    ["Inverted_Row", "Remada invertida", "Costas e bíceps", "Costas", "barra", "plank", "inverted row bodyweight table", "Deitado sob uma mesa firme ou barra baixa.|Puxe o peito até a borda.|Desça devagar.", "Corpo reto como numa prancha."],
    ["Dumbbell_Row", "Remada com halter", "Costas", "Costas", "halter", "stand", "one arm dumbbell row form", "Apoie uma mão e um joelho num banco.|Puxe o halter até a cintura.|Desça devagar.", "Puxe com o cotovelo, não com a mão.", 1],
    ["Band_Pull_Apart", "Abertura com elástico", "Costas altas e postura", "Costas", "elástico", "stand", "band pull apart how to", "Segure o elástico à frente, braços esticados.|Abra os braços até o elástico tocar o peito.|Volte devagar.", "Aperte as escápulas no final."],
    ["Reverse_Snow_Angel", "Anjo invertido", "Costas e postura", "Costas", "", "superman", "reverse snow angel exercise", "Deitado de bruços, braços ao lado do corpo.|Eleve o peito e leve os braços até acima da cabeça.|Volte pelo mesmo caminho.", "Polegares para cima."],
    ["Bird_Dog", "Perdigueiro", "Lombar e core", "Costas", "", "donkey", "bird dog exercise how to", "De quatro apoios.|Estenda um braço e a perna oposta.|Volte e troque.", "Coluna parada, como se houvesse um copo nas costas."],
    ["Prone_YTW", "Y-T-W deitado", "Costas altas e ombros", "Costas", "", "superman", "prone y t w exercise", "Deitado de bruços.|Eleve os braços em Y, depois em T, depois em W.|Desça e repita.", "Movimento lento e controlado."],
    ["Prone_Swimmer", "Nadador", "Lombar e glúteos", "Costas", "", "superman", "prone swimmers exercise", "Deitado de bruços, braços à frente.|Eleve braços e pernas.|Alterne braço e perna opostos como se nadasse.", "Olhe para o chão para proteger o pescoço."],
    // ---------- Ombros ----------
    ["Dumbbell_Shoulder_Press", "Desenvolvimento com halter", "Ombros e tríceps", "Ombros", "halter", "stand", "dumbbell shoulder press form", "Halteres na altura dos ombros.|Empurre para cima até esticar os braços.|Desça devagar.", "Abdômen firme, sem arquear."],
    ["Lateral_Raise", "Elevação lateral", "Ombros", "Ombros", "halter", "jack", "dumbbell lateral raise proper form", "Em pé, halteres ao lado do corpo.|Eleve os braços para os lados até a altura dos ombros.|Desça devagar.", "Peso leve e cotovelos levemente dobrados."],
    ["Front_Raise", "Elevação frontal", "Ombros", "Ombros", "halter", "stand", "dumbbell front raise how to", "Halteres à frente das coxas.|Eleve os braços à frente até a altura dos ombros.|Desça devagar.", "Sem balançar o tronco."],
    ["Rear_Delt_Fly", "Crucifixo invertido", "Ombros de trás e costas", "Ombros", "halter", "stand", "bent over rear delt fly dumbbell", "Tronco inclinado à frente, costas retas.|Abra os braços para os lados.|Desça devagar.", "Aperte as escápulas."],
    ["Arm_Circles", "Círculos com os braços", "Ombros e aquecimento", "Ombros", "", "jack", "arm circles exercise", "Braços abertos na altura dos ombros.|Faça círculos pequenos para a frente.|Na metade do tempo, inverta.", "Ótimo para aquecer."],
    ["Wall_Handstand", "Parada de mão na parede", "Ombros e core (avançado)", "Ombros", "", "plank", "wall walk handstand beginner", "De costas para a parede, mãos no chão.|Suba os pés pela parede.|Segure com o corpo reto.", "Só até onde se sentir seguro."],
    ["Plank_Shoulder_Tap", "Prancha com toque no ombro", "Core e ombros", "Abdômen", "", "plank", "plank shoulder taps how to", "Prancha alta, pés afastados.|Toque um ombro com a mão oposta.|Alterne sem balançar o quadril.", "Quanto mais afastados os pés, mais fácil."],
    // ---------- Braços ----------
    ["Bicep_Curl", "Rosca bíceps", "Bíceps", "Braços", "halter", "stand", "dumbbell bicep curl proper form", "Em pé, halteres ao lado do corpo.|Dobre os cotovelos subindo os pesos.|Desça devagar.", "Cotovelos colados ao corpo."],
    ["Hammer_Curl", "Rosca martelo", "Bíceps e antebraço", "Braços", "halter", "stand", "hammer curl how to", "Halteres com as palmas viradas uma para a outra.|Suba dobrando os cotovelos.|Desça devagar.", "Sem balançar o corpo."],
    ["Overhead_Tricep_Extension", "Tríceps francês", "Tríceps", "Braços", "halter", "stand", "overhead dumbbell tricep extension", "Segure um halter acima da cabeça com as duas mãos.|Desça atrás da cabeça dobrando os cotovelos.|Estenda de volta.", "Cotovelos apontando para a frente."],
    ["Tricep_Kickback", "Tríceps coice", "Tríceps", "Braços", "halter", "stand", "dumbbell tricep kickback form", "Tronco inclinado, cotovelo junto ao corpo.|Estenda o braço para trás.|Volte devagar.", "Só o antebraço se move.", 1],
    ["Concentration_Curl", "Rosca concentrada", "Bíceps", "Braços", "halter", "stand", "concentration curl how to", "Sentado, cotovelo apoiado na parte interna da coxa.|Suba o halter.|Desça devagar.", "Aperte o bíceps no alto.", 1],
    // ---------- Abdômen ----------
    ["V_Up", "Abdominal V", "Abdômen inteiro", "Abdômen", "", "vup", "v up exercise how to", "Deitado, braços acima da cabeça.|Suba braços e pernas juntos formando um V.|Desça devagar.", "Iniciante: dobre os joelhos."],
    ["Hollow_Hold", "Canoa", "Core profundo", "Abdômen", "", "vup", "hollow body hold how to", "Deitado, eleve ombros e pernas do chão.|Braços estendidos para trás.|Segure com a lombar colada no chão.", "Pernas mais altas deixa mais fácil."],
    ["Hollow_Rock", "Canoa balançando", "Core", "Abdômen", "", "vup", "hollow rock exercise", "Na posição de canoa.|Balance para a frente e para trás sem desmontar.|Mantenha o ritmo.", "O corpo é uma peça só."],
    ["Flutter_Kick", "Pernada", "Abdômen inferior", "Abdômen", "", "scissor", "flutter kicks exercise how to", "Deitado, mãos sob o quadril.|Eleve as pernas e bata como se nadasse.|Mantenha a lombar no chão.", "Pernas mais altas = mais fácil."],
    ["Lying_Leg_Raise", "Elevação de pernas", "Abdômen inferior", "Abdômen", "", "legpull", "lying leg raise proper form", "Deitado, pernas esticadas.|Suba as pernas até 90°.|Desça devagar sem encostar.", "Mãos sob o quadril protegem a lombar."],
    ["Hanging_Knee_Raise", "Elevação de joelhos na barra", "Abdômen inferior", "Abdômen", "barra", "stand", "hanging knee raise how to", "Pendurado na barra.|Suba os joelhos até o quadril.|Desça devagar sem balançar.", "Comece com poucas repetições."],
    ["Sit_Up", "Abdominal completo", "Abdômen", "Abdômen", "", "situp", "sit up proper form", "Deitado, joelhos dobrados, pés no chão.|Suba o tronco até sentar.|Desça devagar.", "Prenda os pés sob um sofá se precisar."],
    ["Windshield_Wiper", "Limpador de para-brisa", "Oblíquos", "Cintura", "", "legpull", "windshield wipers exercise floor", "Deitado, braços abertos e pernas para o alto.|Leve as pernas para um lado.|Passe para o outro lado.", "Ombros colados no chão."],
    ["Plank_Hip_Dip", "Prancha com giro de quadril", "Oblíquos", "Cintura", "", "plank", "plank hip dips how to", "Prancha nos antebraços.|Gire o quadril até quase tocar o chão de um lado.|Passe para o outro.", "Movimento controlado."],
    ["Side_Plank_Dip", "Prancha lateral com elevação", "Oblíquos", "Cintura", "", "sideplank", "side plank hip dips", "Em prancha lateral.|Desça o quadril até quase o chão.|Suba de novo.", "Troque o lado na metade.", 1],
    ["Woodchopper", "Lenhador", "Oblíquos e core", "Cintura", "halter", "twist", "dumbbell woodchopper exercise", "Segure um halter com as duas mãos ao lado do quadril.|Leve na diagonal até acima do ombro oposto.|Volte controlando.", "Gire os pés junto com o tronco.", 1],
    ["Standing_Oblique_Crunch", "Abdominal oblíquo em pé", "Oblíquos", "Cintura", "", "highknees", "standing oblique crunch", "Em pé, mãos atrás da cabeça.|Leve o joelho ao cotovelo do mesmo lado.|Alterne os lados.", "Ótimo para quem não pode deitar."],
    ["Cross_Mountain_Climber", "Escalador cruzado", "Oblíquos e cardio", "Cintura", "", "climber", "cross body mountain climbers", "Prancha alta.|Leve o joelho em direção ao cotovelo oposto.|Troque rapidamente.", "Quadril baixo."],
    ["Plank_Jack", "Prancha polichinelo", "Core e cardio", "Abdômen", "", "plank", "plank jacks exercise", "Prancha alta.|Abra e feche as pernas saltando.|Mantenha o quadril parado.", "Versão leve: um pé de cada vez."],
    ["Plank_Up_Down", "Prancha sobe e desce", "Core e braços", "Abdômen", "", "plank", "plank up downs exercise", "Prancha nos antebraços.|Suba para a prancha alta uma mão de cada vez.|Desça de novo.", "Alterne o braço que começa."],
    ["Reverse_Plank", "Prancha invertida", "Core, glúteos e ombros", "Abdômen", "", "dip", "reverse plank exercise", "Sentado, mãos atrás do quadril.|Eleve o quadril com o corpo reto.|Segure respirando.", "Olhe para o teto."],
    ["Bear_Plank", "Prancha do urso", "Core e ombros", "Abdômen", "", "crawl", "bear plank hold exercise", "De quatro apoios.|Tire os joelhos 2 cm do chão.|Segure.", "Costas retas e abdômen firme."],
    ["Bear_Crawl", "Andar de urso", "Corpo todo e core", "Cardio", "", "crawl", "bear crawl exercise how to", "De quatro, joelhos fora do chão.|Ande para a frente mão e pé opostos.|Volte para trás.", "Quadril baixo e passos curtos."],
    ["Heel_Tap_Crunch", "Abdominal com toque alternado", "Abdômen", "Abdômen", "", "heeltouch", "lying heel taps abs", "Deitado, joelhos dobrados.|Encolha os ombros e toque um calcanhar.|Alterne os lados.", "Ombros sempre fora do chão."],
    ["Crunch_Kick", "Abdominal com chute", "Abdômen inteiro", "Abdômen", "", "tuckcrunch", "crunch kicks exercise", "Sentado apoiado nas mãos.|Puxe os joelhos ao peito.|Estenda as pernas à frente.", "Não deixe os pés tocarem o chão."],
    // ---------- Cardio ----------
    ["Jumping_Jack", "Polichinelo", "Cardio", "Cardio", "", "jack", "jumping jacks proper form", "Em pé, braços ao lado do corpo.|Salte abrindo pernas e levando os braços acima da cabeça.|Volte e repita.", "Pise com a ponta dos pés."],
    ["Butt_Kicks", "Chute no glúteo", "Cardio e posterior", "Cardio", "", "highknees", "butt kicks exercise", "Corra no lugar.|Leve os calcanhares em direção ao glúteo.|Mexa os braços junto.", "Ritmo constante."],
    ["Jump_Rope", "Pular corda", "Cardio", "Cardio", "corda", "calf", "jump rope beginner tutorial", "Corda atrás do corpo.|Gire com os pulsos e pule baixinho.|Mantenha o ritmo.", "Sem corda: finja o movimento."],
    ["Shadow_Boxing", "Boxe no ar", "Cardio e ombros", "Cardio", "", "stand", "shadow boxing for beginners", "Base firme, mãos protegendo o rosto.|Solte socos rápidos: direto, cruzado e gancho.|Movimente os pés.", "Gire o quadril em cada soco."],
    ["Inchworm", "Lagarta", "Corpo todo e alongamento", "Cardio", "", "plank", "inchworm exercise how to", "Em pé, incline e apoie as mãos no chão.|Ande com as mãos até a prancha.|Volte andando e suba.", "Joelhos podem dobrar."],
    ["Lateral_Shuffle", "Deslocamento lateral", "Cardio e pernas", "Cardio", "", "squat", "lateral shuffle exercise", "Semiagachado.|Deslize de lado com passos rápidos.|Volte para o outro lado.", "Não cruze os pés."],
    ["Squat_Thrust", "Agachamento com prancha", "Corpo todo", "Cardio", "", "burpee", "squat thrust exercise", "Agache e apoie as mãos.|Jogue as pernas para trás em prancha.|Volte e levante.", "Burpee sem salto."],
    ["Seal_Jack", "Polichinelo com palma", "Cardio e peito", "Cardio", "", "jack", "seal jacks exercise", "Braços à frente na altura dos ombros.|Salte abrindo pernas e braços.|Feche batendo palma.", "Mantenha os braços na altura dos ombros."],
    ["Fast_Feet", "Pés rápidos", "Cardio", "Cardio", "", "highknees", "fast feet drill exercise", "Semiagachado.|Mexa os pés o mais rápido possível no lugar.|Braços acompanham.", "Fique na ponta dos pés."],
    ["Kettlebell_Swing", "Balanço com kettlebell", "Glúteos, posterior e cardio", "Cardio", "kettlebell", "squat", "kettlebell swing proper form", "Segure o kettlebell com as duas mãos.|Leve o quadril para trás e balance entre as pernas.|Projete o quadril e suba o peso até o peito.", "A força vem do quadril, não dos braços."],
    ["Dumbbell_Thruster", "Thruster com halter", "Corpo todo", "Cardio", "halter", "squat", "dumbbell thruster how to", "Halteres nos ombros.|Agache.|Suba empurrando os pesos acima da cabeça.", "Um movimento contínuo."],
    ["Burpee_Pushup", "Burpee com flexão", "Corpo todo (avançado)", "Cardio", "", "burpee", "burpee with push up form", "Agache e apoie as mãos.|Jogue as pernas para trás e faça uma flexão.|Volte e salte.", "Ritmo que dá para manter a técnica."],
    // ---------- Alongamento e mobilidade ----------
    ["Cat_Cow", "Gato e vaca", "Coluna e mobilidade", "Alongamento", "", "donkey", "cat cow stretch", "De quatro apoios.|Arredonde as costas olhando o umbigo.|Depois afunde a coluna olhando para a frente.", "Siga a respiração."],
    ["Childs_Pose", "Postura da criança", "Costas e quadril", "Alongamento", "", "backcurl", "child's pose stretch", "Ajoelhado, sente nos calcanhares.|Leve os braços à frente e o peito ao chão.|Respire fundo.", "Relaxe os ombros."],
    ["Cobra_Stretch", "Cobra", "Abdômen e lombar", "Alongamento", "", "backcurl", "cobra stretch how to", "Deitado de bruços, mãos sob os ombros.|Estenda os braços elevando o peito.|Segure respirando.", "Quadril no chão."],
    ["Downward_Dog", "Cachorro olhando para baixo", "Posterior, panturrilhas e ombros", "Alongamento", "", "buttup", "downward dog for beginners", "De quatro, levante o quadril formando um V.|Empurre o chão com as mãos.|Leve os calcanhares em direção ao chão.", "Joelhos podem ficar dobrados."],
    ["Hip_Flexor_Stretch", "Alongamento do quadril", "Flexores do quadril", "Alongamento", "", "lunge", "kneeling hip flexor stretch", "Ajoelhado em afundo.|Leve o quadril à frente.|Segure e troque o lado.", "Aperte o glúteo da perna de trás.", 1],
    ["Hamstring_Stretch", "Alongamento do posterior", "Posterior de coxa", "Alongamento", "", "toetouch", "seated hamstring stretch", "Sentado, pernas esticadas.|Incline o tronco à frente.|Segure respirando.", "Costas retas; não force."],
    ["Pigeon_Pose", "Pombo", "Glúteos e quadril", "Alongamento", "", "lunge", "pigeon pose stretch beginners", "Uma perna dobrada à frente, a outra esticada atrás.|Desça o tronco sobre a perna da frente.|Troque o lado.", "Use uma almofada sob o quadril.", 1],
    ["Worlds_Greatest_Stretch", "Melhor alongamento do mundo", "Corpo todo", "Alongamento", "", "lunge", "world's greatest stretch", "Em afundo, mão do lado de dentro do pé.|Gire o tronco levando o braço para o teto.|Troque o lado.", "Ótimo antes do treino.", 1],
    ["Thread_The_Needle", "Passar a agulha", "Costas altas e ombros", "Alongamento", "", "donkey", "thread the needle stretch", "De quatro apoios.|Passe um braço por baixo do outro girando o tronco.|Volte e abra para o teto.", "Movimento lento.", 1],
    ["Quad_Stretch", "Alongamento do quadríceps", "Coxas", "Alongamento", "", "stand", "standing quad stretch", "Em pé, segure o pé atrás do corpo.|Leve o calcanhar ao glúteo.|Troque o lado.", "Joelhos juntos; apoie numa parede.", 1],
    ["Figure_Four_Stretch", "Alongamento do glúteo", "Glúteos e quadril", "Alongamento", "", "bridge", "figure four stretch lying", "Deitado, cruze um tornozelo sobre o joelho oposto.|Puxe a perna de baixo em direção ao peito.|Troque o lado.", "Respire e relaxe.", 1],
    ["Supine_Twist", "Torção deitado", "Coluna e lombar", "Alongamento", "", "deadbug", "supine spinal twist", "Deitado, abrace um joelho.|Leve para o lado oposto, braços abertos.|Troque o lado.", "Ombros no chão.", 1],
    ["Butterfly_Stretch", "Borboleta", "Adutores e quadril", "Alongamento", "", "twist", "butterfly stretch", "Sentado, solas dos pés juntas.|Segure os pés e incline o tronco à frente.|Respire.", "Não empurre os joelhos com força."],
    ["Cross_Body_Shoulder_Stretch", "Alongamento do ombro", "Ombros", "Alongamento", "", "stand", "cross body shoulder stretch", "Leve um braço esticado na frente do peito.|Puxe com o outro braço.|Troque o lado.", "Ombro baixo, longe da orelha.", 1],
    ["Chest_Stretch", "Alongamento do peito", "Peito e ombros", "Alongamento", "", "stand", "doorway chest stretch", "Antebraço apoiado num batente.|Dê um passo à frente.|Segure e troque o lado.", "Sem dor, só tensão leve.", 1],
    ["Neck_Stretch", "Alongamento do pescoço", "Pescoço", "Alongamento", "", "stand", "neck stretch for tension", "Sentado ou em pé, coluna reta.|Incline a cabeça para um lado.|Segure e troque.", "Movimento suave, nunca brusco.", 1],
    ["Calf_Stretch", "Alongamento da panturrilha", "Panturrilhas", "Alongamento", "", "lunge", "wall calf stretch", "Mãos na parede, uma perna atrás.|Calcanhar de trás no chão.|Segure e troque.", "Joelho de trás esticado.", 1],
    ["Deep_Squat_Hold", "Agachamento profundo", "Quadril e tornozelos", "Alongamento", "", "squat", "deep squat hold mobility", "Pés afastados, desça o máximo possível.|Cotovelos empurram os joelhos para fora.|Segure respirando.", "Calcanhar levanta? Apoie num livro."]
  ];
  const GROUPS = ["Abdômen", "Cintura", "Glúteos", "Pernas", "Peito", "Costas", "Ombros", "Braços", "Cardio", "Alongamento"];
  const EQUIP = { "": "Sem equipamento", halter: "Halter", "elástico": "Elástico", barra: "Barra fixa", banco: "Banco ou cadeira", kettlebell: "Kettlebell", corda: "Corda" };
  L.forEach(([id, n, m, g, eq, mq, q, how, tip, side]) => {
    if (EX[id]) return;
    EX[id] = { n, m, g, eq, mq, how: how.split("|"), tip };
    if (side) EX[id].side = 1;
  });

  // grupo dos exercícios antigos (que não têm g)
  const guess = id => { const m = (EX[id].m || "").toLowerCase(), n = EX[id].n.toLowerCase(); return /alonga|mobilid/.test(m + n) ? "Alongamento" : /obl|cintura/.test(m) ? "Cintura" : /abd|core|reto|transverso/.test(m) ? "Abdômen" : /gl[úu]te|bumbum/.test(m) ? "Glúteos" : /lombar|costas/.test(m) ? "Costas" : /perna|coxa|quadr|panturr/.test(m) ? "Pernas" : /peito/.test(m) ? "Peito" : /tr[íi]ceps|b[íi]ceps|bra[çc]o/.test(m) ? "Braços" : /ombro/.test(m) ? "Ombros" : /cardio|queima|corpo todo/.test(m) ? "Cardio" : "Abdômen"; };
  Object.keys(EX).forEach(id => { if (id !== "walk" && !EX[id].g) EX[id].g = guess(id); if (EX[id].eq == null) EX[id].eq = id === "Tricep_Dip" || id === "Incline_Pushup" ? "banco" : ""; });

  window.LIB = { GROUPS, EQUIP, count: () => Object.keys(EX).length - 1 };

  // vídeos da biblioteca (videos.js) entram no mesmo lugar dos vídeos do app
  const V = window.LIB_VID || {};
  Object.keys(V).forEach(id => { if (EX[id] && !VID[id]) VID[id] = V[id][0]; });
  window.vidCredit = id => (S.vids && S.vids[id]) ? "" : ((V[id] && V[id][1]) || (window.VID_CH || {})[id] || "");

  /* ---------- vídeo explicativo com som (tela cheia, com controles) ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tutBtn = id => !vidId(id) ? "" : '<button class="tut-btn" data-tut="' + id + '"><span>▶</span><div><b>Ver vídeo explicativo</b><small>' +
    (vidCredit(id) ? "Canal " + esc(vidCredit(id)) + " · " : "") + 'com som e controles</small></div></button>';
  function tutorial(id) {
    const v = vidId(id), e = EX[id];
    if (!v) return;
    if (navigator.onLine === false) { toast("Conecte à internet para ver o vídeo"); return; }
    const el = document.createElement("div");
    el.className = "tut";
    el.innerHTML = '<div class="tut-box" role="dialog" aria-label="Vídeo: ' + esc(e.n) + '"><div class="tut-top"><div><b>' + esc(e.n) + '</b><span>' + esc(e.m) + '</span></div><button data-tutx aria-label="Fechar">✕</button></div>' +
      '<div class="tut-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + v + '?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&vq=hd1080" title="' + esc(e.n) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      (vidCredit(id) ? '<p class="tut-cr">Vídeo do canal <b>' + esc(vidCredit(id)) + '</b> no YouTube</p>' : "") +
      '<div class="tut-how"><h3>Como fazer</h3><ol>' + e.how.map(h => "<li>" + esc(h) + "</li>").join("") + '</ol><p><b>Dica:</b> ' + esc(e.tip) + '</p></div></div>';
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 200); };
    el.addEventListener("click", ev => { if (ev.target === el || ev.target.closest("[data-tutx]")) close(); });
    document.body.appendChild(el);
  }
  window.exTutorial = tutorial;
  document.addEventListener("click", e => { const b = e.target.closest("[data-tut]"); if (b) tutorial(b.dataset.tut); });

  // folha do exercício e "como fazer" ganham a demonstração e o botão do vídeo
  const _open = openEx;
  openEx = function (id) {
    _open(id);
    const sh = $("#layer .sheet"), h = sh && sh.querySelector("h3");
    if (h) h.parentNode.insertAdjacentHTML("beforebegin", tutBtn(id));
  };
  const _info = infoOver;
  infoOver = function (id) {
    _info(id);
    const sh = document.body.lastElementChild && document.body.lastElementChild.querySelector(".sheet"); if (!sh) return;
    sh.classList.add("ex-info");
    const ol = sh.querySelector("ol");
    if (ol && (!PL || PL.fin)) ol.insertAdjacentHTML("beforebegin", '<div class="ex-demo">' + vidHTML(id, SPEED[id]) + '</div><p class="ex-m">' + esc(EX[id].m) + (EX[id].eq ? " · " + esc(EQUIP[EX[id].eq]) : "") + '</p>');
    sh.insertAdjacentHTML("beforeend", tutBtn(id));
  };
})();
