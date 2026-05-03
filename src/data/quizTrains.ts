export type QuizTrain = {
  id: string;
  displayName: string;
  model: string;
  memo: string;
  image: string;
};

export const QUIZ_TRAINS: QuizTrain[] = [
  { id: 'komachi', displayName: 'こまち', model: 'E6系', memo: '秋田新幹線「こまち」', image: 'komachi.png' },
  { id: 'hayabusa', displayName: 'はやぶさ', model: 'E5系', memo: '東北・北海道新幹線「はやぶさ」', image: 'hayabusa.png' },
  { id: 'yokosuka', displayName: 'よこすかせん', model: 'E235系1000番台', memo: '横須賀線・総武快速線の新しい主力', image: 'yokosuka_e235_1000.png' },
  { id: 'yamanote', displayName: 'やまのてせん', model: 'E235系0番台', memo: '山手線の現行主力', image: 'yamanote_e235.png' },
  { id: 'seibu40000', displayName: 'せいぶせん', model: '西武40000系', memo: '西武線の新しい通勤車', image: 'seibu40000.jpg' },
  { id: 'tokyu_toyoko', displayName: 'とうきゅう とうよこせん', model: '東急5050系4000番台', memo: '東横線の10両編成代表形式', image: 'tokyu_toyoko_5050_4000.png' },
  { id: 'shonan_shinjuku', displayName: 'しょうなん しんじゅくらいん', model: 'E233系3000番台', memo: '湘南新宿ラインの新しい代表形式', image: 'shonan_shinjuku_e233_3000.png' },
  { id: 'kagayaki', displayName: 'かがやき', model: 'E7系・W7系', memo: '北陸新幹線「かがやき」', image: 'kagayaki_e7_w7.png' },
  { id: 'tsubasa', displayName: 'つばさ', model: 'E8系', memo: '山形新幹線「つばさ」の最新形式', image: 'tsubasa_e8.png' },
  { id: 'saphir_odoriko', displayName: 'サフィールおどりこ', model: 'E261系', memo: 'サフィール踊り子', image: 'saphir_odoriko_e261.png' },
  { id: 'narita_express', displayName: 'なりたエクスプレス', model: 'E259系', memo: '成田エクスプレス', image: 'narita_express_e259.png' },
  { id: 'saikyo_e233_7000', displayName: 'さいきょうせん', model: 'E233系7000番台', memo: '埼京線の主力電車', image: 'saikyo_e233_7000.png' },
  { id: 'joban_e531', displayName: 'じょうばんせん', model: 'E531系', memo: '常磐線の交直流電車', image: 'joban_e531.png' },
  { id: 'marunouchi_2000', displayName: 'まるノうちせん', model: '2000系', memo: '東京メトロ丸ノ内線の新しい電車', image: 'marunouchi_2000.png' },
  { id: 'sl_taiju', displayName: 'SLたいじゅ', model: 'C11形', memo: '東武鉄道のSL大樹', image: 'sl_taiju.png' },
  { id: 'nambu_e233_8000', displayName: 'なんぶせん', model: 'E233系8000番台', memo: '南武線の電車', image: 'nambu_e233_8000.png' },
  { id: 'keihin_tohoku_e233_1000', displayName: 'けいひんとうほくせん', model: 'E233系1000番台', memo: '京浜東北線の電車', image: 'keihin_tohoku_e233_1000.png' },
  { id: 'laview_001', displayName: 'ラビュー', model: '001系', memo: '西武鉄道の特急Laview', image: 'laview_001.png' },
  { id: 'nozomi_n700s', displayName: 'のぞみ', model: 'N700S', memo: '東海道・山陽新幹線「のぞみ」の新しい新幹線', image: 'nozomi_n700s.png' },
  { id: 'doctor_yellow_923', displayName: 'ドクターイエロー', model: '923形', memo: '線路や電気を調べる黄色い新幹線', image: 'doctor_yellow_923.png' },
  { id: 'spacia_n100', displayName: 'スペーシア X', model: 'N100系', memo: '東武鉄道の新しい特急スペーシア X', image: 'spacia_n100.png' },
  { id: 'romancecar_gse', displayName: 'ロマンスカー GSE', model: '70000形', memo: '小田急ロマンスカーの展望席が楽しい特急', image: 'romancecar_gse.png' },
  { id: 'nankai_rapit_50000', displayName: 'ラピート', model: '50000系', memo: '関西空港へ走る南海の特急ラピート', image: 'nankai_rapit_50000.png' },
  { id: 'skyliner_ae', displayName: 'スカイライナー', model: 'AE形', memo: '成田空港へ走る京成の速い特急', image: 'skyliner_ae.png' },
  { id: 'panda_kuroshio_287', displayName: 'パンダくろしお', model: '287系', memo: 'パンダの顔がかわいいJR西日本の特急', image: 'panda_kuroshio_287.png' },
  { id: 'hello_kitty_haruka_271', displayName: 'ハローキティ はるか', model: '271系', memo: '関西空港特急はるかのハローキティデザイン', image: 'hello_kitty_haruka_271.png' },
  { id: 'anpanman_2700', displayName: 'アンパンマン列車', model: '2700系', memo: 'JR四国のアンパンマン列車', image: 'anpanman_2700.png' },
  { id: 'ginza_1000', displayName: 'ぎんざせん', model: '1000系', memo: '東京メトロ銀座線の黄色い電車', image: 'ginza_1000.png' },
];
