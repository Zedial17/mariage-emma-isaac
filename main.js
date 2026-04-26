// ── Countdown — slot machine ───────────────────────────────────────────────
(function countdown() {
  var target = new Date('2026-12-17T09:00:00+01:00');

  var units = [
    { el: document.getElementById('c-days'),  len: 3 },
    { el: document.getElementById('c-hours'), len: 2 },
    { el: document.getElementById('c-min'),   len: 2 },
    { el: document.getElementById('c-sec'),   len: 2 },
  ];

  units.forEach(function (u) {
    if (!u.el) return;
    u.el.innerHTML = '';
    u.cols = [];
    for (var i = 0; i < u.len; i++) {
      var col = document.createElement('span');
      col.className = 'dc';
      var inner = document.createElement('span');
      inner.className = 'dc__n';
      inner.textContent = '0';
      col.appendChild(inner);
      u.el.appendChild(col);
      u.cols.push(inner);
    }
  });

  function roll(inner, newChar) {
    if (inner.dataset.v === newChar) return;
    inner.dataset.v = newChar;
    inner.classList.remove('dc--roll');
    void inner.offsetWidth;
    inner.textContent = newChar;
    inner.classList.add('dc--roll');
  }

  function pad(n, len) { return String(n).padStart(len, '0'); }

  function tick() {
    var diff  = target - Date.now();
    var days  = diff > 0 ? Math.floor(diff / 864e5)           : 0;
    var hours = diff > 0 ? Math.floor((diff % 864e5) / 36e5)  : 0;
    var min   = diff > 0 ? Math.floor((diff % 36e5)  / 6e4)   : 0;
    var sec   = diff > 0 ? Math.floor((diff % 6e4)   / 1e3)   : 0;

    var values = [pad(days, 3), pad(hours, 2), pad(min, 2), pad(sec, 2)];

    units.forEach(function (u, i) {
      if (!u.cols) return;
      var s = values[i];
      u.cols.forEach(function (inner, j) { roll(inner, s[j]); });
    });
  }

  tick();
  setInterval(tick, 1000);
})();

// ── Navigation — scroll + burger ──────────────────────────────────────────
(function nav() {
  var el     = document.getElementById('nav');
  var burger = document.getElementById('nav-burger');
  var links  = document.getElementById('nav-links');

  window.addEventListener('scroll', function () {
    el.classList.toggle('nav--scrolled', window.scrollY > 40);
  }, { passive: true });

  if (window.scrollY > 40) el.classList.add('nav--scrolled');

  burger.addEventListener('click', function () {
    var open = burger.classList.toggle('open');
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      burger.classList.remove('open');
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
})();

// ── Curseur diamant + dot lissé ────────────────────────────────────────────
(function customCursor() {
  var cursor = document.getElementById('cursor');
  var dot    = document.getElementById('cursor-dot');
  if (!cursor || !dot) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  var mx = 0, my = 0;   // position souris (instantanée)
  var cx = 0, cy = 0;   // position dot (lissée par lerp)
  var angle = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function loop() {
    cx = lerp(cx, mx, 0.13);
    cy = lerp(cy, my, 0.13);
    angle += 0.6;

    cursor.style.left      = mx + 'px';
    cursor.style.top       = my + 'px';
    cursor.style.transform = 'translate(-50%, -50%) rotate(' + angle + 'deg)';

    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';

    requestAnimationFrame(loop);
  }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.classList.add('is-visible');
    dot.classList.add('is-visible');
  });

  document.addEventListener('mouseleave', function () {
    cursor.classList.remove('is-visible');
    dot.classList.remove('is-visible');
  });

  document.addEventListener('mousedown', function () { cursor.classList.add('is-clicking'); });
  document.addEventListener('mouseup',   function () { cursor.classList.remove('is-clicking'); });

  // Hover — exclu des inputs (ils gardent le curseur texte natif)
  var hoverTargets = 'a, button, [role="button"], label, select, .lieu__card, .pill, .faq__q, .program__toggle-btn, .myene__tab, .dresscode__day';

  document.querySelectorAll(hoverTargets).forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      cursor.classList.add('is-hovering');
      dot.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-hovering');
      dot.classList.remove('is-hovering');
    });
  });

  // Sur les inputs/textarea : masque le diamant, curseur texte natif reprend
  document.querySelectorAll('input, textarea').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      cursor.classList.remove('is-visible');
    });
    el.addEventListener('mouseleave', function () {
      cursor.classList.add('is-visible');
    });
  });

  loop();
})();

