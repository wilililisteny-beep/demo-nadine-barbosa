/* ============================================================================
   Nadine Barbosa Nails · site.js
   O motor monta primeiro; cada módulo vive no seu try/catch, para que um efeito
   partido nunca deixe o menu ou a marcação sem resposta. Nada espera por uma
   animação para ligar a página (um separador em fundo não corre rAF).
   ========================================================================== */
(function () {
  'use strict';

  var sc = null;
  try { sc = window.ScrollCraft.mount(document.body); } catch (e) { console.error('[motor]', e); }

  var REDUZ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINO = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var WA = 'https://wa.me/351967270170?text=';
  var vh = innerHeight, vw = innerWidth;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function suave(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function modulo(nome, fn) { try { fn(); } catch (e) { console.error('[' + nome + ']', e); } }

  /* progresso de um acto preso, igual ao do motor (sem dwell nestes actos) */
  function pPreso(sec) {
    var r = sec.getBoundingClientRect();
    return clamp01(-r.top / Math.max(r.height - vh, 1));
  }
  /* progresso de uma secção em fluxo: 0 quando o topo toca o fundo do ecrã */
  function pFluxo(sec) {
    var r = sec.getBoundingClientRect();
    return clamp01((vh - r.top) / (r.height + vh));
  }

  var quem = [];                       // funções chamadas a cada fotograma de scroll
  function aCadaScroll(fn) { quem.push(fn); }
  var pedido = false;
  function agenda() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; for (var i = 0; i < quem.length; i++) { try { quem[i](); } catch (e) { console.error(e); } } });
  }
  addEventListener('scroll', agenda, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; vw = innerWidth; agenda(); }, { passive: true });

  /* ================================================================ cromado */
  modulo('cromado', function () {
    var barra = $('.barra');
    var aro = $('.anel-mini__progresso');
    var folio = $('.marca__folio');
    var ancoras = $$('.ancoras a');
    var mapa = [
      ['#servicos', '.servicos-abertura, .anel-acto'],
      ['#galeria', '.galeria'],
      ['#formacao', '.formacao'],
      ['#contacto', '.fecho']
    ];
    var seccoes = $$('main > section');
    var ultimoFolio = '';

    aCadaScroll(function () {
      var y = scrollY;
      var max = Math.max(document.documentElement.scrollHeight - vh, 1);
      aro.setAttribute('stroke-dashoffset', (1 - clamp01(y / max)).toFixed(4));
      barra.classList.toggle('barra--solida', y > 8);

      // o chão por baixo da barra decide as cores dela
      var meio = parseFloat(getComputedStyle(barra).height) / 2;
      var sob = null;
      for (var i = 0; i < seccoes.length; i++) {
        var r = seccoes[i].getBoundingClientRect();
        if (r.top <= meio && r.bottom > meio) sob = seccoes[i];
      }
      if (sob) {
        var chao = sob.getAttribute('data-chao') || 'claro';
        if (barra.getAttribute('data-chao') !== chao) barra.setAttribute('data-chao', chao);
        var f = sob.getAttribute('data-folio') || '';
        if (f !== ultimoFolio) {
          ultimoFolio = f;
          folio.classList.add('muda');
          setTimeout(function () { folio.textContent = ultimoFolio; folio.classList.remove('muda'); }, 150);
        }
      }

      // âncora corrente: a secção que tem o meio do ecrã
      var alvo = null;
      mapa.forEach(function (m) {
        $$(m[1]).forEach(function (s) {
          var r = s.getBoundingClientRect();
          if (r.top < vh * 0.5 && r.bottom > vh * 0.5) alvo = m[0];
        });
      });
      ancoras.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === alvo ? 'true' : 'false'); });
    });
  });

  /* ========================================= 1 · herói: as cinco faixas */
  modulo('faixas', function () {
    var heroi = $('.heroi');
    var painel = $('.faixas');
    var faixas = $$('.faixa', painel);
    var ondas = [-10, 14, -18, 8, -6];

    function mede() {
      var w = painel.clientWidth;
      painel.style.setProperty('--painel-w', w + 'px');
      faixas.forEach(function (f, i) {
        f.style.setProperty('--x', f.offsetLeft);
        f.style.setProperty('--onda', ondas[i]);
      });
    }
    mede();
    addEventListener('resize', mede, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mede);

    if (REDUZ) {
      painel.style.setProperty('--t', 1);
      faixas.forEach(function (f) { f.style.setProperty('--ti', 1); });
      return;
    }

    aCadaScroll(function () {
      var p = pPreso(heroi);
      if (p <= 0 && painel.__ultimo === 0) return;
      painel.__ultimo = p;
      painel.style.setProperty('--t', suave(p / 0.9).toFixed(4));
      faixas.forEach(function (f, i) {
        f.style.setProperty('--ti', suave((p - i * 0.07) / 0.58).toFixed(4));
      });
    });

    // o ponteiro mexe as cinco faixas a profundidades diferentes, como dedos
    if (FINO) {
      var fundo = [0.55, 1, 0.35, 0.85, 0.65], alvo = 0, agora = 0, vivo = false;
      heroi.addEventListener('pointermove', function (e) {
        alvo = (e.clientX / vw - 0.5) * 2;
        if (!vivo) { vivo = true; requestAnimationFrame(passo); }
      });
      heroi.addEventListener('pointerleave', function () { alvo = 0; });
      function passo() {
        agora += (alvo - agora) * 0.08;
        faixas.forEach(function (f, i) { f.style.setProperty('--px', (agora * fundo[i] * 9).toFixed(2) + 'px'); });
        if (Math.abs(alvo - agora) > 0.002) requestAnimationFrame(passo); else vivo = false;
      }
    }
  });

  /* ==================================================== 3 · o baralho */
  var TRABALHOS = [
    { f: 'vermelho-ouro', l: 'Amendoadas · vermelho · folha de ouro sobre nude', alt: 'Unhas amendoadas vermelhas com uma unha nude com folha de ouro' },
    { f: 'stiletto-coracoes', l: 'Stiletto · vermelho · flocos e corações', alt: 'Unhas stiletto vermelhas, uma com flocos vermelhos e outra com corações' },
    { f: 'francesa-losangos', l: 'Quadradas · francesa branca · losangos e strass', alt: 'Francesa branca quadrada com uma unha em losangos e strass' },
    { f: 'azul-ouro', v: true, l: 'Amendoadas · azul-marinho · faixa de glitter dourado', alt: 'Mão com unhas azul-marinho e uma faixa de glitter dourado' },
    { f: 'preto-prata', l: 'Amendoadas · preto · onda de glitter prateado', alt: 'Unhas amendoadas pretas com uma onda de glitter prateado' },
    { f: 'lilas-onda', l: 'Curtas · lilás · onda branca', alt: 'Unhas curtas lilás com uma onda branca' },
    { f: 'preto-leopardo', l: 'Amendoadas · preto e nude · leopardo', alt: 'Unhas amendoadas pretas e nude com padrão de leopardo' },
    { f: 'magenta-flor', l: 'Quadradas · magenta e nude · flor branca', alt: 'Unhas quadradas magenta e nude com uma flor branca' },
    { f: 'rosa-borboleta', l: 'Quadradas · rosa · borboleta desenhada', alt: 'Unhas rosa claro com uma borboleta desenhada' },
    { f: 'branco-leitoso', l: 'Quadradas · branco leitoso', alt: 'Unhas quadradas em branco leitoso' }
  ];

  modulo('baralho', function () {
    var baralho = $('.baralho');
    var mesa = $('.baralho__mesa', baralho);
    var legenda = $('.baralho__legenda-linha', baralho);
    var minis = $('.baralho__miniaturas');
    var N = TRABALHOS.length;
    var rots = [-2.5, 3.2, -4.1, 2.2, -1.4, 4.4, -3.3, 1.8, -2.2, 3.7];
    var ordem = TRABALHOS.map(function (_, i) { return i; });
    var cartas = [], botoesMini = [];
    var ocupado = false;

    TRABALHOS.forEach(function (t, i) {
      var c = document.createElement('div');
      c.className = 'carta';
      if (t.v) {
        c.innerHTML = '<video muted loop playsinline preload="none" poster="assets/img/azul-ouro-poster.webp" aria-label="' + t.alt + '"><source src="assets/video/azul-ouro.mp4" type="video/mp4"></video>';
      } else {
        c.innerHTML = '<img src="assets/img/' + t.f + '-s.webp" alt="' + t.alt + '" width="540" height="720"' + (i > 2 ? ' loading="lazy"' : '') + ' draggable="false">';
      }
      mesa.appendChild(c);
      cartas.push(c);

      var caixa = document.createElement('span');
      caixa.className = 'miniatura-caixa';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'miniatura';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', t.l.replace(/ · /g, ', '));
      b.innerHTML = '<img src="assets/img/' + (t.v ? 'azul-ouro-poster' : t.f + '-s') + '.webp" alt="" loading="lazy">';
      b.addEventListener('click', function () { vaiPara(i); });
      caixa.appendChild(b);
      minis.appendChild(caixa);
      botoesMini.push(b);
    });

    function pousa(animar) {
      ordem.forEach(function (idx, d) {
        var c = cartas[idx];
        c.style.transition = animar && !REDUZ ? 'transform 460ms var(--ease), opacity 300ms ease' : 'none';
        c.style.zIndex = String(N - d);
        var visivel = d < 4;
        c.style.opacity = visivel ? '1' : '0';
        c.style.pointerEvents = d === 0 ? 'auto' : 'none';
        c.style.setProperty('--vela', (Math.min(d, 3) * 0.14).toFixed(2));
        var r = d === 0 ? rots[idx] * 0.3 : rots[idx];
        c.style.transform = 'translate3d(0,' + (d * 12) + 'px,0) scale(' + (1 - d * 0.045).toFixed(3) + ') rotate(' + r + 'deg)';
      });
      var topo = ordem[0];
      botoesMini.forEach(function (b, i) { b.setAttribute('aria-selected', i === topo ? 'true' : 'false'); b.tabIndex = i === topo ? 0 : -1; });
      legenda.textContent = TRABALHOS[topo].l;
      legenda.classList.remove('entra'); void legenda.offsetWidth; legenda.classList.add('entra');
      cartas.forEach(function (c, i) {
        var v = c.querySelector('video');
        if (!v) return;
        if (i === topo) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (v.readyState > 2) v.pause();
      });
    }
    pousa(false);

    /* atirar a carta de cima para um lado; ela volta a entrar por trás */
    function atira(dir, desdeX, desdeR) {
      if (ocupado) return;
      ocupado = true;
      var idx = ordem[0], c = cartas[idx];
      var w = mesa.clientWidth;
      var anim = null;
      var fim = function () {
        ordem.push(ordem.shift());
        c.style.transition = 'none';
        c.style.opacity = '0';
        if (anim) anim.cancel();
        pousa(true);
        c.style.opacity = '0';
        requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.transition = 'opacity 320ms ease, transform 460ms var(--ease)'; c.style.opacity = ordem.indexOf(idx) < 4 ? '1' : '0'; ocupado = false; }); });
      };
      if (REDUZ) { fim(); return; }
      var r0 = desdeR || rots[idx] * 0.3;
      anim = c.animate([
        { transform: 'translate3d(' + (desdeX || 0) + 'px,0,0) rotate(' + r0 + 'deg)' },
        { transform: 'translate3d(' + (dir * w * 1.35) + 'px,' + (-w * 0.08) + 'px,0) rotate(' + (r0 + dir * 22) + 'deg)', opacity: 0 }
      ], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' });
      anim.onfinish = fim;
    }
    /* trazer de volta a carta do fundo, pela esquerda */
    function recua() {
      if (ocupado) return;
      ocupado = true;
      ordem.unshift(ordem.pop());
      var idx = ordem[0], c = cartas[idx], w = mesa.clientWidth;
      pousa(true);
      if (REDUZ) { ocupado = false; return; }
      c.animate([
        { transform: 'translate3d(' + (-w * 1.3) + 'px,' + (-w * 0.08) + 'px,0) rotate(-20deg)', opacity: 0.3 },
        { transform: 'translate3d(0,0,0) rotate(' + (rots[idx] * 0.3) + 'deg)', opacity: 1 }
      ], { duration: 460, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).onfinish = function () { ocupado = false; };
    }
    function vaiPara(i) {
      if (ordem[0] === i) return;
      while (ordem[0] !== i) ordem.push(ordem.shift());
      pousa(true);
    }

    $$('.baralho__seta', baralho).forEach(function (b) {
      b.addEventListener('click', function () { if (b.getAttribute('data-dir') === '1') atira(-1); else recua(); });
    });
    baralho.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); atira(-1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); recua(); }
    });
    minis.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var k = (ordem[0] + (e.key === 'ArrowRight' ? 1 : N - 1)) % N;
      vaiPara(k); botoesMini[k].focus();
    });

    /* arrastar com mola: a mão manda, ao largar decide-se pela distância ou pela velocidade */
    var arr = null;
    mesa.addEventListener('pointerdown', function (e) {
      if (ocupado || e.button > 0) return;
      var c = cartas[ordem[0]];
      if (!c.contains(e.target)) return;
      arr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0, t: e.timeStamp, vx: 0, c: c, decidido: false, horiz: false };
      c.style.transition = 'none';
    });
    addEventListener('pointermove', function (e) {
      if (!arr || e.pointerId !== arr.id) return;
      var dx = e.clientX - arr.x0, dy = e.clientY - arr.y0;
      if (!arr.decidido && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        arr.decidido = true;
        arr.horiz = Math.abs(dx) > Math.abs(dy);
        if (arr.horiz) { try { arr.c.setPointerCapture(e.pointerId); } catch (er) {} }
      }
      if (!arr.horiz) return;
      var dt = Math.max(e.timeStamp - arr.t, 1);
      arr.vx = (dx - arr.x) / dt;
      arr.x = dx; arr.y = dy * 0.18; arr.t = e.timeStamp;
      arr.c.style.transform = 'translate3d(' + dx + 'px,' + arr.y + 'px,0) rotate(' + (dx * 0.05).toFixed(2) + 'deg)';
    });
    function larga(e) {
      if (!arr || e.pointerId !== arr.id) return;
      var a = arr; arr = null;
      if (!a.horiz) return;
      var w = mesa.clientWidth;
      if (Math.abs(a.x) > w * 0.26 || Math.abs(a.vx) > 0.55) {
        atira(a.x < 0 ? -1 : 1, a.x, a.x * 0.05);
      } else {
        pousa(true);
      }
    }
    addEventListener('pointerup', larga);
    addEventListener('pointercancel', larga);
  });

  /* ==================================================== 5 · o anel (pico) */
  var PARAGENS = [
    { s: 0, m: 30, foto: 'lilas-onda', voz: ['em 30 minutos fico despachada e com unhas duradouras!', 'carolina leao, no Google'] },
    { s: -1, m: 45, foto: 'preto-prata', voz: ['Sempre gostei de ter as unhas arranjadas mas ficar 1h30/2h a fazer… A Nadine tornou-se a minha fada das unhas! 45min e estou pronta!', 'Carolina Gomes, no Google'] },
    { s: 1, m: 60, foto: 'branco-leitoso', voz: ['As unhas ficam prontas em menos de 1 hora (o que nunca aconteceu anteriormente com outras nail artist).', 'Sara Russo, no Google'] },
    { s: 2, m: 60, foto: 'preto-leopardo', voz: ['respeita sempre as horas das marcações, unhas lindas em menos de 1 hora', 'Mafalda Silva, no Google'] },
    { s: 3, m: 60, foto: 'magenta-flor', voz: ['Excelente profissional, muito rápida, cumpre os horários e um trabalho bem feito', 'Maria Clélia Melo Nzau, no Google'] },
    { s: 4, m: 75, foto: 'francesa-losangos', voz: ['duram-me sempre até à manutenção seguinte. Nunca tive descolamentos.', 'Sara Russo, no Google'] },
    { s: 5, m: 90, foto: 'vermelho-ouro', voz: ['Unhas impecáveis, duradouras e feitas com amor.', 'Dulce Garcia, no Google'] },
    { s: 6, m: 120, foto: 'stiletto-coracoes', voz: ['é mais rápida do que a maioria e com o mesmo nível de qualidade.', 'Vera Silva, no Google'] }
  ];
  /* os sete serviços do BUK (nadinebarbosanails.buk.pt, lidos a 13/09/2026) */
  var SERVICOS = [
    { n: 'Verniz de gel', m: 30, p: 21 },
    { n: 'Manutenção de Acrigel (3-4 semanas)', m: 60, p: 28 },
    { n: 'Manutenção de Acrigel (mais de 4 semanas)', m: 60, p: 30 },
    { n: 'Manutenção de outra técnica', m: 60, p: 30 },
    { n: 'Extensão de Acrigel c/ moldes curtas', m: 75, p: 35 },
    { n: 'Extensão de Acrigel c/ moldes médias', m: 90, p: 40 },
    { n: 'Extensão de Acrigel c/ moldes longas', m: 120, p: 45 }
  ];
  var FASE_SILENCIO = 0.14, FASE_ENTRA = 0.22, FASE_FIM = 0.97;

  modulo('anel', function () {
    var acto = $('.anel-acto');
    var relogio = $('.relogio', acto);
    var svg = $('.relogio__svg', relogio);
    var NS = 'http://www.w3.org/2000/svg';
    var C = 220;
    var gFora = $('.relogio__pontos', svg), gDentro = $('.relogio__pontos-dentro', svg), gRot = $('.relogio__rotulos', svg);
    var arco = $('.relogio__arco', svg), ponteiro = $('.relogio__ponteiro', svg);
    var fora = [], dentro = [];
    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      var p1 = document.createElementNS(NS, 'circle');
      p1.setAttribute('cx', (C + Math.cos(a) * 186).toFixed(2));
      p1.setAttribute('cy', (C + Math.sin(a) * 186).toFixed(2));
      p1.setAttribute('r', i % 5 === 0 ? 3.3 : 2.4);
      if (i % 5 === 0) p1.setAttribute('class', 'hora');
      gFora.appendChild(p1); fora.push(p1);
      var p2 = document.createElementNS(NS, 'circle');
      p2.setAttribute('cx', (C + Math.cos(a) * 155).toFixed(2));
      p2.setAttribute('cy', (C + Math.sin(a) * 155).toFixed(2));
      p2.setAttribute('r', 1.7);
      gDentro.appendChild(p2); dentro.push(p2);
    }
    [[15, '15'], [30, '30'], [45, '45']].forEach(function (r) {
      var a = (r[0] / 60) * Math.PI * 2 - Math.PI / 2;
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', (C + Math.cos(a) * 208).toFixed(1));
      t.setAttribute('y', (C + Math.sin(a) * 208 + 4).toFixed(1));
      t.setAttribute('text-anchor', 'middle');
      t.textContent = r[1];
      gRot.appendChild(t);
    });

    // fotografias no centro do anel
    var caixaFotos = $('.relogio__fotos', relogio);
    var fotos = {};
    PARAGENS.forEach(function (pg) {
      if (fotos[pg.foto]) return;
      var im = document.createElement('img');
      im.src = 'assets/img/' + pg.foto + '-s.webp';
      im.alt = '';
      im.loading = 'lazy';
      im.decoding = 'async';
      caixaFotos.appendChild(im);
      fotos[pg.foto] = im;
    });

    // a lista (lista-que-acende)
    var lista = $('.menu__lista', acto);
    var linhas = SERVICOS.map(function (s, k) {
      var li = document.createElement('li');
      li.className = 'menu__linha';
      li.innerHTML = '<button type="button" class="menu__botao"><span class="menu__marca" aria-hidden="true"></span>' +
        '<span class="menu__nome">' + s.n + '</span><span class="menu__min">' + s.m + ' min</span>' +
        '<span class="menu__preco">' + s.p + ' €</span></button>';
      li.querySelector('button').addEventListener('click', function () { vaiParaParagem(paragemDoServico(k), true); });
      lista.appendChild(li);
      return li;
    });
    function paragemDoServico(k) { for (var i = 0; i < PARAGENS.length; i++) if (PARAGENS[i].s === k) return i; return 0; }

    var leituraNum = $('.relogio__min-num', relogio), leituraPreco = $('.relogio__preco', relogio);
    var voz = $('.relogio__voz', relogio), vozP = $('p', voz), vozCite = $('cite', voz);
    var escolhido = $('.menu__escolhido', acto), wa = $('.menu__wa', acto);
    var pega = $('.relogio__pega', relogio);
    var menu = $('.menu', acto);

    // desvio para centrar o anel no ecrã durante o silêncio
    var desvio = 0;
    function mede() {
      relogio.style.setProperty('--dx', '0px');
      var r = relogio.getBoundingClientRect(), pr = acto.querySelector('.anel-palco').getBoundingClientRect();
      desvio = (pr.left + pr.width / 2) - (r.left + r.width / 2);
      if (Math.abs(desvio) < 4) desvio = 0;
    }
    mede();
    addEventListener('resize', function () { mede(); agenda(); }, { passive: true });

    var estado = { paragem: -1, servico: -1, fase: '' };
    var minAlvo = 0, minAgora = 0, animando = false;

    function travel() { return Math.max(acto.offsetHeight - vh, 1); }
    function yDaParagem(i) {
      var top = acto.getBoundingClientRect().top + scrollY;
      var passo = (FASE_FIM - FASE_ENTRA) / PARAGENS.length;
      return top + travel() * (FASE_ENTRA + passo * (i + 0.5));
    }
    function vaiParaParagem(i, suaveScroll) {
      i = Math.max(0, Math.min(PARAGENS.length - 1, i));
      // 'auto' obedeceria ao scroll-behavior:smooth do motor; o arrasto precisa de salto seco
      scrollTo({ top: yDaParagem(i), behavior: suaveScroll && !REDUZ ? 'smooth' : 'instant' });
    }

    function desenha(m) {
      var dentroDaHora = Math.min(m, 60), segunda = Math.max(0, m - 60);
      var acesos = Math.round(dentroDaHora);
      for (var i = 0; i < 60; i++) {
        var on = i < acesos;
        if (fora[i].__on !== on) { fora[i].__on = on; fora[i].classList.toggle('aceso', on); }
        var on2 = i < Math.round(segunda);
        if (dentro[i].__on !== on2) { dentro[i].__on = on2; dentro[i].classList.toggle('aceso', on2); }
      }
      arco.setAttribute('stroke-dashoffset', (1 - dentroDaHora / 60).toFixed(4));
      ponteiro.setAttribute('transform', 'rotate(' + ((m / 60) * 360).toFixed(2) + ' 220 220)');
      leituraNum.textContent = String(Math.round(m));
    }

    function roda() {
      minAgora += (minAlvo - minAgora) * (REDUZ ? 1 : 0.16);
      if (Math.abs(minAlvo - minAgora) < 0.05) minAgora = minAlvo;
      desenha(minAgora);
      if (minAgora !== minAlvo) requestAnimationFrame(roda); else animando = false;
    }
    function alvoMinutos(m) {
      minAlvo = m;
      if (!animando) { animando = true; requestAnimationFrame(roda); }
    }

    function aplicaParagem(i) {
      if (estado.paragem === i) return;
      estado.paragem = i;
      var pg = PARAGENS[i];
      alvoMinutos(pg.m);
      relogio.setAttribute('data-segunda-volta', pg.m > 60 ? '1' : '0');
      Object.keys(fotos).forEach(function (k) { fotos[k].classList.toggle('activa', k === pg.foto); });
      vozP.textContent = '«' + pg.voz[0] + '»';
      vozCite.textContent = pg.voz[1];
      linhas.forEach(function (li, k) { li.classList.toggle('activa', k === pg.s); });
      var sIdx = pg.s >= 0 ? pg.s : (estado.servico >= 0 ? estado.servico : 0);
      estado.servico = sIdx;
      var s = SERVICOS[sIdx];
      leituraPreco.textContent = pg.s >= 0 ? s.p + ' €' : '';
      escolhido.textContent = s.n + ' · ' + s.m + ' min · ' + s.p + ' €';
      wa.href = WA + encodeURIComponent('Olá Nadine, gostava de marcar: ' + s.n + ' (' + s.m + ' min, ' + s.p + ' €).');
      wa.setAttribute('aria-label', 'Agendar ' + s.n + ' pelo WhatsApp');
      pega.setAttribute('aria-valuenow', String(i + 1));
      pega.setAttribute('aria-valuemax', String(PARAGENS.length));
      pega.setAttribute('aria-valuetext', pg.s >= 0 ? (s.n + ', ' + s.m + ' minutos, ' + s.p + ' euros') : ('45 minutos: ' + pg.voz[1]));
    }

    aCadaScroll(function () {
      var r = acto.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var p = pPreso(acto);

      if (p < FASE_SILENCIO) {
        // silêncio autorado: só o anel, a encher os sessenta minutos
        if (estado.fase !== 'silencio') { estado.fase = 'silencio'; relogio.setAttribute('data-fase', 'silencio'); estado.paragem = -1; linhas.forEach(function (li) { li.classList.remove('activa'); }); }
        var f = suave(p / FASE_SILENCIO);
        minAlvo = minAgora = f * 60;
        desenha(minAgora);
        relogio.style.setProperty('--dx', desvio + 'px');
        relogio.style.setProperty('--s', desvio ? '1.1' : '1');
        menu.style.setProperty('--menu-o', '0');
        menu.style.pointerEvents = 'none';
        return;
      }
      if (estado.fase !== 'servicos') { estado.fase = 'servicos'; relogio.setAttribute('data-fase', 'servicos'); }
      var e = suave((p - FASE_SILENCIO) / (FASE_ENTRA - FASE_SILENCIO));
      relogio.style.setProperty('--dx', (desvio * (1 - e)).toFixed(1) + 'px');
      relogio.style.setProperty('--s', desvio ? (1 + 0.1 * (1 - e)).toFixed(3) : '1');
      menu.style.setProperty('--menu-o', e.toFixed(3));
      menu.style.pointerEvents = e > 0.5 ? '' : 'none';
      var passo = (FASE_FIM - FASE_ENTRA) / PARAGENS.length;
      var i = Math.max(0, Math.min(PARAGENS.length - 1, Math.floor((p - FASE_ENTRA) / passo)));
      aplicaParagem(i);
    });

    /* o anel é um controlo: arrastar com rato/caneta, clicar, ou setas do teclado.
       O scroll continua a ser a única fonte de verdade: mexer no anel move a página. */
    var ang0 = null, paragem0 = 0, arrastou = false;
    function angulo(e) {
      var r = pega.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }
    pega.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;          // no telemóvel o dedo scrolla; a lista e as setas mandam
      ang0 = angulo(e); paragem0 = Math.max(estado.paragem, 0); arrastou = false;
      try { pega.setPointerCapture(e.pointerId); } catch (er) {}
    });
    var acum = 0, angAnt = 0;
    pega.addEventListener('pointermove', function (e) {
      if (ang0 === null) return;
      var a = angulo(e);
      if (!arrastou) { angAnt = ang0; acum = 0; }
      var d = a - angAnt; if (d > 180) d -= 360; if (d < -180) d += 360;
      acum += d; angAnt = a;
      if (Math.abs(acum) > 6) arrastou = true;
      var alvo = paragem0 + Math.round(acum / 42);
      if (alvo !== estado.paragem) vaiParaParagem(alvo, false);
    });
    function solta() {
      if (ang0 === null) return;
      ang0 = null;
      if (!arrastou) vaiParaParagem((estado.paragem + 1) % PARAGENS.length, true);
    }
    pega.addEventListener('pointerup', solta);
    pega.addEventListener('pointercancel', function () { ang0 = null; });
    pega.addEventListener('keydown', function (e) {
      var k = e.key, i = Math.max(estado.paragem, 0);
      if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); vaiParaParagem(i + 1, true); }
      else if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); vaiParaParagem(i - 1, true); }
      else if (k === 'Home') { e.preventDefault(); vaiParaParagem(0, true); }
      else if (k === 'End') { e.preventDefault(); vaiParaParagem(PARAGENS.length - 1, true); }
    });
  });

  /* ============================================ 6 · avaliações: a pilha */
  modulo('pilha', function () {
    var sec = $('.avaliacoes');
    var cartoes = $$('.cartao', sec);
    var nota = $('[data-conta]', sec);

    if (!REDUZ) {
      aCadaScroll(function () {
        var r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        for (var k = 0; k < cartoes.length - 1; k++) {
          var a = cartoes[k].getBoundingClientRect(), b = cartoes[k + 1].getBoundingClientRect();
          var cobre = clamp01((a.bottom - b.top) / Math.max(a.height, 1));
          cartoes[k].style.setProperty('--cobre', cobre.toFixed(3));
        }
      });
    }

    // a nota conta de 0,0 a 5,0 uma vez, em 700 ms
    if (nota && 'IntersectionObserver' in window && !REDUZ) {
      nota.textContent = '0,0';
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now();
        (function passo(t) {
          var k = suave((t - t0) / 700);
          nota.textContent = (5 * k).toFixed(1).replace('.', ',');
          if (k < 1) requestAnimationFrame(passo);
        })(t0);
      }, { threshold: 0.6 });
      io.observe(nota);
    }
  });

  /* ============================== 7 · formação: fotografias e a linha */
  modulo('formacao', function () {
    var sec = $('.formacao');
    var pols = $$('.polaroide', sec);
    var linha = $('.percurso__linha', sec);
    var traco = $('.percurso__traco', sec);
    var estacoes = $$('.percurso__estacoes li', sec);
    var pos = estacoes.map(function (li) { return parseFloat(li.style.getPropertyValue('--pos')) || 0; });

    function tudo() {
      if (traco) traco.setAttribute('stroke-dashoffset', '0');
      estacoes.forEach(function (li) { li.classList.add('chegou'); });
      pols.forEach(function (p) { p.style.setProperty('--pol', 1); });
    }
    if (REDUZ) { tudo(); return; }

    aCadaScroll(function () {
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = pFluxo(sec);
      pols.forEach(function (el, i) { el.style.setProperty('--pol', suave((p - 0.1 - i * 0.05) / 0.18).toFixed(3)); });
      var rl = linha.getBoundingClientRect();
      var q = clamp01((vh * 0.9 - rl.top) / (vh * 0.55));
      traco.setAttribute('stroke-dashoffset', (1 - q).toFixed(4));
      estacoes.forEach(function (li, i) { li.classList.toggle('chegou', q >= pos[i] - 0.001); });
    });
  });

  /* ================================= 8 · o fecho: o anel vira o logótipo */
  modulo('fecho', function () {
    var sec = $('.fecho');
    var svg = $('.logo', sec);
    var NS = 'http://www.w3.org/2000/svg';
    var g = $('.logo__pontos', svg), aro = $('.logo__aro', svg);
    var pts = [];
    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', (220 + Math.cos(a) * 186).toFixed(2));
      c.setAttribute('cy', (220 + Math.sin(a) * 186).toFixed(2));
      c.setAttribute('r', i % 5 === 0 ? 3.1 : 2.2);
      g.appendChild(c); pts.push(c);
    }
    var caixa = $('.fecho__logo', sec);

    function aplica(A) {
      aro.setAttribute('stroke-dashoffset', (1 - A).toFixed(4));
      var n = Math.round(A * 60);
      for (var i = 0; i < 60; i++) { var on = i < n; if (pts[i].__on !== on) { pts[i].__on = on; pts[i].classList.toggle('aceso', on); } }
      caixa.style.setProperty('--letras', suave((A - 0.5) / 0.4).toFixed(3));
      caixa.style.setProperty('--nb', suave((A - 0.68) / 0.3).toFixed(3));
      caixa.style.setProperty('--sala', suave((A - 0.15) / 0.5).toFixed(3));
    }
    if (REDUZ) { aplica(1); } else {
      aCadaScroll(function () {
        var r = sec.getBoundingClientRect();
        if (r.top > vh) { aplica(0); return; }
        var entra = clamp01(1 - r.top / vh);            // 0 com o topo no fundo do ecrã, 1 preso
        aplica(suave((entra - 0.25) / 0.7));
      });
    }

    // o estado da porta, calculado na hora de Lisboa a partir do horário do Google
    var estado = $('.ficha__estado', sec);
    try {
      var partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var d = {}; partes.forEach(function (p) { d[p.type] = p.value; });
      var dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      var nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      var hoje = dias.indexOf(d.weekday), agora = parseInt(d.hour, 10) * 60 + parseInt(d.minute, 10);
      var horario = { 2: [600, 990], 3: [600, 990], 4: [600, 990], 5: [600, 990], 6: [600, 840] };
      var h = horario[hoje];
      var fmt = function (m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); };
      if (h && agora >= h[0] && agora < h[1]) {
        estado.textContent = 'Aberto agora, até às ' + fmt(h[1]);
      } else {
        var k = hoje, depois = !(h && agora < h[0]);
        for (var n = 0; n < 8; n++) { if (depois) k = (k + 1) % 7; if (horario[k]) break; depois = true; }
        estado.textContent = 'Fechado agora · abre ' + (k === hoje ? 'hoje' : nomes[k]) + ' às ' + fmt(horario[k][0]);
      }
    } catch (e) {}
  });

  agenda();
  addEventListener('load', agenda);
})();
