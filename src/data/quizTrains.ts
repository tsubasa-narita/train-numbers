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
];