// ── Parallaxe hero ─────────────────────────────────────────────────────────
(function parallax() {
  var photo = document.querySelector('.hero__photo');
  if (!photo) return;
  var ticking = false;

  function update() {
    photo.style.transform = 'translateY(' + (window.scrollY * 0.38) + 'px)';
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();

// ── Timeline Notre Histoire — ligne scroll-driven + dots ───────────────────
(function timeline() {
  var line  = document.querySelector('.story__line');
  var steps = document.querySelectorAll('.story__step');
  if (!line || !steps.length) return;

  var section = document.querySelector('.story');
  var ticking = false;

  function drawLine() {
    var rect     = section.getBoundingClientRect();
    var winH     = window.innerHeight;
    var start    = winH * 0.8;
    var end      = -(rect.height * 0.3);
    var progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
    line.classList.add('is-drawing');
    line.style.transform = 'scaleY(' + progress + ')';
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(drawLine); ticking = true; }
  }, { passive: true });

  var stepObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var idx   = Array.prototype.indexOf.call(steps, entry.target);
        var delay = idx * 120;
        setTimeout(function () { entry.target.classList.add('step-visible'); }, delay);
        stepObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  steps.forEach(function (s) { stepObserver.observe(s); });
})();

// ── Scroll Reveal ──────────────────────────────────────────────────────────
(function reveal() {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach(function (el) { observer.observe(el); });
})();

// ── Active nav link ────────────────────────────────────────────────────────
(function activeLink() {
  var sections = document.querySelectorAll('section[id], footer[id]');
  var navLinks = document.querySelectorAll('.nav__link:not(.nav__link--cta)');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (a) {
          a.classList.toggle(
            'nav__link--active',
            a.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(function (s) { observer.observe(s); });
})();

// ── Wipe reveal titres section ─────────────────────────────────────────────
(function wipeReveal() {
  var targets = document.querySelectorAll('.section__title, .myene__title');
  if (!targets.length) return;

  targets.forEach(function (el) {
    var html = el.innerHTML;
    el.innerHTML = '<span class="title-wipe"><span class="title-wipe-inner">' + html + '</span></span>';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.querySelector('.title-wipe').classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  targets.forEach(function (el) { observer.observe(el); });
})();

// ── Programme — toggle Jour 1 / Jour 2 ────────────────────────────────────
(function programToggle() {
  var btns   = document.querySelectorAll('[data-day-toggle]');
  var panels = document.querySelectorAll('[data-day]');
  if (!btns.length) return;

  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var day = btn.dataset.dayToggle;
      btns.forEach(function (b) {
        b.classList.toggle('is-on', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.day === day);
      });
    });
  });
})();

// ── Deux Peuples — tabs Myènè / Ghisir ────────────────────────────────────
(function peopleTabs() {
  var tabs   = document.querySelectorAll('[data-people-toggle]');
  var panels = document.querySelectorAll('[data-people]');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var people = tab.dataset.peopleToggle;
      tabs.forEach(function (t) {
        t.classList.toggle('is-on', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.people === people);
      });
    });
  });
})();

