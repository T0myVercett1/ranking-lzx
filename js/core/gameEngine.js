/* === 游戏引擎 — 纯逻辑，零DOM依赖 === */

class GameEngine {
  /**
   * @param {string[]} playPool - 剧目池（候选数量）
   * @param {object} [options]
   * @param {number} [options.slotCount] - 排名槽位数（默认等于剧目数）
   */
  constructor(playPool, options = {}) {
    if (!Array.isArray(playPool) || playPool.length < 2) {
      throw new Error('GameEngine 需要至少 2 部剧目');
    }

    /** @type {string[]} 剧目池 */
    this.playPool = [...playPool];

    /** @type {number} 剧目总数（揭示数量） */
    this.poolSize = playPool.length;

    /** @type {number} 排名槽位数 */
    this.slotCount = options.slotCount || playPool.length;

    if (this.slotCount < 2) {
      throw new Error('排名槽位至少需要 2 个');
    }

    /** @type {number[]} 预洗牌的揭示顺序 */
    this.revealOrder = this._shuffle(
      Array.from({ length: this.poolSize }, (_, i) => i)
    );

    /** @type {number} 当前揭示到第几部 */
    this.currentIndex = 0;

    /** @type {{ rank: number, playName: string | null }[]} 排名槽位 */
    this.rankings = Array.from({ length: this.slotCount }, (_, i) => ({
      rank: i + 1,
      playName: null
    }));

    /** @type {number} 已跳过数量 */
    this.skippedCount = 0;

    /** @type {number} 游戏开始时间戳 */
    this.gameStartTime = Date.now();
  }

  /** Fisher-Yates 洗牌 */
  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** 获取当前要揭示的剧目名（幂等） */
  revealNext() {
    if (this.currentIndex >= this.poolSize) return null;
    const poolIndex = this.revealOrder[this.currentIndex];
    return this.playPool[poolIndex];
  }

  /**
   * 将当前剧目放置到指定排名
   * @param {number} rankNumber - 排名 1~slotCount
   */
  placePlay(rankNumber) {
    if (rankNumber < 1 || rankNumber > this.slotCount) {
      return { success: false, error: `排名必须在 1~${this.slotCount} 之间` };
    }

    if (this.currentIndex >= this.poolSize) {
      return { success: false, error: '所有剧目已处理完毕' };
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

  /**
   * 跳过当前剧目（不计入排名）
   */
  skip() {
    if (this.currentIndex >= this.poolSize) {
      return { success: false, error: '所有剧目已处理完毕' };
    }
    this.currentIndex++;
    this.skippedCount++;
    return { success: true };
  }

  /**
   * 游戏是否完成（全部剧目处理完 或 所有槽位填满）
   */
  isComplete() {
    if (this.currentIndex >= this.poolSize) return true;
    if (this.getFilledSlots().length >= this.slotCount) return true;
    return false;
  }

  /** 获取当前进度 */
  getProgress() {
    return {
      placed: this.getFilledSlots().length,
      skipped: this.skippedCount,
      total: this.poolSize,
      slotCount: this.slotCount
    };
  }

  /** 剩余空槽位 */
  getRemainingSlots() {
    return this.rankings
      .filter(s => s.playName === null)
      .map(s => s.rank);
  }

  /** 已填充槽位 */
  getFilledSlots() {
    return this.rankings
      .filter(s => s.playName !== null)
      .map(s => ({ rank: s.rank, playName: s.playName }));
  }

  /** 获取最终排名（仅已放置的） */
  getResult() {
    if (!this.isComplete()) return null;
    return this.rankings
      .filter(r => r.playName !== null)
      .map(r => ({
        rank: r.rank,
        playName: r.playName
      }));
  }

  /** 序列化 */
  toJSON() {
    return {
      playPool: this.playPool,
      poolSize: this.poolSize,
      slotCount: this.slotCount,
      revealOrder: this.revealOrder,
      currentIndex: this.currentIndex,
      skippedCount: this.skippedCount,
      rankings: this.rankings,
      gameStartTime: this.gameStartTime
    };
  }

  /** 反序列化 */
  static fromJSON(json) {
    const engine = Object.create(GameEngine.prototype);
    engine.playPool = json.playPool;
    engine.poolSize = json.poolSize || json.playPool.length;
    engine.slotCount = json.slotCount || json.poolSize;
    engine.revealOrder = json.revealOrder;
    engine.currentIndex = json.currentIndex;
    engine.skippedCount = json.skippedCount || 0;
    engine.rankings = json.rankings;
    engine.gameStartTime = json.gameStartTime;
    return engine;
  }
}
