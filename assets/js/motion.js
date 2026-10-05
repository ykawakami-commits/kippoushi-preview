/* Progressive, finite entrance motion. Native scrolling and readable HTML are the baseline. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const home = document.querySelector('#home-page');
  const hero = document.querySelector('.hero');
  const heroTitle = document.querySelector('.hero-title');
  const heroImage = document.querySelector('.hero-image');
  const scene = document.querySelector('.atmosphere');
  const storyType = document.querySelector('.story-type');
  const footer = document.querySelector('.footer');
  const surfaces = [...home.querySelectorAll('[data-surface]')];
  const targets = new Set();
  const prepared = new WeakSet();
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null;
  const glyphs = text => segmenter ? [...segmenter.segment(text)].map(part => part.segment) : Array.from(text);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  let scheduled = false;
  let currentPage;
  let pageEntrance;
  let observer;

  // Preserve each original string once for assistive technology; visual glyphs are decorative.
  function composeText(element, type) {
    const original = [...element.childNodes];
    const accessible = document.createElement('span');
    accessible.className = 'motion-readable';
    original.forEach(node => accessible.append(node.cloneNode(true)));
    const visual = document.createElement('span');
    visual.className = 'text-visual';
    visual.setAttribute('aria-hidden', 'true');
    let lineIndex = 0;
    let charIndex = 0;
    original.forEach(node => {
      if (node.nodeName === 'BR') {
        visual.append(node.cloneNode());
        lineIndex++;
        charIndex = 0;
        return;
      }
      const text = node.textContent;
      if (!text) return;
      const run = document.createElement('span');
      run.className = 'text-run';
      run.style.setProperty('--line-delay', `${lineIndex * 145}ms`);
      if (type === 'glyphs') {
        glyphs(text).forEach(letter => {
          const char = document.createElement('span');
          char.className = 'text-char';
          char.textContent = letter;
          char.style.setProperty('--char-delay', `${Math.min(lineIndex * 150 + charIndex * 42, 500)}ms`);
          run.append(char);
          charIndex++;
        });
      } else {
        run.textContent = text;
      }
      visual.append(run);
    });
    element.replaceChildren(accessible, visual);
  }
  function reveal(element) {
    element.classList.add('is-visible');
    observer?.unobserve(element);
  }
  function mark(element, type = 'fade', delay = 0) {
    if (!element || prepared.has(element)) return;
    prepared.add(element);
    if (type === 'glyphs' || type === 'lines' || type === 'label') composeText(element, type);
    element.dataset.reveal = type;
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    targets.add(element);
    if (reduce.matches || !observer) reveal(element);
    else observer.observe(element);
  }
  function prepareReveals() {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
      }, { threshold: .12, rootMargin: '0px 0px -4% 0px' });
    }
    document.querySelectorAll('#home-page h2, #pdp-title, .pdp-scene .serif').forEach(el => mark(el, 'glyphs'));
    document.querySelectorAll('.featured-description,.story-paragraph>p,.ida-chapter-copy>p,.pdp-description').forEach(el => mark(el, 'lines', 80));
    document.querySelectorAll('.featured-image,.pdp-scene>img').forEach(el => mark(el, 'image'));
    document.querySelectorAll('.featured-copy>.eyebrow,.featured-copy>.product-kana,.ida-heading>.eyebrow,.faq-heading>.eyebrow,.closing-kicker,.closing-note').forEach(el => mark(el, 'label'));
    document.querySelectorAll('.section-index>span,.closing-seal').forEach(el => mark(el, 'stamp', 120));
    document.querySelectorAll('.section-index>p').forEach(el => mark(el, 'fade', 90));
    document.querySelectorAll('.faq-list>details').forEach((el, index) => mark(el, 'fade', Math.min(index * 45, 180)));
    document.querySelectorAll('.featured,.story,.ida-chapter,.closing').forEach(el => mark(el, 'ornament'));
    document.querySelectorAll('.menu-dialog nav a').forEach((el, index) => el.style.setProperty('--menu-delay', `${index * 55}ms`));
  }
  function synchronizePreference() {
    root.classList.toggle('motion-off', reduce.matches);
    if (reduce.matches) {
      targets.forEach(reveal);
      observer?.disconnect();
      pageEntrance?.cancel();
    }
    requestUpdate();
  }
  function updateFrame() {
    scheduled = false;
    let tone = 'light';
    if (!home.hidden) {
      const marker = innerWidth <= 700 ? 112 : 138;
      const current = surfaces.find(el => {
        const rect = el.getBoundingClientRect();
        return rect.top <= marker && rect.bottom > marker;
      });
      tone = current?.dataset.surface || 'light';
      const rect = hero.getBoundingClientRect();
      const progress = clamp(-rect.top / rect.height, 0, 1);
      if (!reduce.matches) {
        heroImage.style.translate = `0 ${Math.round(progress * rect.height * .12)}px`;
        heroTitle.style.opacity = String(clamp(1 - progress * 1.55, 0, 1));
        const sceneRect = scene.getBoundingClientRect();
        if (sceneRect.bottom > 0 && sceneRect.top < innerHeight) {
          const sceneProgress = clamp((innerHeight - sceneRect.top) / (innerHeight + sceneRect.height), 0, 1);
          scene.style.setProperty('--scene-offset', `${Math.round((sceneProgress - .5) * 55)}px`);
        }
        const typeRect = storyType.getBoundingClientRect();
        if (typeRect.bottom > 0 && typeRect.top < innerHeight) storyType.style.setProperty('--type-offset', `${Math.round((innerHeight / 2 - typeRect.top) * .025)}px`);
      } else {
        heroImage.style.translate = 'none';
        heroTitle.style.opacity = '1';
        scene.style.setProperty('--scene-offset', '0px');
        storyType.style.setProperty('--type-offset', '0px');
      }
    }
    if (footer.getBoundingClientRect().top < 122) tone = 'dark';
    body.dataset.chrome = tone;
    body.classList.toggle('has-scrolled', scrollY > 55);
  }
  function requestUpdate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateFrame); }
  }
  function onRoute() {
    const next = document.querySelector('.page:not([hidden])');
    body.classList.toggle('is-home', next === home);
    if (currentPage !== next) {
      pageEntrance?.cancel();
      // Keep the whole commerce page readable; animate only its heading and photographs.
      if (next === home && currentPage && !reduce.matches) {
        pageEntrance = next.animate([{opacity:.7},{opacity:1}], {duration:350,easing:'ease-out'});
      }
    }
    currentPage = next;
    requestUpdate();
  }
  // Never make a keyboard user wait for an entrance effect.
  document.addEventListener('focusin', event => {
    const target = event.target.closest('[data-reveal]');
    if (target) reveal(target);
  });
  reduce.addEventListener('change', synchronizePreference);
  window.addEventListener('scroll', requestUpdate, {passive:true});
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('kippoushi:route', onRoute);
  window.addEventListener('pageshow', requestUpdate);
  document.addEventListener('visibilitychange', requestUpdate);
  prepareReveals();
  root.classList.add('motion-ready');
  synchronizePreference();
  onRoute();
})();