// ── FAQ — Accordéon ────────────────────────────────────────────────────────
(function faq() {
  var items = document.querySelectorAll('.faq__item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      // ferme tous
      items.forEach(function (i) {
        i.classList.remove('is-open');
        i.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });
      // ouvre celui-ci si fermé
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // Accessibilité clavier
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
})();

// ── RSVP Wizard ───────────────────────────────────────────────────────────
(function rsvpWizard() {
  var step    = 1;
  var maxStep = 3;
  var prev    = document.getElementById('wiz-prev');
  var next    = document.getElementById('wiz-next');
  var stepEls = document.querySelectorAll('.wiz-step');
  var panels  = document.querySelectorAll('.wiz-panel');
  var success = document.getElementById('rsvp-success');
  var form    = document.getElementById('rsvp-form');
  if (!prev || !next) return;

  function render() {
    stepEls.forEach(function (s) {
      var n = +s.dataset.step;
      s.classList.toggle('is-current', n === step);
      s.classList.toggle('is-done',    n < step);
    });
    panels.forEach(function (p) {
      p.classList.toggle('is-active', +p.dataset.panel === step);
    });
    prev.disabled = step === 1;
    next.textContent = step === maxStep ? 'Envoyer →' : 'Suivant →';
  }

  function validateStep() {
    var panel  = document.querySelector('.wiz-panel.is-active');
    var inputs = panel.querySelectorAll('[required]');
    var ok = true;
    inputs.forEach(function (input) {
      var valid = input.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
        : input.value.trim() !== '';
      input.style.borderColor = valid ? '' : 'var(--terracotta)';
      if (!valid) ok = false;
    });
    return ok;
  }

  next.addEventListener('click', function () {
    if (!validateStep()) return;
    if (step < maxStep) {
      step++;
      render();
    } else {
      submitRsvp();
    }
  });

  prev.addEventListener('click', function () {
    if (step > 1) { step--; render(); }
  });

  // Pills cérémonies
  document.querySelectorAll('.pill').forEach(function (pill) {
    pill.addEventListener('click', function () { pill.classList.toggle('is-on'); });
  });

  // Stepper accompagnants
  var cnt       = document.getElementById('wiz-cnt');
  var dec       = document.getElementById('wiz-dec');
  var inc       = document.getElementById('wiz-inc');
  var companions = document.getElementById('wiz-companions');

  function syncCompanions() {
    var n = +cnt.textContent;
    dec.disabled = n <= 1;
    inc.disabled = n >= 8;
    companions.innerHTML = '';
    for (var i = 1; i < n; i++) {
      var input = document.createElement('input');
      input.className = 'field__input';
      input.type = 'text';
      input.placeholder = i === 1 ? 'Prénom de votre +1' : 'Prénom de l\'invité ' + (i + 1);
      input.name = 'companion_' + i;
      companions.appendChild(input);
    }
  }

  dec.addEventListener('click', function () {
    var v = +cnt.textContent;
    if (v > 1) { cnt.textContent = v - 1; syncCompanions(); }
  });
  inc.addEventListener('click', function () {
    var v = +cnt.textContent;
    if (v < 8) { cnt.textContent = v + 1; syncCompanions(); }
  });
  syncCompanions();

  // Soumission
  function submitRsvp() {
    next.disabled = true;
    next.textContent = 'Envoi…';

    var data = {};
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      if (el.name) data[el.name] = el.value;
    });

    var ceremonies = [];
    document.querySelectorAll('.pill.is-on').forEach(function (p) {
      ceremonies.push(p.dataset.value);
    });
    data.ceremonies = ceremonies.join(', ');
    data.guests = document.getElementById('wiz-cnt').textContent;

    var url = window.RSVP_ENDPOINT;
    if (url && url !== 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).finally(showSuccess);
    } else {
      console.log('[RSVP]', data);
      try { localStorage.setItem('rsvp_emma_isaac', JSON.stringify(data)); } catch (e) {}
      setTimeout(showSuccess, 600);
    }
  }

  function showSuccess() {
    form.style.display = 'none';
    document.querySelector('.wiz-steps').style.display = 'none';
    document.querySelector('.wiz-nav').style.display = 'none';
    success.classList.add('is-active');
  }

  render();
})();

// ── Mobile sticky RSVP CTA ────────────────────────────────────────────────
(function mobileCta() {
  var cta  = document.getElementById('mobile-rsvp-cta');
  var rsvp = document.getElementById('rsvp');
  if (!cta || !rsvp) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      // affiche dès qu'on a scrollé au-delà du hero, masque quand RSVP visible
      cta.classList.toggle('is-visible', !entry.isIntersecting);
    });
  }, { threshold: 0 });

  // On observe le hero pour savoir si on l'a quitté
  var hero = document.getElementById('home');
  if (hero) observer.observe(hero);
})();

