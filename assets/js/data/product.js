// 商品情報はこのファイルだけに書く。HTMLには直接書かない。
// あとでShopifyにつなぐときは、ここの値をShopifyの商品データに置き換える。
(() => {
  'use strict';
  const K = (window.Kippoushi = window.Kippoushi || {});
  K.product = Object.freeze({
    name: '吉法師',
    kana: 'きっぽうし',
    priceYen: 3980,
    // 販売状態：'pre'＝販売準備中／'in'＝在庫あり／'out'＝売り切れ
    saleState: 'pre',
    saleLabels: Object.freeze({
      pre: '販売準備中',
      in: '在庫あり（操作テスト）',
      out: '売り切れ（表示テスト）'
    }),
    // 裏ラベル（2026年11月10日に依頼者から一旦確定として受領。変更の可能性あり）
    specs: Object.freeze({
      productName: '純米吟醸 吉法師',
      category: '日本酒',
      ingredients: '米（京都府産）、米こうじ（京都府産米）',
      polishRatio: '60%',
      riceVariety: '祝 100%',
      alcohol: '11度',
      volume: '720ml',
      storage: '要冷蔵',
      maker: '玉乃光酒造株式会社　京都市伏見区東堺町545-2',
      labelNotes: '開栓後は早めにお召し上がりください。'
    }),
    // 商品ページの写真の並び（images.js の名前）
    gallery: Object.freeze(['bottleFront', 'bottleBack', 'bottleLabel', 'bottleCap', 'bottleBase', 'cups'])
  });
})();
