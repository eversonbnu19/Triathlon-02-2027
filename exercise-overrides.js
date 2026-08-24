// Substitui a lista de academia sem alterar o plano-base.
// Foco: equipamentos livres, joelho/quadril, corrida e melhora da parte superior para natacao.
(function(){
  if(!window.TRAINING_DATA) return;
  window.TRAINING_DATA.academia = [
    {
      "Treino":"A - Pernas e joelho",
      "Exercício":"Bike leve + mobilidade tornozelo/quadril",
      "Séries x reps":"8-10 min + 4-6 min mobilidade",
      "Intensidade":"RPE 2-3",
      "Ponto técnico":"Aquecer sem fadigar. Mobilizar tornozelo e quadril antes de agachar. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=mobilidade+tornozelo+quadril+aquecimento+bike'>Buscar video</a>",
      "Substituição se joelho reclamar":"Caminhada leve + mobilidade sem impacto"
    },
    {
      "Treino":"A - Pernas e joelho",
      "Exercício":"Agachamento livre",
      "Séries x reps":"4 x 8-10",
      "Intensidade":"RPE 6-7",
      "Ponto técnico":"Agachar com controle, pés firmes, tronco estável e joelhos alinhados. Use amplitude confortável e sem dor. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=agachamento+livre+execucao+correta'>Buscar video</a>",
      "Substituição se joelho reclamar":"Reduzir amplitude, usar apoio/TRX ou trocar por ponte de glúteo"
    },
    {
      "Treino":"A - Pernas e joelho",
      "Exercício":"Hip thrust com halter",
      "Séries x reps":"4 x 8-12",
      "Intensidade":"RPE 7",
      "Ponto técnico":"Pausa de 1 segundo no topo, costelas baixas e queixo levemente recolhido. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://gymkee.com/pt-br/exercicios/gluteos/hip-thrust-halteres/'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Ponte de gluteo no solo ou ponte unilateral assistida"
    },
    {
      "Treino":"A - Pernas e joelho",
      "Exercício":"Pull-through no cabo",
      "Séries x reps":"4 x 10-12",
      "Intensidade":"RPE 6-7",
      "Ponto técnico":"Empurrar o quadril para trás, manter coluna neutra e voltar contraindo glúteos. Menos exigente para lombar que o terra romeno. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=pull+through+no+cabo+execucao+correta'>Buscar video</a>",
      "Substituição se joelho reclamar":"Ponte de glúteo com halter ou hip thrust leve"
    },
    {
      "Treino":"A - Pernas e joelho",
      "Exercício":"Step-up baixo com halteres leves",
      "Séries x reps":"3 x 8 cada perna",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Caixa baixa, subida controlada, sem impulso e sem deixar joelho cair para dentro. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/step-up/vid-20084661'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Step-up sem carga, apoio no TRX ou isometria curta"
    },
    {
      "Treino":"A - Pernas e joelho",
      "Exercício":"Panturrilha em pe com halteres",
      "Séries x reps":"4 x 12-15",
      "Intensidade":"RPE 7",
      "Ponto técnico":"Subir e descer em amplitude completa, segurar 1 segundo no topo. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=panturrilha+em+pe+com+halteres+execucao'>Buscar video</a>",
      "Substituição se joelho reclamar":"Panturrilha unilateral assistida ou panturrilha sentado"
    },
    {
      "Treino":"B - Natacao, costas e ombro",
      "Exercício":"Barra fixa assistida ou puxada na polia",
      "Séries x reps":"4 x 6-10",
      "Intensidade":"RPE 6-7",
      "Ponto técnico":"Pensar em puxar cotovelos para baixo; escapulas descem antes de flexionar o cotovelo. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://fitwill.app/pt-br/exercise/0017/assisted-pull-up/'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Sem impacto; manter sentado na polia se necessario"
    },
    {
      "Treino":"B - Natacao, costas e ombro",
      "Exercício":"Remada unilateral com halter",
      "Séries x reps":"4 x 8-12 cada lado",
      "Intensidade":"RPE 7",
      "Ponto técnico":"Controle escapular e tronco estavel; nao girar o corpo para roubar. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://gymkee.com/pt-br/exercicios/dorsais/remada-unilateral-halter/'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Remada apoiada no banco"
    },
    {
      "Treino":"B - Natacao, costas e ombro",
      "Exercício":"Pullover com halter",
      "Séries x reps":"3 x 10-12",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Amplitude controlada, costelas baixas, sentir dorsal/serratal sem forcar lombar. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://br.physitrack.com/home-exercise-video/pullover-com-halteres'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Sem impacto; reduzir carga e amplitude"
    },
    {
      "Treino":"B - Natacao, costas e ombro",
      "Exercício":"Face pull",
      "Séries x reps":"3 x 12-15",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Puxar para o rosto com cotovelos altos; foco em ombro posterior e escapulas. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.tuasaude.com/face-pull/'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Fazer sentado ou com elastico"
    },
    {
      "Treino":"B - Natacao, costas e ombro",
      "Exercício":"Elevação Y/T/W no banco inclinado",
      "Séries x reps":"2-3 x 8-10 cada letra",
      "Intensidade":"RPE 5-6",
      "Ponto técnico":"Carga leve; movimento limpo, sem encolher ombros. Excelente para controle escapular na natacao. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://support.runna.com/pt-BR/articles/7960114-tutorial-do-exercicio-y-w-t-raise'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Fazer deitado no banco sem carga ou com carga menor"
    },
    {
      "Treino":"B - Natacao, costas e ombro",
      "Exercício":"Pallof press",
      "Séries x reps":"3 x 10-12 cada lado",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Core firme; resistir a rotacao. Ajuda transferencia para corrida, bike e natacao. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.fitmetrics.ch/en/exercise/6733d7353a394-pallof-press/videos'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Fazer ajoelhado ou sentado se necessario"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Agachamento livre leve ou split squat curto",
      "Séries x reps":"3 x 8-10",
      "Intensidade":"RPE 5-6",
      "Ponto técnico":"Treino técnico, sem buscar carga máxima; joelho alinhado e amplitude confortável. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=split+squat+curto+execucao+joelho'>Buscar video</a>",
      "Substituição se joelho reclamar":"Agachamento com apoio ou ponte de glúteo"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Afundo reverso curto",
      "Séries x reps":"3 x 8 cada perna",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Passo para tras, controle e amplitude curta para poupar joelho. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://support.runna.com/pt-BR/articles/6322096-tutorial-do-exercicio-de-agachamento-reverso'>Ver referencia</a>",
      "Substituição se joelho reclamar":"TRX assistido ou split squat isometrico curto"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Supino com halteres",
      "Séries x reps":"3 x 8-12",
      "Intensidade":"RPE 6-7",
      "Ponto técnico":"Escapulas estaveis, halteres controlados e sem exagerar amplitude. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=supino+com+halteres+execucao+correta'>Buscar video</a>",
      "Substituição se joelho reclamar":"Sem impacto; manter no banco ou trocar por flexao inclinada"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Caminhada lateral com miniband",
      "Séries x reps":"3 x 10-15 passos cada lado",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Quadril para tras, joelhos alinhados e tensao constante no elastico. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://meutreinoperfeito.com.br/2020/07/07/passada-lateral-com-elastico-mini-band/'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Abducao de quadril deitado ou miniband mais leve"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Prancha lateral",
      "Séries x reps":"3 x 25-40s cada lado",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Quadril alto, corpo em linha e respiracao controlada. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.youtube.com/results?search_query=prancha+lateral+execucao+correta'>Buscar video</a>",
      "Substituição se joelho reclamar":"Prancha lateral com joelhos apoiados"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Farmer walk",
      "Séries x reps":"3 x 30-40m",
      "Intensidade":"RPE 6-7",
      "Ponto técnico":"Postura alta, costelas baixas e passos curtos; excelente para core e estabilidade. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://www.military.com/video/farmers-walk'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Suitcase carry leve ou caminhada menor"
    },
    {
      "Treino":"C - Manutencao e core",
      "Exercício":"Prancha com toque no ombro",
      "Séries x reps":"3 x 8-12 toques cada lado",
      "Intensidade":"RPE 6",
      "Ponto técnico":"Quadril parado; toque no ombro sem balancar o tronco. Bom para core anti-rotacao e cintura escapular. <br><a class='exercise-link' target='_blank' rel='noopener' href='https://meutreinoperfeito.com.br/2020/06/08/prancha-toque-no-ombro/'>Ver referencia</a>",
      "Substituição se joelho reclamar":"Prancha alta sem toque ou toque mais lento"
    }
  ];
})();