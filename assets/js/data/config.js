// 「購入へ進む」の行き先はここだけ。
// Shopifyにつなぐときは、この1行をShopifyの購入画面のURLに差し替える。
// URLの中に {quantity} と書くと、かごの点数に置き換わる。
(() => {
  'use strict';
  const K = (window.Kippoushi = window.Kippoushi || {});
  K.config = Object.freeze({
    checkoutUrl: '#/checkout'
  });
})();
