// 写真のパスと代替テキストはこのファイルだけに書く。
// 実写に差し替えるときは、ここの src・srcset・alt・caption を書き換える（HTMLとCSSは触らない）。
// position は、枠に合わせて切り抜くときに「写真のどこを見せるか」（左右% 上下%）。
(() => {
  'use strict';
  const K = (window.Kippoushi = window.Kippoushi || {});
  const dir = 'assets/images/';
  K.images = Object.freeze({
    hero: {
      src: `${dir}hero-tokkuri-1456.webp?v=3`,
      srcset: `${dir}hero-tokkuri-800.webp?v=3 800w, ${dir}hero-tokkuri-1456.webp?v=3 1456w`,
      width: 1456, height: 971,
      position: '50% 62%',
      // 縦長の画面（スマホ・縦向きタブレット）では縦長の写真に切り替える
      mobile: {
        media: '(max-aspect-ratio: 4/5)',
        srcset: `${dir}hero-tokkuri-mobile-600.webp?v=3 600w, ${dir}hero-tokkuri-mobile-725.webp?v=3 700w`,
        width: 700, height: 1456,
        position: '50% 70%'
      },
      alt: '緑の庭を望む縁側に、吉法師の瓶とロゴ入りの白い徳利・おちょこ。生成した撮影イメージ。',
      caption: '制作イメージ',
      preload: true
    },
    cups: {
      src: `${dir}cups-1600.webp`,
      srcset: `${dir}cups-800.webp 800w, ${dir}cups-1600.webp 1600w`,
      thumb: `${dir}cups-800.webp`,
      width: 1536, height: 1024,
      position: '84% 50%',
      alt: '木の縁側とふたつの盃の生成イメージ。',
      caption: '制作イメージ',
      label: '盃の情景イメージ'
    },
    bottleFront: {
      src: `${dir}bottle-front-1000.webp`,
      thumb: `${dir}bottle-front-400.webp`,
      width: 1000, height: 1250,
      alt: '吉法師の瓶の正面。水色の瓶に金色のキャップ、山水を描いたラベル。',
      caption: '制作イメージ',
      label: '瓶の正面'
    },
    bottleBack: {
      src: `${dir}bottle-back-1000.webp`,
      thumb: `${dir}bottle-back-400.webp`,
      width: 1000, height: 1250,
      alt: '吉法師の瓶の裏面。裏ラベルの表示。',
      caption: '制作イメージ',
      label: '瓶の裏面'
    },
    bottleLabel: {
      src: `${dir}bottle-label.webp`,
      thumb: `${dir}bottle-label.webp`,
      width: 453, height: 411,
      alt: '表ラベルの拡大。山水の絵と「吉法師」の題字。',
      caption: '制作イメージ',
      label: 'ラベルの拡大'
    },
    bottleCap: {
      src: `${dir}bottle-cap.webp`,
      thumb: `${dir}bottle-cap.webp`,
      width: 453, height: 386,
      alt: '金色のスクリューキャップの拡大。',
      caption: '制作イメージ',
      label: 'キャップの拡大'
    },
    bottleBase: {
      src: `${dir}bottle-base.webp`,
      thumb: `${dir}bottle-base.webp`,
      width: 453, height: 221,
      alt: '瓶底の「720ml」の刻印。',
      caption: '制作イメージ',
      label: '瓶底の刻印'
    }
  });

  // 最初の画面の写真だけ、ページを開いた直後に先読みする。
  for (const image of Object.values(K.images)) {
    if (!image.preload) continue;
    const add = source => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      if (source.srcset) { link.imageSrcset = source.srcset; link.imageSizes = '100vw'; }
      else link.href = source.src;
      document.head.append(link);
    };
    add(image.mobile && matchMedia(image.mobile.media).matches ? image.mobile : image);
  }
})();
