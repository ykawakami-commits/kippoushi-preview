(() => {
  'use strict';
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];
  const sales = window.KippoushiSales;
  const storageKey = 'kippoushi.design-preview.v4';
  const validQuantity = n => Number.isSafeInteger(n) && n >= 0 && Number.isSafeInteger(n * sales.commerce.unitPriceYen);
  const state = { sale: 'pre', quantity: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && ['pre', 'in', 'out'].includes(saved.sale)) state.sale = saved.sale;
    if (saved && validQuantity(saved.quantity)) state.quantity = saved.quantity;
  } catch { /* The preview works even when browser storage is unavailable. */ }
  let routeName = '';
  let toastTimer;
  let scrollPending = false;
  const saleNames = { pre: '販売準備中', in: '在庫あり（操作テスト）', out: '売り切れ（表示テスト）' };
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Optional persistence. */ } };
  const clamp = value => { const n = Math.floor(Number(value)); return validQuantity(n) ? Math.max(1, n) : 1; };
  const isPurchasable = () => state.sale === 'in';

  function announce(message, withCart = false) {
    clearTimeout(toastTimer);
    const toast = $('.toast');
    toast.replaceChildren(document.createTextNode(message));
    if (withCart) {
      const link = document.createElement('a');
      link.href = '#/cart';
      link.textContent = 'かごを見る ↗';
      toast.append(link);
    }
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
  }
  function updateQuantityControl(input) {
    const val = clamp(input.value);
    input.value = val;
    const disabled = input.disabled;
    const control = input.closest('.quantity-control');
    $('[data-quantity="-1"]', control).disabled = disabled || val <= 1;
    $('[data-quantity="1"]', control).disabled = disabled || !validQuantity(val + 1);
  }
  function updateState() {
    $$('[data-cart-count]').forEach(el => { el.textContent = state.quantity; });
    $('[data-cart-summary]').textContent = `${state.quantity} 点の商品`;
    $('[data-sale-label]').textContent = saleNames[state.sale];
    $('.release-line>span:nth-child(2)').textContent = saleNames[state.sale];
    $('#sale-state').value = state.sale;
    const add = $('#add-to-cart');
    add.disabled = !isPurchasable();
    add.textContent = state.sale === 'pre' ? '販売開始前です' : state.sale === 'out' ? 'ただいま売り切れです' : 'カートに入れる（試作）　↗';
    $('[data-sale-note]').textContent = state.sale === 'pre' ? '発売日が決まり次第、お知らせします。' : state.sale === 'out' ? '表示テスト中です。実際の在庫状況とは異なります。' : '動作確認専用です。注文・決済は発生しません。購入本数の上限は設けていません。';
    $('#product-quantity').disabled = !isPurchasable();
    updateQuantityControl($('#product-quantity'));
    save();
    if (routeName === 'cart') renderCart();
    if (['checkout', 'checkout-demo'].includes(routeName)) renderCheckout();
  }
  const summary = (checkout = false, demo = false) => `<aside class="order-summary"><h2>${demo ? '注文内容の表示見本' : 'ご注文内容'}</h2><div class="summary-row"><span>${demo ? '吉法師（1本あたり）' : `吉法師 × ${state.quantity}`}</span><span class="price-text">${sales.field('price', false)}${demo ? '' : '／本'}</span></div>${demo ? '' : `<div class="summary-row"><span>商品小計（税込）</span><span class="price-text">${(state.quantity * sales.commerce.unitPriceYen).toLocaleString('ja-JP')}円</span></div>`}<div class="summary-row"><span>送料（クール便）</span><span class="price-text">確認中</span></div><div class="summary-row total"><span>合計（税込）</span><span>未確定</span></div>${checkout ? '' : isPurchasable() ? '<a class="button button-red full" href="#/checkout">購入手続きへ（試作） <span aria-hidden="true">↗</span></a>' : '<button class="button full" disabled>現在は購入できません</button>'}<p>${demo ? '数量は未選択です。' : ''}送料が未確定のため、合計は表示していません。送料無料ではありません。実際のご注文は受け付けておりません。</p></aside>`;
  function renderCart() {
    $('[data-cart-summary]').textContent = `${state.quantity} 点の商品`;
    if (!state.quantity) {
      $('#cart-content').innerHTML = '<div class="empty-cart"><svg width="45" height="54" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M3 8.5h18l1 17H2l1-17Z" stroke="currentColor" stroke-width=".7"/><path d="M8 10V6a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width=".7"/></svg><h2>買い物かごは空です</h2><p>商品ページから追加できます。</p><a class="button button-red" href="#/product">商品を見る <span aria-hidden="true">↗</span></a></div>';
      return;
    }
    $('#cart-content').innerHTML = `<div class="cart-grid"><article class="cart-item"><img src="assets/images/bottle-blue-400.webp" width="400" height="500" alt="吉法師の仮デザイン"><div><small>きっぽうし</small><h2><a href="#/product">吉法師</a></h2><p class="price-text">1本 ${sales.field('price', false)}</p><p>容量：${sales.field('volume', false)}</p><div class="quantity-control"><button type="button" data-quantity="-1" data-target="cart-quantity" aria-label="かごの数量を減らす">−</button><input id="cart-quantity" aria-label="かごの数量" type="number" min="1" step="1" inputmode="numeric" value="${state.quantity}"><button type="button" data-quantity="1" data-target="cart-quantity" aria-label="かごの数量を増やす">＋</button></div><button class="remove-item" type="button" data-remove-item>削除する</button></div></article>${summary()}</div>`;
    updateQuantityControl($('#cart-quantity'));
  }
  function renderCheckout() {
    const demo = routeName === 'checkout-demo';
    $('#checkout-page h1').textContent = demo ? '購入申込画面' : '購入手続き';
    if (!demo && (!state.quantity || !isPurchasable())) {
      $('#checkout-content').innerHTML = `<div class="empty-cart"><h2>${!state.quantity ? '買い物かごは空です。' : '現在は購入できません。'}</h2><p>購入画面の確認は、試作設定の「在庫あり」で商品をカートに追加してください。</p><button type="button" class="button button-outline" data-open-settings>試作設定を開く <span aria-hidden="true">↗</span></button></div>`;
      return;
    }
    $('#checkout-content').innerHTML = `<div class="checkout-layout"><div><form class="checkout-form" id="checkout-form" novalidate><h2>ご購入者さまの年齢</h2><p class="small-note">画面の動作確認用です。入力した年齢は保存・送信しません。</p><label for="buyer-age">年齢（必須）</label><input id="buyer-age" type="number" min="20" max="120" step="1" inputmode="numeric" required aria-describedby="age-guidance age-result" autocomplete="off"> 歳<div id="age-guidance">${sales.warning()}</div><button type="submit" class="button button-red full">入力内容を確認（試作） <span aria-hidden="true">↗</span></button><div id="age-result" class="age-result" role="status" aria-live="polite" hidden></div></form><section class="checkout-conditions" aria-labelledby="checkout-terms-heading"><h2 id="checkout-terms-heading">お申込み前の確認事項</h2><p class="disclosure-pending">一部の販売条件は確認中です。年齢を入力しても注文は確定しません。</p>${sales.table(sales.groups.purchase, false)}<nav class="disclosure-nav"><a href="#/legal">すべての販売条件・販売者情報</a><a href="#/compliance">チェック表との対応</a></nav></section></div>${summary(true, demo)}</div>`;
  }
  function syncCartQuantity(quantity) {
    state.quantity = quantity;
    save();
    $$('[data-cart-count]').forEach(el => { el.textContent = state.quantity; });
    $('[data-cart-summary]').textContent = `${state.quantity} 点の商品`;
    $('.order-summary').outerHTML = summary();
  }
  const info = {
    legal: { title: '販売者情報・特定商取引法に基づく表記', body: sales.legal() },
    alcohol: { title: '酒類販売管理者標識', body: sales.managerPage() },
    compliance: { title: '通販表示の確認', body: sales.checklist() },
    'order-notice': { title: '申込承諾通知の見本', body: sales.notice() },
    'delivery-note': { title: '納品書の見本', body: sales.delivery() },
    privacy: { title: 'プライバシーポリシー', body: '<p>本番のプライバシーポリシーは、運営主体・利用するECサービス・個人情報の取扱いが確定した後に公開します。</p><h2>この試作について</h2><p>カートの数量と試作設定を、お使いのブラウザー内に保存します。決済や受注システムへの送信はありません。年齢入力は保存しません。文字の表示にGoogle Fontsを利用します。</p>' },
    terms: { title: '利用規約', body: '<p>このサイトは、デザインと操作を確認するための試作です。注文の成立、決済、商品の発送は行われません。</p><p>本番の利用規約は、販売条件とECサービスが決まった後、販売主体の確認を経て公開します。</p>' },
    contact: { title: 'お問い合わせ', body: '<p>商品・ご注文に関するお問い合わせ窓口は、販売開始前にご案内します。</p><p>現在、こちらの試作サイトからお問い合わせを送信することはできません。</p>' },
    notes: { title: 'デザインについて', body: '<p>参考イメージ画の生成り、瓦の墨色、松の緑、木の飴色をサイト全体に取り入れました。紙の質感、細い雲と水紋、朱の小さな印を余白に添えています。写真の大きさと明朝体は引き継ぎ、題字・見出し・説明文で文字が現れる動きを変えました。最後は大きな題字と朱印で締めています。</p><h2>写真・題字について</h2><p>商品と縁側の写真は生成イメージです。瓶が写る画像は、ご提供の青い瓶の参考写真に合わせて編集し、スマートフォン用の縦構図も用意しました。商品ラベルと題字は仮デザインです。縁側の生成画像はいだ城の実写ではありません。ご提供のイメージ画は色と意匠の参考にしています。イメージ画と外観写真そのものは掲載していません。雲と水紋の装飾は、このサイト用に作成した線画です。</p><h2>本番に必要な素材</h2><ul><li>最優先：正式ロゴ（SVG・AI）、実物の瓶の正面・背面・ラベル写真（長辺3000px以上）。</li><li>メイン写真：実際のいだ城の縁側に瓶を置いた横構図（3000 × 2000px以上）とスマートフォン用の縦構図（1600 × 2400px以上）。</li><li>人物・物語：二人がお酒に関わる自然な写真、名前の由来・企画の背景についての本人たちの言葉。</li><li>商品情報：容量、味と香り、原材料、アルコール分、製造者、保管方法、発売日。税込価格は3,980円で回答済みです。</li></ul><h2>販売開始まで</h2><p>Shopifyを候補にEC基盤を確認中です。決済・在庫・受注の接続、管理者の選任確認、送料・発送日数・返品受付期限・公開連絡先などの確定が必要です。現在は画面のみの試作です。</p><button class="button button-outline" data-open-settings type="button">カートの動作を確認 <span aria-hidden="true">↗</span></button><div class="notes-links"><a href="docs/REVIEW.html" target="_blank" rel="noopener">デザイン確認版のご案内 ↗</a></div><h2>参考・確認元</h2><div class="notes-links"><a href="https://ec.tamanohikari.co.jp/" target="_blank" rel="noopener noreferrer">玉乃光 公式EC ↗</a><a href="https://dassai.com/" target="_blank" rel="noopener noreferrer">獺祭 ↗</a><a href="https://www.asahi-shuzo-online.jp/" target="_blank" rel="noopener noreferrer">朝日酒造 公式EC ↗</a><a href="https://www.city.nantan.kyoto.jp/www/gove/132/007/000/index_1020241.html" target="_blank" rel="noopener noreferrer">南丹市 ↗</a><a href="https://www.youtube.com/@ida_channel" target="_blank" rel="noopener noreferrer">いだちゃんねる ↗</a></div>' }
  };
  function updateSticky() {
    const bar = $('.mobile-purchase');
    let show = false;
    if (['home', 'about', 'ida', 'faq', 'intro', 'sake'].includes(routeName)) {
      show = $('.hero').getBoundingClientRect().bottom < 0;
      $('a', bar).href = '#/product';
      $('a', bar).innerHTML = '商品を見る <span aria-hidden="true">↗</span>';
    } else if (routeName === 'product' || routeName === 'purchase') {
      const r = $('#purchase').getBoundingClientRect();
      show = r.top > innerHeight - 80 || r.bottom < 0;
      $('a', bar).href = '#/purchase';
      $('a', bar).innerHTML = '購入欄へ <span aria-hidden="true">↓</span>';
    }
    bar.hidden = !show;
  }
  function route(initial = false) {
    const key = location.hash.replace(/^#\/?/, '').split('?')[0] || 'home';
    const homeRoutes = ['home', 'about', 'ida', 'faq', 'intro', 'sake'];
    const sameHome = homeRoutes.includes(routeName) && homeRoutes.includes(key);
    const previous = routeName;
    routeName = key;
    const page = homeRoutes.includes(key) ? 'home' : key === 'purchase' ? 'product' : key === 'checkout-demo' ? 'checkout' : ['product', 'cart', 'checkout'].includes(key) ? key : 'info';
    document.body.classList.toggle('is-home', page === 'home');
    $$('.page').forEach(el => { el.hidden = el.id !== `${page}-page`; });
    $$('dialog[open]').forEach(el => el.close());
    $('.toast').hidden = true;
    if (page === 'cart') renderCart();
    if (page === 'checkout') renderCheckout();
    if (page === 'info') {
      const data = info[key] || {title:'ページが見つかりません',body:'<p>リンク先をご確認ください。</p>'};
      $('#info-content').innerHTML = `<span class="eyebrow">吉法師</span><h1>${data.title}</h1>${data.body}<a class="back-link" href="#/">← トップへ戻る</a>`;
    }
    const titles = { home:'いだちゃんねるの日本酒', about:'吉法師について', ida:'いだちゃんねる', faq:'よくあるご質問', intro:'吉法師について', sake:'お酒', product:'お酒', purchase:'お酒', cart:'買い物かご', checkout:'購入手続き（試作）' };
    document.title = `吉法師｜${key === 'checkout-demo' ? '購入申込画面（見本）' : titles[key] || info[key]?.title || 'ページが見つかりません'}`;
    const anchor = key === 'intro' ? $('#about') : ['about', 'ida', 'faq', 'sake', 'purchase'].includes(key) ? $(`#${key}`) : null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      if (anchor) {
        anchor.scrollIntoView({behavior: !initial && (sameHome || previous === 'product') && !reduced ? 'smooth' : 'instant', block:'start'});
      } else {
        window.scrollTo({top:0,behavior:'instant'});
      }
      if (!initial && !sameHome && !anchor) $('#main').focus({preventScroll:true});
      updateSticky();
      window.dispatchEvent(new CustomEvent('kippoushi:route', {detail:{page,route:key}}));
    });
  }
  const openSettings = () => { $('#sale-state').value = state.sale; $('#preview-dialog').showModal(); };
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView({behavior:'instant'}); });
  $('#open-preview').addEventListener('click', openSettings);
  $$('[data-close-preview]').forEach(btn => btn.addEventListener('click', () => $('#preview-dialog').close()));
  $('#sale-state').addEventListener('change', event => { state.sale = event.target.value; updateState(); });
  $('.menu-toggle').addEventListener('click', () => { $('#mobile-menu').showModal(); $('.menu-toggle').setAttribute('aria-expanded','true'); });
  $('[data-close-menu]').addEventListener('click', () => $('#mobile-menu').close());
  $('#mobile-menu').addEventListener('close', () => $('.menu-toggle').setAttribute('aria-expanded','false'));
  for (const dialog of $$('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  document.addEventListener('click', event => {
    const quantityButton = event.target.closest('[data-quantity]');
    if (quantityButton) {
      const input = $(`#${quantityButton.dataset.target}`);
      const val = clamp(Number(input.value) + Number(quantityButton.dataset.quantity));
      input.value = val;
      input.dispatchEvent(new Event('change', {bubbles:true}));
    }
    if (event.target.closest('[data-remove-item]')) { state.quantity=0; updateState(); announce('買い物かごから削除しました。'); }
    if (event.target.closest('[data-open-settings]')) openSettings();
    if (event.target.closest('[data-print-document]')) window.print();
    const galleryButton = event.target.closest('[data-gallery]');
    if (galleryButton) {
      const gallery = {
        bottle: ['bottle-blue-1000.webp','吉法師の瓶。青い瓶の制作イメージ。ラベルは仮デザイン。','制作イメージ／ラベルは仮デザインです'],
        engawa: ['engawa-blue-1600.webp','縁側に置いた瓶と盃の生成イメージ。','生成イメージ／実際の商品・いだ城ではありません'],
        cups: ['cups-1600.webp','木の縁側とふたつの盃の生成イメージ。','生成した情景イメージ']
      }[galleryButton.dataset.gallery];
      $('#gallery-main').src = `assets/images/${gallery[0]}`;
      $('#gallery-main').alt = gallery[1];
      $('#gallery-caption').textContent = gallery[2];
      $$('[data-gallery]').forEach(b=>b.setAttribute('aria-pressed',String(b===galleryButton)));
    }
    // A repeated in-page navigation still scrolls after a previous manual scroll.
    const link = event.target.closest('a[href^="#/"]');
    if (link && link.getAttribute('href') === location.hash) { event.preventDefault(); route(); }
  });
  document.addEventListener('change', event => {
    if (!['product-quantity','cart-quantity'].includes(event.target.id)) return;
    updateQuantityControl(event.target);
    if (event.target.id === 'cart-quantity') {
      syncCartQuantity(clamp(event.target.value));
    }
  });
  $('#add-to-cart').addEventListener('click', () => {
    if (!isPurchasable()) return;
    const count = clamp($('#product-quantity').value);
    if(!validQuantity(state.quantity + count)){announce('数量が大きすぎるため、この操作テストでは扱えません。');return;}
    state.quantity += count;
    updateState();
    announce(`${count}本を買い物かごに追加しました。`, true);
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'cart-quantity') {
      const quantity = Number(event.target.value);
      if (quantity >= 1 && validQuantity(quantity)) syncCartQuantity(quantity);
      return;
    }
    if (event.target.id !== 'buyer-age') return;
    event.target.removeAttribute('aria-invalid');
    $('#age-result').hidden = true;
    $('#age-result').textContent = '';
  });
  document.addEventListener('submit', event => {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault();
    if (routeName !== 'checkout-demo' && (!state.quantity || !isPurchasable())) { renderCheckout();return; }
    const input = $('#buyer-age');
    const age = Number(input.value);
    const result = $('#age-result');
    result.hidden = false;
    const invalid = input.value.trim() === '' || !Number.isInteger(age) || age < 20 || age > 120;
    input.setAttribute('aria-invalid', String(invalid));
    if (input.value.trim()==='' || !Number.isInteger(age) || age < 0 || age > 120) {
      result.textContent = '年齢を正しい整数で入力してください。';
      input.focus();
    } else if (age < 20) {
      result.textContent = '20歳未満の方への酒類の販売はいたしません。購入手続きを進めることはできません。';
      input.focus();
    } else {
      result.textContent = '入力内容を確認しました。この試作はここまでです。決済・受注システムは未接続のため、注文は確定されません。';
    }
  });
  window.addEventListener('hashchange', () => route());
  window.addEventListener('scroll', () => {
    if(!scrollPending){scrollPending=true;requestAnimationFrame(()=>{updateSticky();scrollPending=false;});}
  }, {passive:true});
  window.addEventListener('resize', updateSticky);
  updateState();
  route(true);
})();
