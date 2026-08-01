/* === 游戏引擎 — 纯逻辑，零DOM依赖 === */

class GameEngine {
  /**
   * @param {string[]} playPool - 10部剧目名称数组
   */
  constructor(playPool) {
    if (!Array.isArray(playPool) || playPool.length !== 10) {
      throw new Error('GameEngine 需要恰好 10 部剧目');
    }

    /** @type {string[]} 剧目池（按游戏开始时的顺序） */
    this.playPool = [...playPool];

    /** @type {number[]} 预洗牌的揭示顺序（0-9 的随机排列） */
    this.revealOrder = this._shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    /** @type {number} 当前揭示到第几部（0-9） */
    this.currentIndex = 0;

    /** @type {{ rank: number, playName: string | null }[]} 排名 1-10 */
    this.rankings = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      playName: null
    }));

    /** @type {number} 游戏开始时间戳 */
    this.gameStartTime = Date.now();
  }

  /**
   * Fisher-Yates 洗牌算法
   * @param {Array} array
   * @returns {Array} 新数组
   */
  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * 获取当前要揭示的剧目名（幂等 — 不推进索引）
   * @returns {string|null} 剧目名，全部揭示完毕返回 null
   */
  revealNext() {
    if (this.currentIndex >= 10) return null;
    const poolIndex = this.revealOrder[this.currentIndex];
    return this.playPool[poolIndex];
  }

  /**
   * 将当前剧目放置到指定排名
   * @param {number} rankNumber - 排名 1-10
   * @returns {{ success: boolean, error?: string, playName?: string }}
   */
  placePlay(rankNumber) {
    // 检查排名是否有效
    if (rankNumber < 1 || rankNumber > 10) {
      return { success: false, error: '排名必须在 1~10 之间' };
    }

    // 检查是否还有剧目可放置
    if (this.currentIndex >= 10) {
      return { success: false, error: '所有剧目已放置完毕' };
    }

    // 检查该排名是否已被占用
    const slot = this.rankings[rankNumber - 1];
    if (slot.playName !== null) {
      return { success: false, error: `第 ${rankNumber} 名已被 "${slot.playName}" 占据` };
    }

    // 获取当前剧目并放置
    const playName = this.revealNext();
    if (playName === null) {
      return { success: false, error: '没有待揭示的剧目' };
    }

    slot.playName = playName;
    this.currentIndex++;

    return { success: true, playName };
  }

  /**
   * 游戏是否完成
   * @returns {boolean}
   */
  isComplete() {
    return this.currentIndex >= 10;
  }

  /**
   * 获取当前进度 (已放置 / 总数)
   * @returns {{ placed: number, total: number }}
   */
  getProgress() {
    return {
      placed: this.currentIndex,
      total: 10
    };
  }

  /**
   * 获取剩余空位的排名号
   * @returns {number[]}
   */
  getRemainingSlots() {
    return this.rankings
      .filter(s => s.playName === null)
      .map(s => s.rank);
  }

  /**
   * 获取已填充的排名（按排名顺序）
   * @returns {{ rank: number, playName: string }[]}
   */
  getFilledSlots() {
    return this.rankings
      .filter(s => s.playName !== null)
      .map(s => ({ rank: s.rank, playName: s.playName }));
  }

  /**
   * 获取完整排名结果
   * @returns {{ rank: number, playName: string }[] | null}
   */
  getResult() {
    if (!this.isComplete()) return null;
    return this.rankings.map(r => ({
      rank: r.rank,
      playName: r.playName
    }));
  }

  /**
   * 序列化为 JSON（用于持久化）
   * @returns {object}
   */
  toJSON() {
    return {
      playPool: this.playPool,
      revealOrder: this.revealOrder,
      currentIndex: this.currentIndex,
      rankings: this.rankings,
      gameStartTime: this.gameStartTime
    };
  }

  /**
   * 从 JSON 反序列化恢复
   * @param {object} json
   * @returns {GameEngine}
   */
  static fromJSON(json) {
    const engine = Object.create(GameEngine.prototype);
    engine.playPool = json.playPool;
    engine.revealOrder = json.revealOrder;
    engine.currentIndex = json.currentIndex;
    engine.rankings = json.rankings;
    engine.gameStartTime = json.gameStartTime;
    return engine;
  }
}
