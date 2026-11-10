(() => {
  'use strict';
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];
  const sales = window.KippoushiSales;
  // 商品情報・写真・購入先・かごは、それぞれのファイルから受け取る。
  const { product, images, cart } = window.Kippoushi;
  const storageKey = 'kippoushi.design-preview.v5';
  const validQuantity = n => Number.isSafeInteger(n) && n >= 0 && Number.isSafeInteger(n * sales.commerce.unitPriceYen);
  // 販売状態は data/product.js の値。「試作設定」で切り替えたときだけ一時的に上書きする。
  const state = { sale: product.saleState };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && ['pre', 'in', 'out'].includes(saved.sale)) state.sale = saved.sale;
  } catch { /* The preview works even when browser storage is unavailable. */ }
  let routeName = '';
  let toastTimer;
  let pendingAnchor = null;
  const saleNames = product.saleLabels;
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify({ sale: state.sale })); } catch { /* Optional persistence. */ } };
  const clamp = value => { const n = Math.floor(Number(value)); return validQuantity(n) ? Math.max(1, n) : 1; };
  const isPurchasable = () => state.sale === 'in';

  // 商品名・読みを data/product.js から差し込む。
  function mountProduct() {
    $$('[data-product]').forEach(el => { el.textContent = product[el.dataset.product]; });
  }
  // 写真を data/images.js の一覧から差し込む。HTMLには置き場所（data-image）だけがある。
  function mountImages() {
    for (const holder of $$('[data-image]')) {
      const image = images[holder.dataset.image];
      if (!image) continue;
      const small = holder.hasAttribute('data-thumb');
      const sizes = holder.dataset.sizes || '100vw';
      const picture = document.createElement('picture');
      if (image.mobile && !small && !holder.hasAttribute('data-wide')) {
        const source = document.createElement('source');
        source.media = image.mobile.media;
        source.srcset = image.mobile.srcset;
        source.sizes = sizes;
        source.setAttribute('width', image.mobile.width);
        source.setAttribute('height', image.mobile.height);
        picture.append(source);
      }
      const img = document.createElement('img');
      img.alt = image.alt;
      img.width = image.width;
      img.height = image.height;
      // 先に読み込む写真には decoding="async" を付けない。
      // 付けると、固定表示の中でスクロールするまで写真が描かれないことがある（Chromeで確認）。
      const eager = holder.hasAttribute('data-eager');
      if (!eager) img.decoding = 'async';
      img.loading = eager ? 'eager' : 'lazy';
      if (image.preload) img.fetchPriority = 'high';
      if (!small && image.srcset) { img.srcset = image.srcset; img.sizes = sizes; }
      img.src = small ? image.thumb : image.src;
      // 切り抜きの位置。縦長の写真に切り替わる画面では、そちらの位置を使う。
      const tall = image.mobile && !small && !holder.hasAttribute('data-wide') ? matchMedia(image.mobile.media) : null;
      const place = () => { img.style.objectPosition = (tall && tall.matches && image.mobile.position) || image.position || ''; };
      place();
      if (tall) tall.addEventListener('change', place);
      picture.append(img);
      holder.prepend(picture);
      if (holder.hasAttribute('data-caption') && image.caption) {
        const caption = document.createElement('figcaption');
        caption.textContent = image.caption;
        holder.append(caption);
      }
    }
  }
  // 商品ページの写真の切り替えボタンを、商品データの並びから作る。
  function mountGallery() {
    const first = images[product.gallery[0]];
    $('#gallery-main').src = first.src;
    $('#gallery-main').alt = first.alt;
    $('#gallery-caption').textContent = first.caption;
    $('.gallery-thumbs').innerHTML = product.gallery.map((id, index) => {
      const image = images[id];
      const width = image.height > image.width ? 80 : 100;
      return `<button aria-label="${image.label}" aria-pressed="${index === 0}" data-gallery="${id}"><img src="${image.thumb}" width="${width}" height="${Math.round(width * image.height / image.width)}" alt=""></button>`;
    }).join('');
  }
  // 文節の途中で改行しないための予備。word-break: auto-phrase が使えないブラウザだけ BudouX を読み込む。
  let phraseScript = false;
  function mountPhrases() {
    if (window.CSS && CSS.supports('word-break', 'auto-phrase')) return;
    if (!window.customElements) return;
    for (const el of $$('[data-phrase]:not([data-phrased])')) {
      const wrap = document.createElement('budoux-ja');
      wrap.append(...el.childNodes);
      el.append(wrap);
      el.setAttribute('data-phrased', '');
    }
    if (phraseScript) return;
    phraseScript = true;
    const script = document.createElement('script');
    script.src = 'assets/js/vendor/budoux-ja.min.js';
    document.head.append(script);
  }
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
  function updateCount() {
    $$('[data-cart-count]').forEach(el => { el.textContent = cart.count(); });
    $('[data-cart-summary]').textContent = `${cart.count()} 点の商品`;
  }
  function updateState() {
    updateCount();
    $$('[data-sale-label]').forEach(el => { el.textContent = saleNames[state.sale]; });
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
  const summary = (checkout = false, demo = false) => `<aside class="order-summary"><h2>${demo ? '注文内容の表示見本' : 'ご注文内容'}</h2><div class="summary-row"><span>${demo ? `${product.name}（1本あたり）` : `${product.name} × ${cart.count()}`}</span><span class="price-text">${sales.field('price', false)}${demo ? '' : '／本'}</span></div>${demo ? '' : `<div class="summary-row"><span>商品小計（税込）</span><span class="price-text">${(cart.count() * sales.commerce.unitPriceYen).toLocaleString('ja-JP')}円</span></div>`}<div class="summary-row"><span>送料（クール便）</span><span class="price-text">確認中</span></div><div class="summary-row total"><span>合計（税込）</span><span>未確定</span></div>${checkout ? '' : isPurchasable() ? '<button type="button" class="button button-red full" data-checkout>購入手続きへ（試作） <span aria-hidden="true">↗</span></button>' : '<button class="button full" disabled>現在は購入できません</button>'}<p>${demo ? '数量は未選択です。' : ''}送料が未確定のため、合計は表示していません。送料無料ではありません。実際のご注文は受け付けておりません。</p></aside>`;
  function renderCart() {
    updateCount();
    if (!cart.count()) {
      $('#cart-content').innerHTML = '<div class="empty-cart"><svg width="45" height="54" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M3 8.5h18l1 17H2l1-17Z" stroke="currentColor" stroke-width=".7"/><path d="M8 10V6a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width=".7"/></svg><h2>買い物かごは空です</h2><p>商品ページから追加できます。</p><a class="button button-red" href="#/product">商品を見る <span aria-hidden="true">↗</span></a></div>';
      return;
    }
    $('#cart-content').innerHTML = `<div class="cart-grid"><article class="cart-item"><img src="${images.bottleFront.thumb}" width="400" height="500" alt="${images.bottleFront.alt}"><div><small>${product.kana}</small><h2><a href="#/product">${product.name}</a></h2><p class="price-text">1本 ${sales.field('price', false)}</p><p>容量：${sales.field('volume', false)}</p><div class="quantity-control"><button type="button" data-quantity="-1" data-target="cart-quantity" aria-label="かごの数量を減らす">−</button><input id="cart-quantity" aria-label="かごの数量" type="number" min="1" step="1" inputmode="numeric" value="${cart.count()}"><button type="button" data-quantity="1" data-target="cart-quantity" aria-label="かごの数量を増やす">＋</button></div><button class="remove-item" type="button" data-remove-item>削除する</button></div></article>${summary()}</div>`;
    updateQuantityControl($('#cart-quantity'));
  }
  function renderCheckout() {
    const demo = routeName === 'checkout-demo';
    $('#checkout-page h1').textContent = demo ? '購入申込画面' : '購入手続き';
    if (!demo && (!cart.count() || !isPurchasable())) {
      $('#checkout-content').innerHTML = `<div class="empty-cart"><h2>${!cart.count() ? '買い物かごは空です。' : '現在は購入できません。'}</h2><p>購入画面の確認は、試作設定の「在庫あり」で商品をカートに追加してください。</p><button type="button" class="button button-outline" data-open-settings>試作設定を開く <span aria-hidden="true">↗</span></button></div>`;
      return;
    }
    $('#checkout-content').innerHTML = `<div class="checkout-layout"><div>
      <form class="checkout-form" id="checkout-form" novalidate aria-labelledby="age-confirmation-heading">
        <div class="age-confirmation-heading">
          <h2 id="age-confirmation-heading">年齢確認</h2>
          <span class="required-label">必須</span>
        </div>
        <div class="age-field">
          <label for="buyer-age">ご年齢</label>
          <div class="age-entry">
            <input id="buyer-age" name="age" type="number" min="20" max="120" step="1" inputmode="numeric" required aria-describedby="age-guidance age-check-help age-result" autocomplete="off">
            <span>歳</span>
          </div>
        </div>
        <label class="age-confirmation-label" for="buyer-age-confirmed">
          <input id="buyer-age-confirmed" name="age-confirmed" type="checkbox" value="yes" required autocomplete="off" aria-describedby="age-guidance age-check-help age-result">
          <span>私は20歳以上です。</span>
        </label>
        <div id="age-guidance">${sales.warning()}</div>
        <p id="age-check-help" class="age-check-help">年齢を入力し、チェックを入れてから確認へお進みください。</p>
        <button type="submit" class="button button-red full" disabled aria-describedby="age-check-help">入力内容を確認（試作） <span aria-hidden="true">↗</span></button>
        <div id="age-result" class="age-result" role="status" aria-live="polite" hidden></div>
        <p class="small-note">画面の動作確認用です。入力した年齢・チェック内容は保存・送信しません。</p>
      </form>
      <button type="button" class="checkout-print no-print" data-print-document>この画面を印刷する</button><section class="checkout-conditions" aria-labelledby="checkout-terms-heading"><h2 id="checkout-terms-heading">お申込み前の確認事項</h2><p class="disclosure-pending">一部の販売条件は確認中です。年齢を入力しても注文は確定しません。</p>${sales.table(sales.groups.purchase, false)}<nav class="disclosure-nav"><a href="#/legal">すべての販売条件・販売者情報</a><a href="#/compliance">チェック表との対応</a></nav></section></div>${summary(true, demo)}</div>`;
  }
  function syncCartQuantity(quantity) {
    cart.add(quantity - cart.count());
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
    notes: { title: 'デザインについて', body: '<p>参考イメージ画の生成り、瓦の墨色、松の緑、木の飴色をサイト全体に取り入れました。紙の質感、細い雲と水紋、朱の小さな印を余白に添えています。写真の大きさと明朝体は引き継ぎ、題字・見出し・説明文で文字が現れる動きを変えました。最後は大きな題字と朱印で締めています。</p><h2>写真・題字について</h2><p>商品と縁側の写真は生成イメージです。商品写真はご提供の瓶のデザイン画像から切り出しています。縁側の写真は、瓶の横にロゴ入りの白い徳利とおちょこを置いた生成画像で、スマートフォン用の縦構図も用意しました。縁側の生成画像はいだ城の実写ではありません。ご提供のイメージ画は色と意匠の参考にしています。イメージ画と外観写真そのものは掲載していません。雲と水紋の装飾は、このサイト用に作成した線画です。</p><h2>本番に必要な素材</h2><ul><li>最優先：正式ロゴ（SVG・AI）、実物の瓶の正面・背面・ラベル写真（長辺3000px以上）。</li><li>メイン写真：実際のいだ城の縁側に瓶を置いた横構図（3000 × 2000px以上）とスマートフォン用の縦構図（1600 × 2400px以上）。</li><li>人物・物語：二人がお酒に関わる自然な写真、名前の由来・企画の背景についての本人たちの言葉。</li><li>商品情報：容量、味と香り、原材料、アルコール分、製造者、保管方法、発売日。税込価格は3,980円で回答済みです。</li></ul><h2>販売開始まで</h2><p>Shopifyを候補にEC基盤を確認中です。決済・在庫・受注の接続、管理者の選任確認、送料・発送日数・返品受付期限・公開連絡先などの確定が必要です。現在は画面のみの試作です。</p><button class="button button-outline" data-open-settings type="button">カートの動作を確認 <span aria-hidden="true">↗</span></button><div class="notes-links"><a href="docs/REVIEW.html" target="_blank" rel="noopener">デザイン確認版のご案内 ↗</a></div><h2>参考・確認元</h2><div class="notes-links"><a href="https://ec.tamanohikari.co.jp/" target="_blank" rel="noopener noreferrer">玉乃光 公式EC ↗</a><a href="https://dassai.com/" target="_blank" rel="noopener noreferrer">獺祭 ↗</a><a href="https://www.asahi-shuzo-online.jp/" target="_blank" rel="noopener noreferrer">朝日酒造 公式EC ↗</a><a href="https://www.city.nantan.kyoto.jp/www/gove/132/007/000/index_1020241.html" target="_blank" rel="noopener noreferrer">南丹市 ↗</a><a href="https://www.youtube.com/@ida_channel" target="_blank" rel="noopener noreferrer">いだちゃんねる ↗</a></div>' }
  };
  // 行き先へは一気に移動する（なめらかに動かすと、場面1〜7を全部通ってしまうため）。
  function toAnchor(anchor) {
    if (anchor) anchor.scrollIntoView({behavior:'instant', block:'start'});
    else window.scrollTo({top:0, behavior:'instant'});
  }
  function route(initial = false) {
    const key = location.hash.replace(/^#\/?/, '').split('?')[0] || 'home';
    const homeRoutes = ['home', 'about', 'ida', 'faq', 'intro', 'sake'];
    const sameHome = homeRoutes.includes(routeName) && homeRoutes.includes(key);
    routeName = key;
    const page = homeRoutes.includes(key) ? 'home' : key === 'purchase' ? 'product' : key === 'checkout-demo' ? 'checkout' : ['product', 'cart', 'checkout'].includes(key) ? key : 'info';
    document.body.classList.toggle('is-home', page === 'home');
    $$('.page').forEach(el => { el.hidden = el.id !== `${page}-page`; });
    // 場面の切り替え（scenes.js）に、表示するページが変わったことを先に知らせる。
    // （この下でかご・購入・表記の画面を描いたあと、改行の予備をもう一度当てる）
    window.dispatchEvent(new CustomEvent('kippoushi:page', {detail:{page}}));
    $$('dialog[open]').forEach(el => el.close());
    $('.toast').hidden = true;
    if (page === 'cart') renderCart();
    if (page === 'checkout') renderCheckout();
    if (page === 'info') {
      const data = info[key] || {title:'ページが見つかりません',body:'<p>リンク先をご確認ください。</p>'};
      $('#info-content').innerHTML = `<span class="eyebrow">吉法師</span><h1>${data.title}</h1>${data.body}<a class="back-link" href="#/">← トップへ戻る</a>`;
    }
    mountPhrases();
    const titles = { home:'いだちゃんねるの日本酒', about:'いだちゃんねるの日本酒', ida:'いだちゃんねるの日本酒', faq:'ご利用案内', intro:'いだちゃんねるの日本酒', sake:'お酒', product:'お酒', purchase:'お酒', cart:'買い物かご', checkout:'購入手続き（試作）' };
    document.title = `吉法師｜${key === 'checkout-demo' ? '購入申込画面（見本）' : titles[key] || info[key]?.title || 'ページが見つかりません'}`;
    const anchor = ['faq', 'sake', 'purchase'].includes(key) ? $(`#${key}`) : null;
    pendingAnchor = anchor;
    requestAnimationFrame(() => {
      toAnchor(anchor);
      if (!initial && !sameHome && !anchor) $('#main').focus({preventScroll:true});
      window.dispatchEvent(new CustomEvent('kippoushi:route', {detail:{page,route:key}}));
    });
  }
  const openSettings = () => { $('#sale-state').value = state.sale; $('#preview-dialog').showModal(); };
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView({behavior:'instant'}); });
  $('#open-preview').addEventListener('click', openSettings);
  $$('[data-close-preview]').forEach(btn => btn.addEventListener('click', () => $('#preview-dialog').close()));
  $('#sale-state').addEventListener('change', event => { state.sale = event.target.value; updateState(); });
  for (const dialog of $$('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  document.addEventListener('click', event => {
    const quantityButton = event.target.closest('[data-quantity]');
    if (quantityButton) {
      const input = $(`#${quantityButton.dataset.target}`);
      const val = clamp(Number(input.value) + Number(quantityButton.dataset.quantity));
      input.value = val;
      input.dispatchEvent(new Event('change', {bubbles:true}));
    }
    if (event.target.closest('[data-remove-item]')) { cart.add(-cart.count()); updateState(); announce('買い物かごから削除しました。'); }
    if (event.target.closest('[data-open-settings]')) openSettings();
    if (event.target.closest('[data-print-document]')) window.print();
    if (event.target.closest('[data-checkout]')) cart.checkout();
    const galleryButton = event.target.closest('[data-gallery]');
    if (galleryButton) {
      const image = images[galleryButton.dataset.gallery];
      $('#gallery-main').src = image.src;
      $('#gallery-main').alt = image.alt;
      $('#gallery-caption').textContent = image.caption;
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
    if(!cart.add(count)){announce('数量が大きすぎるため、この操作テストでは扱えません。');return;}
    updateState();
    announce(`${count}本を買い物かごに追加しました。`, true);
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'cart-quantity') {
      const quantity = Number(event.target.value);
      if (quantity >= 1 && validQuantity(quantity)) syncCartQuantity(quantity);
      return;
    }
    if (!['buyer-age', 'buyer-age-confirmed'].includes(event.target.id)) return;
    const input = $('#buyer-age');
    const confirmation = $('#buyer-age-confirmed');
    const age = Number(input.value);
    const validAge = input.value.trim() !== '' && Number.isInteger(age) && age >= 20 && age <= 120;
    $('#checkout-form button[type="submit"]').disabled = !validAge || !confirmation.checked;
    event.target.removeAttribute('aria-invalid');
    const underage = input.value.trim() !== '' && Number.isInteger(age) && age >= 0 && age < 20;
    const result = $('#age-result');
    result.hidden = !underage;
    result.textContent = underage ? '20歳未満の方への酒類の販売はいたしません。購入手続きを進めることはできません。' : '';
    if (underage) input.setAttribute('aria-invalid', 'true');
  });
  document.addEventListener('submit', event => {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault();
    if (routeName !== 'checkout-demo' && (!cart.count() || !isPurchasable())) { renderCheckout();return; }
    const input = $('#buyer-age');
    const age = Number(input.value);
    const confirmation = $('#buyer-age-confirmed');
    const result = $('#age-result');
    result.hidden = false;
    const invalid = input.value.trim() === '' || !Number.isInteger(age) || age < 20 || age > 120;
    input.setAttribute('aria-invalid', String(invalid));
    confirmation.setAttribute('aria-invalid', String(!confirmation.checked));
    if (input.value.trim()==='' || !Number.isInteger(age) || age < 0 || age > 120) {
      result.textContent = '年齢を正しい整数で入力してください。';
      input.focus();
    } else if (age < 20) {
      result.textContent = '20歳未満の方への酒類の販売はいたしません。購入手続きを進めることはできません。';
      input.focus();
    } else if (!confirmation.checked) {
      result.textContent = '「私は20歳以上です。」にチェックを入れてください。';
      confirmation.focus();
    } else {
      result.textContent = '入力内容を確認しました。この試作はここまでです。決済・受注システムは未接続のため、注文は確定されません。';
    }
  });
  window.addEventListener('hashchange', () => route());
  // かごの点数が変わったら、上部バーなどの数字を更新する。
  document.addEventListener('kippoushi:cart', updateCount);
  // 場面の固定区間が測り直されたら、行き先（商品・ご利用案内）の位置を合わせ直す。
  window.addEventListener('kippoushi:scenes', () => { if (pendingAnchor) toAnchor(pendingAnchor); });
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(type, () => { pendingAnchor = null; }, {passive:true});
  mountProduct();
  mountImages();
  mountGallery();
  mountPhrases();
  updateState();
  route(true);
})();
