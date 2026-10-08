(() => {
  'use strict';

  // Set a value only after the seller confirms both its accuracy and publication.
  // null means unconfirmed. Never infer seller details from application contacts.
  const values = {
    sellerName: null, sellerAddress: null, sellerPhone: null, sellerEmail: null,
    representative: null, domesticOffice: null,
    price: null, volume: null, shipping: null, extraCosts: null,
    paymentMethod: null, paymentTiming: null, deliveryTiming: null,
    applicationPeriod: null, cancellation: null, returns: null,
    nonconformity: null, subscription: null, quantityLimit: null,
    otherConditions: null, documentFee: null, emailAdvertising: null,
    acceptanceMethod: null, acceptanceTiming: null,
    shopName: null, shopAddress: null, salesManager: null,
    trainingDate: null, trainingDeadline: null, trainingOrganization: null
  };
  const labels = {
    sellerName: ['販売業者の氏名・名称', '個人は氏名、法人は正式な法人名'],
    sellerAddress: ['販売業者の住所', '公開する郵便番号・所在地'],
    sellerPhone: ['販売業者の電話番号', '購入者が連絡できる電話番号'],
    sellerEmail: ['電子メールアドレス', '公開する問い合わせ先'],
    representative: ['代表者・通信販売業務責任者', '法人の場合の代表者または業務責任者の氏名'],
    domesticOffice: ['外国事業者の国内事務所', '該当する場合の所在地・電話番号。該当の有無を確認'],
    price: ['販売価格（税込）', '商品1本あたりの税込価格'],
    volume: ['容量', '実際の商品の容量'],
    shipping: ['送料', '地域・配送方法ごとの税込送料'],
    extraCosts: ['送料以外の追加費用', '決済手数料・梱包料などの内容と金額、有無'],
    paymentMethod: ['お支払い方法', '利用できる決済手段'],
    paymentTiming: ['お支払い時期', '決済方法ごとの支払期限・決済時点'],
    deliveryTiming: ['商品の引渡時期', '注文・入金から発送またはお届けまでの具体的な日数'],
    applicationPeriod: ['お申込みの期間・期限', '受付期間を設ける場合の開始・終了日時、設定の有無'],
    cancellation: ['申込みの撤回・キャンセル', 'キャンセルの可否・期限・連絡方法'],
    returns: ['返品・交換', '可否・対象・受付期間・返送料の負担・連絡方法'],
    nonconformity: ['不良品・誤配送等への対応', '契約内容に適合しない商品の対応・期限・費用負担'],
    subscription: ['定期購入・継続契約', '有無。該当する場合の回数・総額・契約期間・解約条件'],
    quantityLimit: ['販売数量の制限', '実際の購入上限と制限の有無'],
    otherConditions: ['その他の販売条件', '販売地域・ギフト等の条件、有無'],
    documentFee: ['請求書面・電磁的記録の交付費用', '有料の場合の金額、無料または該当なしの確認'],
    emailAdvertising: ['電子メールによる広告', '実施の有無と、実施する場合の販売業者メールアドレス'],
    acceptanceMethod: ['前払い時の申込承諾通知の方法', '前払いの有無と、該当する場合の通知方法'],
    acceptanceTiming: ['前払い時の申込承諾通知の時期', '通知するタイミングと実際の受注・決済フロー'],
    shopName: ['販売場の名称', '申請・販売主体から確認された販売場の正式名称'],
    shopAddress: ['販売場の所在地', '酒類を販売する販売場の所在地'],
    salesManager: ['酒類販売管理者の氏名', '選任者の氏名'],
    trainingDate: ['酒類販売管理研修受講年月日', '受講証などで確認した年月日'],
    trainingDeadline: ['次回研修の受講期限', '受講日の3年後の前日を基準に、受講証等で確認'],
    trainingOrganization: ['研修実施団体名', '受講した研修の実施団体の正式名称']
  };
  const groups = {
    business: ['sellerName', 'sellerAddress', 'sellerPhone', 'sellerEmail', 'representative', 'domesticOffice'],
    terms: ['price', 'shipping', 'extraCosts', 'paymentMethod', 'paymentTiming', 'deliveryTiming', 'applicationPeriod', 'cancellation', 'returns', 'nonconformity', 'subscription', 'quantityLimit', 'otherConditions', 'documentFee', 'emailAdvertising', 'acceptanceMethod', 'acceptanceTiming'],
    purchase: ['shipping', 'extraCosts', 'paymentMethod', 'paymentTiming', 'deliveryTiming', 'applicationPeriod', 'cancellation', 'returns', 'nonconformity', 'subscription', 'quantityLimit'],
    manager: ['shopName', 'shopAddress', 'salesManager', 'trainingDate', 'trainingDeadline', 'trainingOrganization']
  };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const confirmed = key => typeof values[key] === 'string' && values[key].trim().length > 0;
  const field = (key, hint = true) => confirmed(key) ? escape(values[key]) : `<span class="pending-text">販売者確認待ち</span>${hint ? `<small class="field-hint">${escape(labels[key][1])}</small>` : ''}`;
  const table = (keys, hints = true) => `<dl class="disclosure-list">${keys.map(key => `<div data-disclosure="${key}"><dt>${escape(labels[key][0])}</dt><dd${['price','shipping','extraCosts'].includes(key) ? ' class="price-text"' : ''}>${field(key, hints)}</dd></div>`).join('')}</dl>`;
  const warning = () => '<div class="alcohol-warning"><p>20歳未満の者の飲酒は法律で禁止されています。</p><p>20歳未満の方には酒類を販売いたしません。</p></div>';
  const pendingNotice = '<p class="disclosure-pending">表示内容の確認用です。「販売者確認待ち」の項目は未確定のため、正式な販売条件としては使えません。現在、ご注文・お支払いは受け付けておりません。</p>';
  const manager = hints => table(groups.manager, hints);
  const legal = () => `${pendingNotice}${warning()}<nav class="disclosure-nav" aria-label="販売表示の案内"><a href="#/alcohol">酒類販売管理者標識</a><a href="#/compliance">チェック表との対応</a></nav><h2>販売業者について</h2>${table(groups.business)}<h2>価格・お支払い・お届け・返品等</h2>${table(groups.terms)}<p class="disclosure-footnote">条件付きの項目も、販売者が「該当なし」と確認するまで未確定として扱います。</p>`;
  const managerPage = () => `${pendingNotice}${manager(true)}${warning()}<a class="line-link" href="#/legal">特定商取引法に基づく表記を見る <span aria-hidden="true">↗</span></a>`;
  const notice = () => `<p class="document-badge">通知文面の見本・送信はされません</p>${pendingNotice}<h2>通知方法・通知時期</h2>${table(['acceptanceMethod','acceptanceTiming'])}<section class="sample-document" aria-label="申込承諾通知の文面案"><h2>申込承諾通知（案）</h2><p>ご注文のお申込みを承諾いたしました。ご注文内容は以下のとおりです。</p><dl class="disclosure-list"><div><dt>注文番号・申込日時</dt><dd>本番の受注時に表示</dd></div><div><dt>ご入金日・受領金額</dt><dd class="price-text">前払いを受領した日付・実際の受領金額を表示</dd></div><div><dt>ご注文商品</dt><dd>吉法師（きっぽうし）</dd></div><div><dt>数量</dt><dd>お申込みの数量を表示</dd></div></dl>${table(['price','shipping','extraCosts','paymentMethod','paymentTiming','deliveryTiming','cancellation','returns'])}${warning()}<h3>販売業者・お問い合わせ先</h3>${table(['sellerName','sellerAddress','sellerPhone','sellerEmail'],false)}</section><p class="disclosure-footnote">この画面を表示しても、申込みの承諾やメール送信は行われません。本番では販売者が承認したタイミングで通知する仕組みへの接続が必要です。</p>`;
  const delivery = () => `<p class="document-badge">納品書の見本・実際の納品書ではありません</p><section class="sample-document delivery-document" aria-label="納品書の案"><h2>納品書（案）</h2><p>お宛名・注文番号・発行日・納品日：本番の受注・発送時に表示</p><dl class="disclosure-list"><div><dt>商品名</dt><dd>吉法師（きっぽうし）</dd></div><div><dt>数量</dt><dd>ご注文の数量を表示</dd></div><div><dt>商品代金（税込）・送料・合計</dt><dd class="price-text">確定した注文金額を表示</dd></div></dl>${warning()}<h3>販売業者・お問い合わせ先</h3>${table(['sellerName','sellerAddress','sellerPhone','sellerEmail'],false)}</section><p class="disclosure-footnote">電子的な発送・納品通知にも同じ飲酒禁止の文言を入れます。紙に印刷する場合も価格以上の文字サイズと10ポイント以上の大きさを保ちます。実際の帳票・通知システムへの接続は未実装です。</p><button class="button button-outline no-print" type="button" data-print-document>この見本を印刷する <span aria-hidden="true">↗</span></button>`;
  const checks = [
    ['(1)イ(ｲ)','販売価格・送料',['price','shipping'],'legal'],
    ['(1)イ(ﾛ)','支払時期・方法',['paymentTiming','paymentMethod'],'legal'],
    ['(1)イ(ﾊ)','商品の引渡時期',['deliveryTiming'],'legal'],
    ['(1)イ(ﾆ)','申込期間の定め',['applicationPeriod'],'legal'],
    ['(1)イ(ﾎ)','撤回・解除・返品特約',['cancellation','returns'],'legal'],
    ['(1)イ(ﾍ)','販売業者の氏名・名称、住所、電話',['sellerName','sellerAddress','sellerPhone'],'legal'],
    ['(1)イ(ﾄ)','法人の代表者・業務責任者',['representative'],'legal'],
    ['(1)イ(ﾁ)','外国事業者の国内事務所',['domesticOffice'],'legal'],
    ['(1)イ(ﾘ)','その他の購入者負担',['extraCosts'],'legal'],
    ['(1)イ(ﾇ)','契約不適合に関する責任',['nonconformity'],'legal'],
    ['(1)イ(ﾙ)','定期購入・継続契約',['subscription'],'legal'],
    ['(1)イ(ｦ)','数量制限等の販売条件',['quantityLimit','otherConditions'],'legal'],
    ['(1)イ(ﾜ)','書面・電磁的記録の交付費用',['documentFee'],'legal'],
    ['(1)イ(ｶ)','電子メール広告・メールアドレス',['emailAdvertising','sellerEmail'],'legal'],
    ['(1)ロ','前払い時の申込承諾通知',['acceptanceMethod','acceptanceTiming'],'order-notice'],
    ['(2)イ','サイト上の飲酒禁止・販売禁止表示',null,'product','表示を追加'],
    ['(2)ロ','年齢記載欄と近接する禁止文言',null,'checkout-demo','入力欄・表示・20歳未満の停止を実装'],
    ['(2)ハ','納品書・電子通知の飲酒禁止表示',null,'delivery-note','見本に表示／本番の帳票・通知接続が必要'],
    ['(2)ニ','価格表示以上・紙では10ポイント以上',null,'product','共通の文字サイズで表示'],
    ['(3)①','販売場の名称・所在地',['shopName','shopAddress'],'alcohol'],
    ['(3)②','販売管理者の氏名',['salesManager'],'alcohol'],
    ['(3)③','研修受講年月日',['trainingDate'],'alcohol'],
    ['(3)④','次回研修の受講期限',['trainingDeadline'],'alcohol'],
    ['(3)⑤','研修実施団体名',['trainingOrganization'],'alcohol']
  ];
  const checklist = () => {
    const pending = checks.filter(([, , keys]) => keys && !keys.every(confirmed)).length;
    return `<p>通販チェック表の《(2)についての確認事項》に対応する表示をまとめています。</p><p class="disclosure-pending"><strong>${pending}項目は販売者情報・販売条件の確認待ちです。</strong><br>未確定の項目があるため、現時点では「すべての項目を満たした提出版」ではありません。</p><div class="checklist-table-wrap"><table class="checklist-table"><thead><tr><th scope="col">項目</th><th scope="col">確認内容</th><th scope="col">状況・掲載場所</th></tr></thead><tbody>${checks.map(([code,title,keys,route,status]) => `<tr><th scope="row">${code}</th><td>${title}</td><td>${keys ? (keys.every(confirmed) ? '提供情報を反映' : '<span class="pending-text">販売者確認待ち</span>') : status}<br><a href="#/${route}">画面を確認 ↗</a></td></tr>`).join('')}</tbody></table></div><h2>確認用の画面</h2><nav class="disclosure-nav"><a href="#/legal">特定商取引法に基づく表記</a><a href="#/alcohol">酒類販売管理者標識</a><a href="#/checkout-demo">購入申込画面（見本）</a><a href="#/order-notice">申込承諾通知（案）</a><a href="#/delivery-note">納品書（案）</a></nav><p>通知・納品書は文面と表示の見本です。本番販売では、受注・決済・帳票システムでの実装と販売者による最終確認が必要です。</p>`;
  };
  function mount() {
    document.querySelectorAll('[data-sales-table]').forEach(el => { el.innerHTML = table(groups[el.dataset.salesTable], el.dataset.salesHints !== 'false'); });
    document.querySelectorAll('[data-sales-field]').forEach(el => { el.innerHTML = field(el.dataset.salesField, false); });
  }
  window.KippoushiSales = Object.freeze({values, labels, groups, checks, field, table, warning, legal, managerPage, notice, delivery, checklist, mount});
  mount();
})();
