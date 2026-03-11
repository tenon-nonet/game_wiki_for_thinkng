// 目録のマスターデータ
// 実際のデータソース（攻略サイト等）からの取得に切り替える予定
// gameId は DB のゲームIDに合わせて変更してください

export interface CatalogEntry {
  name: string
}

export interface GameCatalog {
  gameId: number
  gameName: string
  items: CatalogEntry[]
  bosses: CatalogEntry[]
  npcs: CatalogEntry[]
}

export const CATALOG: GameCatalog[] = [
  {
    gameId: 1,
    gameName: 'サンプルゲームA',
    items: [
      { name: '長剣' },
      { name: '短剣' },
      { name: '大剣' },
      { name: '魔法の杖' },
      { name: '炎の盾' },
      { name: '古びた指輪' },
      { name: '聖水の瓶' },
      { name: '回復草' },
      { name: '黒い石' },
      { name: '光る鉱石' },
    ],
    bosses: [
      { name: '大守護者' },
      { name: '闇の王' },
      { name: '炎龍' },
      { name: '霧の騎士' },
      { name: '腐敗の女神' },
    ],
    npcs: [
      { name: '老いた商人' },
      { name: '謎の旅人' },
      { name: '鍛冶師のドワーフ' },
      { name: '呪われた騎士' },
      { name: '預言者の娘' },
      { name: '盗賊ギルドの長' },
    ],
  },
  {
    gameId: 2,
    gameName: 'サンプルゲームB',
    items: [
      { name: '雷の槍' },
      { name: '氷の弓' },
      { name: '影の外套' },
      { name: '賢者の石' },
      { name: '不死鳥の羽' },
      { name: '深淵の核' },
    ],
    bosses: [
      { name: '嵐の支配者' },
      { name: '深淵の守護者' },
      { name: '時の番人' },
    ],
    npcs: [
      { name: '流浪の吟遊詩人' },
      { name: '双子の錬金術師' },
      { name: '幽霊の船長' },
      { name: '禁忌の司祭' },
    ],
  },
]
