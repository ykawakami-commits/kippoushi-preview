// 買い物かごの処理はこのファイルだけ。
// 画面側から呼ぶのは次の3つだけ：
//   Kippoushi.cart.add(本数)   … かごに追加（マイナスで減らす。0未満にはならない）
//   Kippoushi.cart.count()     … かごの点数を取得
//   Kippoushi.cart.checkout()  … 購入へ進む（行き先は data/config.js の checkoutUrl）
// 点数が変わると document に 'kippoushi:cart' イベントが届く。
// あとでShopifyにつなぐときは、この3つの中身だけを書き換える。
(() => {
  'use strict';
  const K = (window.Kippoushi = window.Kippoushi || {});
  const storageKey = 'kippoushi.cart.v1';
  const valid = n => Number.isSafeInteger(n) && n >= 0 && Number.isSafeInteger(n * K.product.priceYen);
  let quantity = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '0');
    if (valid(saved)) quantity = saved;
  } catch { /* 保存できない環境でも動く */ }

  function add(amount = 1) {
    const change = Math.trunc(Number(amount));
    if (!Number.isFinite(change)) return false;
    const next = Math.max(0, quantity + change);
    if (!valid(next)) return false;
    quantity = next;
    try { localStorage.setItem(storageKey, JSON.stringify(quantity)); } catch { /* 保存は任意 */ }
    document.dispatchEvent(new CustomEvent('kippoushi:cart', { detail: { count: quantity } }));
    return true;
  }
  const count = () => quantity;
  function checkout() {
    location.assign(K.config.checkoutUrl.replace('{quantity}', String(quantity)));
  }

  K.cart = Object.freeze({ add, count, checkout });
})();