// ── Convives — carte mondiale D3 (données live depuis le Sheet) ───────────
(function mapConvives() {
  var mapEl = document.getElementById('convives-map');
  if (!mapEl) return;

  var LIBREVILLE = [9.45, 0.39];

  // Données d'exemple affichées avant les premiers RSVP
  var CITIES_EXAMPLE = [
    { name: 'Paris',        lngLat: [2.35,   48.85], guests: 1 },
    { name: 'Lyon',         lngLat: [4.83,   45.76], guests: 1 },
    { name: 'Bruxelles',    lngLat: [4.35,   50.85], guests: 1 },
    { name: 'Genève',       lngLat: [6.14,   46.20], guests: 1 },
    { name: 'Dakar',        lngLat: [-17.47, 14.72], guests: 1 },
    { name: 'Abidjan',      lngLat: [-4.01,   5.35], guests: 1 },
    { name: 'Douala',       lngLat: [9.70,    4.06], guests: 1 },
    { name: 'Brazzaville',  lngLat: [15.28,  -4.27], guests: 1 },
  ];

  // ── Compte à rebours animé ────────────────────────────────
  function countUp(el, target, duration) {
    if (!el || target === null) return;
    if (typeof target !== 'number' || isNaN(target)) { el.textContent = target; return; }
    var start     = 0;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var ease     = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(start + (target - start) * ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Mise à jour des stats ──────────────────────────────────
  function updateStats(cities) {
    var total = 0;
    cities.forEach(function(c) { total += (c.guests || 1); });

    var elT = document.getElementById('convives-total');
    var elV = document.getElementById('convives-cities-count');
    var elC = document.getElementById('convives-countries-count');

    // Pays uniques (depuis les données live avec champ country)
    var countryCount = null;
    if (cities._isLive) {
      var seen = {};
      cities.forEach(function(c) { if (c.country) seen[c.country] = true; });
      var n = Object.keys(seen).length;
      countryCount = n > 0 ? n : null;
    }

    // Anime les chiffres si l'élément est dans le viewport, sinon attend
    function animateWhenVisible(el, value) {
      if (!el) return;
      if (typeof value !== 'number') { el.textContent = value !== null ? value : '—'; return; }
      var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          countUp(el, value, 1200);
          observer.disconnect();
        }
      }, { threshold: 0.5 });
      observer.observe(el);
    }

    animateWhenVisible(elT, total);
    animateWhenVisible(elV, cities.length);
    if (elC) {
      if (countryCount !== null) {
        animateWhenVisible(elC, countryCount);
      } else {
        elC.textContent = '—';
      }
    }
  }

  // ── Rendu D3 ──────────────────────────────────────────────
  function renderMap(cities) {
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

    var W = 960, H = 500;
    var projection = d3.geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);
    var path = d3.geoPath().projection(projection);

    var svg = d3.select(mapEl).append('svg')
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    var defs = svg.append('defs');
    var og = defs.append('radialGradient').attr('id', 'cmap-ocean')
      .attr('cx', '50%').attr('cy', '40%').attr('r', '70%');
    og.append('stop').attr('offset', '0%').attr('stop-color', '#1E1410');
    og.append('stop').attr('offset', '100%').attr('stop-color', '#0E0A07');

    svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'url(#cmap-ocean)');

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(function(world) {
      var countries = topojson.feature(world, world.objects.countries);
      var borders   = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });

      svg.append('g').selectAll('path').data(countries.features).join('path')
        .attr('d', path).attr('fill', '#2E1F12').attr('stroke', 'none');

      svg.append('path').datum(borders).attr('d', path)
        .attr('fill', 'none').attr('stroke', '#4A301A').attr('stroke-width', 0.35);

      svg.append('path').datum({ type: 'Sphere' }).attr('d', path)
        .attr('fill', 'none').attr('stroke', 'rgba(180,90,50,0.15)').attr('stroke-width', 1);

      var libXY = projection(LIBREVILLE);
      var lineG = svg.append('g');
      var cityG = svg.append('g');

      cities.forEach(function(city, i) {
        var lngLat = city.lngLat || [city.lng, city.lat];
        var xy     = projection(lngLat);
        var delay  = 600 + i * 120;

        var line = lineG.append('path')
          .datum({ type: 'LineString', coordinates: [lngLat, LIBREVILLE] })
          .attr('d', path).attr('fill', 'none')
          .attr('stroke', 'rgba(180,90,50,0.35)').attr('stroke-width', 0.7);
        var len = line.node().getTotalLength();
        line.attr('stroke-dasharray', len + ' ' + len).attr('stroke-dashoffset', len)
          .transition().delay(delay).duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

        cityG.append('circle').attr('cx', xy[0]).attr('cy', xy[1]).attr('r', 0)
          .attr('fill', 'rgba(180,90,50,0.15)')
          .transition().delay(delay + 1100).duration(600).attr('r', 7);

        var r = Math.max(2.5, Math.min(6, 2 + (city.guests || 1) * 0.4));
        cityG.append('circle').attr('cx', xy[0]).attr('cy', xy[1]).attr('r', 0)
          .attr('fill', '#B4532F').attr('opacity', 0.9)
          .transition().delay(delay + 1100).duration(400).ease(d3.easeBackOut).attr('r', r);

        cityG.append('text').attr('x', xy[0] + r + 2.5).attr('y', xy[1] + 3)
          .text(city.name)
          .attr('fill', 'rgba(245,236,215,0.55)').attr('font-size', '6.5')
          .attr('font-family', 'Georgia, serif').attr('font-style', 'italic').attr('opacity', 0)
          .transition().delay(delay + 1500).duration(400).attr('opacity', 1);
      });

      // Marker Libreville
      [12, 8].forEach(function(r) {
        cityG.append('circle').attr('cx', libXY[0]).attr('cy', libXY[1]).attr('r', r)
          .attr('fill', 'none').attr('stroke', 'rgba(180,90,50,0.3)').attr('stroke-width', 0.8);
      });
      cityG.append('circle').attr('cx', libXY[0]).attr('cy', libXY[1]).attr('r', 5).attr('fill', '#B4532F');
      cityG.append('text').attr('x', libXY[0] + 8).attr('y', libXY[1] + 3.5)
        .text('Libreville ♦').attr('fill', '#F5ECD7')
        .attr('font-size', '7.5').attr('font-family', 'Georgia, serif').attr('font-style', 'italic');

    }).catch(function() {
      mapEl.innerHTML = '<p style="color:rgba(245,236,215,0.4);text-align:center;padding:3rem;font-style:italic">Carte disponible en ligne.</p>';
    });
  }

  // ── Chargement : données live d'abord, exemple en fallback ─
  var endpoint = window.RSVP_ENDPOINT;
  if (endpoint && endpoint !== 'COLLER_URL_APPS_SCRIPT_ICI') {
    fetch(endpoint)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (Array.isArray(data) && data.length > 0) {
          // Données réelles : {name, lat, lng, guests, country}
          var cities = data.map(function(d) {
            return { name: d.name, lngLat: [d.lng, d.lat], guests: d.guests || 1, country: d.country || '' };
          });
          cities._isLive = true;
          updateStats(cities);
          renderMap(cities);
        } else {
          // Sheet vide → données exemple
          updateStats(CITIES_EXAMPLE);
          renderMap(CITIES_EXAMPLE);
        }
      })
      .catch(function() {
        updateStats(CITIES_EXAMPLE);
        renderMap(CITIES_EXAMPLE);
      });
  } else {
    updateStats(CITIES_EXAMPLE);
    renderMap(CITIES_EXAMPLE);
  }
})();

