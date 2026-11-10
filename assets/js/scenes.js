// 場面1〜7の切り替え。GSAP ScrollTrigger で場面を固定（pin）し、スクロール量に合わせて進める（scrub）。
// ・動きは不透明度と横16pxの移動だけ。スナップやスクロールの乗っ取りはしない。
// ・「動きを減らす」設定のとき、GSAPが読めないときは何もしない（全場面が縦に並んだ普通のページのまま）。
(() => {
  'use strict';
  const stage = document.getElementById('stage');
  const bar = document.querySelector('.bar');
  const { gsap, ScrollTrigger } = window;
  if (!stage || !bar || !gsap || !ScrollTrigger) return;

  const FADE = 0.25;     // 現れる・消えるにかける長さ（画面1枚ぶん＝1）
  const HOLD = 0.5;      // 止まっている長さ
  const OVERLAP = 0.1;   // 前の場面が消えきる少し前に、次の場面が現れ始める
  const SHIFT = 16;      // 横に動く量（px）。右から現れ、左へ消える＝縦書きを読み進む向き

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const root = document.documentElement;
    root.classList.add('scenes-on');

    const scenes = [...stage.querySelectorAll('.scene')];
    const frame = scenes[0].querySelector('.scene-frame');
    const pick = (scene, selector) => [...scene.querySelectorAll(selector)];
    const tl = gsap.timeline({ defaults: { ease: 'none', duration: FADE } });

    const moveIn = (targets, at, stagger = 0) => targets.length && tl.fromTo(targets, { opacity: 0, x: SHIFT }, { opacity: 1, x: 0, stagger }, at);
    const moveOut = (targets, at) => targets.length && tl.fromTo(targets, { opacity: 1, x: 0 }, { opacity: 0, x: -SHIFT, immediateRender: false }, at);
    const fadeIn = (targets, at) => targets.length && tl.fromTo(targets, { autoAlpha: 0 }, { autoAlpha: 1 }, at);
    const fadeOut = (targets, at) => targets.length && tl.fromTo(targets, { autoAlpha: 1 }, { autoAlpha: 0, immediateRender: false }, at);

    // 場面1：最初から見えていて、消えるだけ。
    const first = scenes[0];
    moveOut(pick(first, '[data-move]'), HOLD);
    fadeOut(pick(first, '[data-fade], .scene-fill'), HOLD);
    let at = HOLD + FADE - OVERLAP;

    // 場面2〜7。場面3の写真（data-hold）は場面4が消えるまで残す。
    const held = pick(stage, '[data-hold]');
    scenes.slice(1).forEach((scene, index) => {
      const number = index + 2;
      const last = number === scenes.length;
      const movers = pick(scene, '[data-move]');
      const stagger = number === 6 ? 0.3 : number === 2 ? 0.1 : 0;   // 場面6は右から1行ずつ
      const arrived = at + FADE + stagger * (movers.length - 1);
      const leave = arrived + HOLD;

      fadeIn(pick(scene, '.scene-fill'), at - OVERLAP);
      if (scene.contains(held[0])) fadeIn(held, at);
      moveIn(movers, at, stagger);
      fadeIn(pick(scene, '[data-fade]'), at);

      if (last) {
        tl.to({}, { duration: HOLD }, arrived);   // 最後の場面は消さずに、そのまま通常のスクロールへ
        at = leave;
        return;
      }
      moveOut(movers, leave);
      fadeOut(pick(scene, '[data-fade]'), leave);
      fadeOut(pick(scene, '.scene-fill'), leave + OVERLAP);
      if (number === 4) fadeOut(held, leave);
      at = leave + FADE - OVERLAP;
    });

    ScrollTrigger.create({
      animation: tl,
      trigger: stage,
      start: () => `top top+=${bar.offsetHeight}`,
      end: () => `+=${Math.round(frame.offsetHeight * tl.duration())}`,
      pin: true,
      scrub: 0.3,
      invalidateOnRefresh: true
    });

    // 場面に入る前に写真を読み込んでおく（切り替えの途中で抜けないように）。
    stage.querySelectorAll('img').forEach(img => { if (img.decode) img.decode().catch(() => {}); });

    // トップページに戻ってきたら、固定区間の長さを測り直す。
    const onPage = event => { if (event.detail.page === 'home') ScrollTrigger.refresh(); };
    const onRefresh = () => window.dispatchEvent(new CustomEvent('kippoushi:scenes'));
    window.addEventListener('kippoushi:page', onPage);
    ScrollTrigger.addEventListener('refresh', onRefresh);

    return () => {
      root.classList.remove('scenes-on');
      window.removeEventListener('kippoushi:page', onPage);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
    };
  });
})();
