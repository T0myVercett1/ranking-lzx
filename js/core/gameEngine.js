/* === 游戏引擎 — 纯逻辑，零DOM依赖（支持可变剧目数量）=== */

class GameEngine {
  /**
   * @param {string[]} playPool - 剧目名称数组（数量不限）
   */
  constructor(playPool) {
    if (!Array.isArray(playPool) || playPool.length < 2) {
      throw new Error('GameEngine 需要至少 2 部剧目');
    }

    /** @type {string[]} 剧目池 */
    this.playPool = [...playPool];

    /** @type {number} 剧目总数 */
    this.poolSize = playPool.length;

    /** @type {number[]} 预洗牌的揭示顺序 */
    this.revealOrder = this._shuffle(
      Array.from({ length: this.poolSize }, (_, i) => i)
    );

    /** @type {number} 当前揭示到第几部 */
    this.currentIndex = 0;

    /** @type {{ rank: number, playName: string | null }[]} 排名 */
    this.rankings = Array.from({ length: this.poolSize }, (_, i) => ({
      rank: i + 1,
      playName: null
    }));

    /** @type {number} 游戏开始时间戳 */
    this.gameStartTime = Date.now();
  }

  /**
   * Fisher-Yates 洗牌算法
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
   * @returns {string|null}
   */
  revealNext() {
    if (this.currentIndex >= this.poolSize) return null;
    const poolIndex = this.revealOrder[this.currentIndex];
    return this.playPool[poolIndex];
  }

  /**
   * 将当前剧目放置到指定排名
   * @param {number} rankNumber - 排名 1~poolSize
   * @returns {{ success: boolean, error?: string, playName?: string }}
   */
  placePlay(rankNumber) {
    if (rankNumber < 1 || rankNumber > this.poolSize) {
      return { success: false, error: `排名必须在 1~${this.poolSize} 之间` };
    }

    if (this.currentIndex >= this.poolSize) {
      return { success: false, error: '所有剧目已放置完毕' };
    }

    const slot = this.rankings[rankNumber - 1];
    if (slot.playName !== null) {
      return { success: false, error: `第 ${rankNumber} 名已被占据` };
    }

    const playName = this.revealNext();
    if (playName === null) {
      return { success: false, error: '没有待揭示的剧目' };
    }

    slot.playName = playName;
    this.currentIndex++;

    return { success: true, playName };
  }

  /** 游戏是否完成 */
  isComplete() {
    return this.currentIndex >= this.poolSize;
  }

  /** 获取当前进度 */
  getProgress() {
    return {
      placed: this.currentIndex,
      total: this.poolSize
    };
  }

  /** 获取剩余空位的排名号 */
  getRemainingSlots() {
    return this.rankings
      .filter(s => s.playName === null)
      .map(s => s.rank);
  }

  /** 获取已填充的排名 */
  getFilledSlots() {
    return this.rankings
      .filter(s => s.playName !== null)
      .map(s => ({ rank: s.rank, playName: s.playName }));
  }

  /** 获取完整排名结果 */
  getResult() {
    if (!this.isComplete()) return null;
    return this.rankings.map(r => ({
      rank: r.rank,
      playName: r.playName
    }));
  }

  /** 序列化 */
  toJSON() {
    return {
      playPool: this.playPool,
      poolSize: this.poolSize,
      revealOrder: this.revealOrder,
      currentIndex: this.currentIndex,
      rankings: this.rankings,
      gameStartTime: this.gameStartTime
    };
  }

  /** 反序列化恢复 */
  static fromJSON(json) {
    const engine = Object.create(GameEngine.prototype);
    engine.playPool = json.playPool;
    engine.poolSize = json.poolSize || json.playPool.length;
    engine.revealOrder = json.revealOrder;
    engine.currentIndex = json.currentIndex;
    engine.rankings = json.rankings;
    engine.gameStartTime = json.gameStartTime;
    return engine;
  }
}