// ── Jour J — timeline live le 17 et 19 décembre 2026 ─────────────────────
(function jourJ() {
  var SCHEDULE = {
    '17': [
      { time: '14:30', label: 'Accueil des invités' },
      { time: '15:00', label: 'Cérémonie civile' },
      { time: '17:00', label: 'Vin d\'honneur' },
      { time: '20:00', label: 'Dîner de gala' },
      { time: '23:00', label: 'Soirée dansante' },
    ],
    '19': [
      { time: '12:00', label: 'Déjeuner en famille' },
      { time: '15:00', label: 'Cérémonie coutumière' },
      { time: '17:30', label: 'Offrandes & échanges' },
      { time: '20:00', label: 'Fête traditionnelle' },
    ]
  };

  var now = new Date();
  var y = now.getFullYear(), mo = now.getMonth() + 1, d = now.getDate();

  // Prévisualisation : ajoutez ?jourlive=17 ou ?jourlive=19 à l'URL
  var params = new URLSearchParams(window.location.search);
  var preview = params.get('jourlive');

  var dayKey = null;
  if (preview === '17' || preview === '19') {
    dayKey = preview;
  } else if (y === 2026 && mo === 12 && (d === 17 || d === 19)) {
    dayKey = String(d);
  }

  if (!dayKey) return;

  document.body.classList.add('is-jour-j', 'is-jour-j-' + dayKey);

  var panel    = document.getElementById('hero-jour-j');
  var timeline = document.getElementById('jourlive-timeline');
  var dayName  = document.getElementById('jourlive-dayname');
  if (!panel || !timeline) return;

  panel.setAttribute('aria-hidden', 'false');
  if (dayName) dayName.textContent = dayKey === '17'
    ? '17 Décembre · Jour I'
    : '19 Décembre · Jour II';

  var events = SCHEDULE[dayKey];

  function toMins(str) {
    var p = str.split(':');
    return +p[0] * 60 + +p[1];
  }

  function render() {
    // Pour la prévisualisation, on utilise l'heure réelle du navigateur
    var t = new Date();
    var nowMins = t.getHours() * 60 + t.getMinutes();

    timeline.innerHTML = '';
    events.forEach(function(ev, i) {
      var evMins   = toMins(ev.time);
      var nextMins = i < events.length - 1 ? toMins(events[i + 1].time) : 24 * 60;
      var state = nowMins >= nextMins ? 'done'
                : nowMins >= evMins  ? 'now'
                : 'upcoming';

      var li = document.createElement('li');
      li.className = 'jourlive__item is-' + state;
      li.innerHTML =
        '<span class="jourlive__time">' + ev.time + '</span>' +
        '<span class="jourlive__bullet" aria-hidden="true"></span>' +
        '<span class="jourlive__label">' + ev.label + '</span>';
      timeline.appendChild(li);
    });
  }

  render();
  setInterval(render, 60000);
})();

