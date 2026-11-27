// ════════════════════════════════════════════════════════════════════════
//  IG Digital Studio · detalles «premium» de la web
//  1) El hilo de luz: una línea naranja que recorre la web de sección en sección
//     y se va dibujando al bajar, con una chispa en la punta y nodos que se encienden.
//  2) La conexión entre los pasos del proceso de trabajo.
//  3) Los iconos de servicios y del proceso se dibujan al aparecer.
//  Sin dependencias. Con «reducir movimiento» todo se muestra ya terminado y quieto.
// ════════════════════════════════════════════════════════════════════════
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 3) Iconos que se dibujan: cada trazo mide «100» para animarlo con CSS ──
  document.querySelectorAll('.svc-ico svg *, .px-ico svg *, .px-escudo svg *').forEach((el) => {
    el.setAttribute('pathLength', '100');
  });

  // ── 2) Proceso: la línea que une los pasos se rellena al verla ──
  const pasos = document.querySelector('.px-pasos');
  if (pasos) {
    const medirPista = () => {
      const iconos = pasos.querySelectorAll('.px-ico');
      if (iconos.length < 2) return;
      const caja = pasos.getBoundingClientRect();
      const a = iconos[0].getBoundingClientRect(), b = iconos[iconos.length - 1].getBoundingClientRect();
      const horizontal = Math.abs(a.top - b.top) < 4;
      pasos.classList.toggle('pista-h', horizontal);
      pasos.classList.toggle('pista-v', !horizontal && Math.abs(a.left - b.left) < 4);
      // Del centro del primer icono al centro del último
      pasos.style.setProperty('--pista-x', (a.left + a.width / 2 - caja.left) + 'px');
      pasos.style.setProperty('--pista-y', (a.top + a.height / 2 - caja.top) + 'px');
      pasos.style.setProperty('--pista-w', (b.left - a.left) + 'px');
      pasos.style.setProperty('--pista-h', (b.top - a.top) + 'px');
    };
    medirPista();
    addEventListener('resize', medirPista, { passive: true });
    addEventListener('load', medirPista);
    if (quieto || !('IntersectionObserver' in window)) pasos.classList.add('conectado');
    else new IntersectionObserver((entradas, obs) => {
      if (entradas[0].isIntersecting) { medirPista(); pasos.classList.add('conectado'); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(pasos);
  }

  // ── 1) El hilo de luz ──
  const main = document.getElementById('contenido');
  const hero = main && main.querySelector('.hero');
  const layout = main && main.querySelector('.layout');
  if (!main || !hero || !layout) return;

  const NS = 'http://www.w3.org/2000/svg';
  const capa = document.createElement('div');
  capa.className = 'ig-hilo';
  capa.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  const trazo = (clase) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', clase); svg.appendChild(p); return p; };
  const base = trazo('hilo-base'), brillo = trazo('hilo-brillo'), luz = trazo('hilo-luz');
  const cabeza = document.createElement('i');
  cabeza.className = 'hilo-cabeza';
  capa.append(svg, cabeza);
  main.prepend(capa);

  // Las paradas del hilo: una por sección (a la altura de su título)
  const paradas = ['#servicios', '#proyectos', '#proceso', '#sobre-mi', '.sx-cta', '#contacto']
    .map((s) => main.querySelector(s)).filter(Boolean);
  let nodos = [], largo = 0, largosNodo = [], topMain = 0, listo = false;

  const yDe = (el, mTop) => {
    const t = el.querySelector('h2') || el;
    const r = t.getBoundingClientRect();
    return r.top + r.height / 2 - mTop;
  };

  // Primer punto del trazo cuya altura llega a «y» (el hilo siempre baja: búsqueda binaria)
  const largoEnY = (y) => {
    let lo = 0, hi = largo;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (luz.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
    }
    return lo;
  };

  const construir = () => {
    const m = main.getBoundingClientRect();
    topMain = m.top + scrollY;
    const ancho = main.clientWidth, alto = main.offsetHeight;
    svg.setAttribute('width', ancho);
    svg.setAttribute('height', alto);
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);

    // Va por el margen izquierdo de la zona de contenido, sin tocar los textos
    const estilo = getComputedStyle(layout);
    const bordeContenido = layout.getBoundingClientRect().left - m.left + parseFloat(estilo.paddingLeft);
    const x = Math.max(9, Math.round(bordeContenido - Math.min(34, bordeContenido * 0.45)));
    const onda = Math.min(14, x - 4);

    const yIni = hero.offsetHeight;                 // sale de la línea inferior del inicio
    const ys = paradas.map((el) => yDe(el, m.top));
    const xIni = ancho / 2;
    let d = `M ${xIni} ${yIni} C ${xIni} ${yIni + 34}, ${x} ${yIni + 6}, ${x} ${Math.min(ys[0], yIni + 70)}`;
    let yPrev = Math.min(ys[0], yIni + 70);
    ys.forEach((y, i) => {
      const s = i % 2 ? -1 : 1;
      const dy = y - yPrev;
      if (dy > 1) d += ` C ${x + onda * s} ${yPrev + dy * 0.33}, ${x - onda * s} ${yPrev + dy * 0.66}, ${x} ${y}`;
      yPrev = y;
    });
    [base, brillo, luz].forEach((p) => p.setAttribute('d', d));
    largo = luz.getTotalLength();
    [brillo, luz].forEach((p) => { p.style.strokeDasharray = `${largo} ${largo}`; });

    // Nodos en cada parada
    nodos.forEach((n) => n.remove());
    nodos = ys.map((y) => {
      const n = document.createElement('i');
      n.className = 'hilo-nodo';
      n.style.transform = `translate(${x}px, ${y}px)`;
      capa.appendChild(n);
      return n;
    });
    largosNodo = ys.map((y) => largoEnY(y - 0.5));
    listo = true;
    pintar();
  };

  let pedido = 0;
  const pintar = () => {
    pedido = 0;
    if (!listo) return;
    if (quieto) {
      [brillo, luz].forEach((p) => { p.style.strokeDashoffset = 0; });
      nodos.forEach((n) => n.classList.add('on'));
      cabeza.style.opacity = 0;
      return;
    }
    // El hilo llega hasta un poco por debajo de la mitad de la pantalla
    const objetivo = scrollY + innerHeight * 0.62 - topMain;
    const l = objetivo <= hero.offsetHeight ? 0 : largoEnY(objetivo);
    [brillo, luz].forEach((p) => { p.style.strokeDashoffset = largo - l; });
    const pt = luz.getPointAtLength(l);
    cabeza.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
    cabeza.style.opacity = l > 2 && l < largo - 2 ? 1 : 0;
    nodos.forEach((n, i) => n.classList.toggle('on', l >= largosNodo[i]));
  };
  const alDesplazar = () => { if (!pedido) pedido = requestAnimationFrame(pintar); };

  let espera = 0;
  const reconstruir = () => { clearTimeout(espera); espera = setTimeout(construir, 150); };
  addEventListener('scroll', alDesplazar, { passive: true });
  addEventListener('resize', reconstruir, { passive: true });
  addEventListener('load', construir);
  if ('ResizeObserver' in window) new ResizeObserver(reconstruir).observe(main);
  construir();
})();

