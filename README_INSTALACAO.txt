APP TRIATHLON PENHA 2027 - INSTALAÇÃO
Versão atual: v21 (12/11/2026) - Evolução de cargas + novo banco de dados

Este pacote é um app web mobile/PWA. Ele abre no navegador do celular e pode ser instalado na tela inicial.

Como usar no celular sem programar:
1. Envie a pasta/ZIP para um serviço de hospedagem estática, como Netlify, Vercel ou GitHub Pages.
2. Abra o link no celular.
3. No Android/Chrome: toque no menu ⋮ e escolha 'Adicionar à tela inicial' ou 'Instalar app'.
4. No iPhone/Safari: toque em Compartilhar e escolha 'Adicionar à Tela de Início'.

Como testar no computador:
1. Descompacte o ZIP.
2. Abra a pasta em um servidor local simples. Exemplo com Python:
   python3 -m http.server 8000
3. Acesse http://localhost:8000

BANCO DE DADOS (SUPABASE)
- Projeto exclusivo do triathlon (conta Supabase separada dos apps da empresa).
- URL: https://otebthyjbaeipzyheiwd.supabase.co
- A URL e a chave publishable ficam no app.js (linhas 6 e 7).
- Use somente a chave "publishable/anon". Nunca coloque a chave "secret/service_role" no app.
- Tabelas:
  * exercicios_registros: uma linha por exercício da academia (peso, séries, repetições, semana, treino A/B/C).
  * registros_treino: resumo semanal salvo na aba Controle (dor no joelho, RPE, sono, treinos concluídos).
- As duas tabelas têm RLS ligado com policies de INSERT e SELECT para o papel anon.
- Histórico: até 12/11/2026 os dados ficavam no projeto Gestao de RI; foram migrados para este projeto.

ONDE OS DADOS FICAM
- Checklist, controle semanal e cargas são salvos no celular e enviados para o Supabase.
- O resumo semanal só vai para a nuvem ao tocar em "Salvar controle da semana" (aba Controle).

DASHBOARD DE CARGAS (v21)
- Aba Dashboard > Evolução de cargas.
- Mostra dias de treino registrados, maior evolução, volume semanal (peso × séries × reps),
  gráfico do maior peso por semana de cada exercício e tabela com 1ª carga, atual, melhor e evolução.
- Lê os dados direto da tabela exercicios_registros (precisa de internet).

ATUALIZAR VERSÃO NO CELULAR
- A cada nova versão, troque o "?v=" no index.html e no service-worker.js e o nome do CACHE.
- Se o celular mostrar a versão antiga (veja o selo de versão no topo), feche e abra o app
  ou limpe o cache do navegador.