// ── Cadeaux — cadeau animé + accordéon + copier ───────────────────────────
(function gifts() {
  var boxWrap = document.getElementById('gifts-box-wrap');
  var boxBtn  = document.getElementById('gifts-box-btn');
  var reveal  = document.getElementById('gifts-reveal');
  var reclose = document.getElementById('gifts-reclose');

  // Ouverture du cadeau
  if (boxBtn) {
    boxBtn.addEventListener('click', function () {
      // 1. Anime le couvercle qui se soulève
      boxWrap.classList.add('is-opening');
      // 2. Après l'animation du couvercle, fait disparaître la boîte
      setTimeout(function () {
        boxWrap.classList.add('is-gone');
        reveal.classList.add('is-open');
        reveal.setAttribute('aria-hidden', 'false');
      }, 380);
    });
  }

  // Fermeture — retour au cadeau
  if (reclose) {
    reclose.addEventListener('click', function () {
      reveal.classList.remove('is-open');
      reveal.setAttribute('aria-hidden', 'true');
      // Ferme les items accordéon ouverts
      document.querySelectorAll('.gifts__item.is-open').forEach(function (i) {
        i.classList.remove('is-open');
        i.querySelector('.gifts__trigger').setAttribute('aria-expanded', 'false');
      });
      setTimeout(function () {
        boxWrap.classList.remove('is-gone', 'is-opening');
      }, 300);
    });
  }

  // Accordéon des modes de paiement
  var items = document.querySelectorAll('.gifts__item');
  items.forEach(function (item) {
    var btn = item.querySelector('.gifts__trigger');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      items.forEach(function (i) {
        i.classList.remove('is-open');
        i.querySelector('.gifts__trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Copier dans le presse-papiers
  var svgCopy = '<svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true"><rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M9 4V2.5A1.5 1.5 0 0 0 7.5 1H2.5A1.5 1.5 0 0 0 1 2.5V7.5A1.5 1.5 0 0 0 2.5 9H4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg> ';

  document.querySelectorAll('.gifts__copy-btn').forEach(function (btn) {
    var origLabel = btn.dataset.label;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var el = document.getElementById(btn.dataset.copyId);
      if (!el) return;
      var text = el.textContent.trim();

      function confirm() {
        btn.innerHTML = 'Copié ✓';
        btn.classList.add('is-copied');
        setTimeout(function () {
          btn.innerHTML = svgCopy + origLabel;
          btn.classList.remove('is-copied');
        }, 2200);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(confirm).catch(fallback);
      } else { fallback(); }

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        confirm();
      }
    });
  });

  // ── Virement bancaire — demande sécurisée ──────────────────
  var virForm    = document.getElementById('virement-form');
  var virName    = document.getElementById('virement-name');
  var virContact = document.getElementById('virement-contact');
  var virSubmit  = document.getElementById('virement-submit');
  var virConfirm = document.getElementById('virement-confirm');
  if (virSubmit) {
    virSubmit.addEventListener('click', function () {
      var name    = virName ? virName.value.trim() : '';
      var contact = virContact ? virContact.value.trim() : '';
      if (!name || !contact) {
        if (virName && !name) virName.style.borderColor = 'rgba(176,67,47,0.8)';
        if (virContact && !contact) virContact.style.borderColor = 'rgba(176,67,47,0.8)';
        return;
      }
      virSubmit.disabled = true;
      virSubmit.textContent = 'Envoi…';
      var url = window.RSVP_ENDPOINT;
      var payload = JSON.stringify({ type: 'virement_request', nom: name, contact: contact });
      function done() {
        virForm.classList.add('is-hidden');
        virConfirm.classList.add('is-visible');
      }
      if (url) {
        fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: payload })
          .finally(done);
      } else {
        setTimeout(done, 600);
      }
    });
  }
})();