// ════════════════════════════════════════════════════════════════════════
//  VISOR DE CAPTURAS: las capturas se amplían en la misma página (sin abrir otra pestaña),
//  con una X arriba a la derecha para salir. También: Escape o pinchar fuera para cerrar,
//  flechas ← → para pasar de una a otra, y el foco del teclado se queda dentro mientras está abierto.
// ════════════════════════════════════════════════════════════════════════
(() => {
  const visor = document.createElement('div');
  visor.className = 'visor';
  visor.setAttribute('role', 'dialog');
  visor.setAttribute('aria-modal', 'true');
  visor.setAttribute('aria-label', 'Captura ampliada');
  visor.hidden = true;
  visor.innerHTML =
    '<button type="button" class="visor-cerrar" aria-label="Cerrar la captura">×</button>' +
    '<button type="button" class="visor-nav visor-ant" aria-label="Captura anterior">‹</button>' +
    '<figure class="visor-marco"><picture><source type="image/webp"><img alt=""></picture>' +
    '<figcaption><span class="visor-texto"></span><span class="visor-cuenta"></span></figcaption></figure>' +
    '<button type="button" class="visor-nav visor-sig" aria-label="Captura siguiente">›</button>';
  document.body.appendChild(visor);

  const fuente = visor.querySelector('source');
  const img = visor.querySelector('img');
  const texto = visor.querySelector('.visor-texto');
  const cuenta = visor.querySelector('.visor-cuenta');
  const btnCerrar = visor.querySelector('.visor-cerrar');
  let grupo = [], actual = 0, focoAnterior = null, bloqueoPropio = false;

  // Cada captura del grupo: { jpg, webp, alt }
  const datosDe = (el) => {
    const im = el.tagName === 'IMG' ? el : el.querySelector('img');
    const jpg = el.getAttribute('href') || (im && im.getAttribute('src'));
    return { jpg, webp: jpg.replace(/\.jpg$/i, '.webp'), alt: (im && im.alt) || 'Captura del proyecto' };
  };

  const mostrar = (i) => {
    actual = (i + grupo.length) % grupo.length;
    const c = grupo[actual];
    fuente.srcset = c.webp;
    img.src = c.jpg;
    img.alt = c.alt;
    texto.textContent = c.alt;
    cuenta.textContent = grupo.length > 1 ? `${actual + 1} / ${grupo.length}` : '';
    visor.classList.toggle('solo-una', grupo.length < 2);
  };

  const abrir = (lista, i) => {
    grupo = lista.map(datosDe);
    focoAnterior = document.activeElement;
    mostrar(i);
    visor.hidden = false;
    requestAnimationFrame(() => visor.classList.add('abierto'));
    // Si no hay otra ventana debajo que ya bloquee el scroll, lo bloquea el visor
    bloqueoPropio = document.body.style.overflow !== 'hidden';
    if (bloqueoPropio) document.body.style.overflow = 'hidden';
    btnCerrar.focus();
  };

  const cerrar = () => {
    visor.classList.remove('abierto');
    visor.hidden = true;
    img.removeAttribute('src');
    if (bloqueoPropio) document.body.style.overflow = '';
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  };

  // Qué abre el visor: las miniaturas de la galería y la captura grande de la ventana del proyecto
  document.addEventListener('click', (e) => {
    const disparador = e.target.closest('a.ver-captura, #proyecto-modal .pcontent img.shot');
    if (!disparador) return;
    e.preventDefault();
    e.stopPropagation();
    const caja = disparador.closest('.pbox') || document;
    const lista = [...caja.querySelectorAll('.pcontent img.shot, a.ver-captura')];
    abrir(lista, Math.max(0, lista.indexOf(disparador)));
  }, true);

  btnCerrar.addEventListener('click', cerrar);
  visor.querySelector('.visor-ant').addEventListener('click', () => mostrar(actual - 1));
  visor.querySelector('.visor-sig').addEventListener('click', () => mostrar(actual + 1));
  visor.addEventListener('click', (e) => { if (e.target === visor) cerrar(); });   // pinchar fuera de la imagen

  // Teclado: va antes que el resto de la página para que Escape cierre solo la captura, no la ventana de debajo
  window.addEventListener('keydown', (e) => {
    if (visor.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if (e.key === 'ArrowLeft' && grupo.length > 1) { e.preventDefault(); mostrar(actual - 1); }
    else if (e.key === 'ArrowRight' && grupo.length > 1) { e.preventDefault(); mostrar(actual + 1); }
    else if (e.key === 'Tab') {
      const botones = [...visor.querySelectorAll('button')].filter((b) => b.offsetParent !== null);
      const i = botones.indexOf(document.activeElement);
      e.preventDefault();
      e.stopPropagation();
      botones[(i + (e.shiftKey ? -1 : 1) + botones.length) % botones.length].focus();
    }
  }, true);
})();
