/* === localStorage 封装 — 唯一数据IO层 === */

const Storage = {
  /**
   * 读取数据
   * @param {string} key
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Storage.get("${key}") 失败:`, e);
      return defaultValue;
    }
  },

  /**
   * 写入数据
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage.set("${key}") 失败:`, e);
    }
  },

  /**
   * 删除数据
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Storage.remove("${key}") 失败:`, e);
    }
  },

  /**
   * 清除所有 bard_ 前缀的数据
   */
  clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bard_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
};

/* === 剧目池存储 === */
const PlayPoolStore = {
  KEY: 'bard_play_pool',

  /** 默认10部莎士比亚剧目 */
  DEFAULTS: [
    '麦克白',
    '暴风雨',
    '爱的徒劳',
    '李尔王',
    '哈姆雷特',
    '仲夏夜之梦',
    '安东尼与克莉奥特佩拉',
    '皆大欢喜',
    '第十二夜',
    '威尼斯商人'
  ],

  /** 获取当前剧目池 */
  getAll() {
    return Storage.get(this.KEY, [...this.DEFAULTS]);
  },

  /** 保存剧目池 */
  save(plays) {
    Storage.set(this.KEY, plays);
  },

  /** 恢复默认 */
  reset() {
    Storage.set(this.KEY, [...this.DEFAULTS]);
    return [...this.DEFAULTS];
  },

  /**
   * 校验剧目池
   * @param {string[]} plays
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(plays) {
    const errors = [];

    if (!Array.isArray(plays)) {
      return { valid: false, errors: ['剧目池格式错误'] };
    }

    if (plays.length !== 10) {
      errors.push(`剧目池必须有恰好10部剧，当前有 ${plays.length} 部`);
    }

    // 检查空值
    const trimmed = plays.map(p => (typeof p === 'string' ? p.trim() : ''));
    const emptyIndexes = [];
    trimmed.forEach((name, i) => {
      if (name === '') emptyIndexes.push(i + 1);
    });
    if (emptyIndexes.length > 0) {
      errors.push(`第 ${emptyIndexes.join('、')} 部剧目名称为空`);
    }

    // 检查重复（大小写不敏感 + 去空格）
    const lowerNames = trimmed.map(n => n.toLowerCase());
    const seen = {};
    lowerNames.forEach((name, i) => {
      if (name === '') return;
      if (seen[name] !== undefined) {
        errors.push(`"${plays[i]}" 与第 ${seen[name] + 1} 部重复`);
      } else {
        seen[name] = i;
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/* === 历史记录存储 === */
const HistoryStore = {
  KEY: 'bard_history',
  MAX_ENTRIES: 50,

  /** 获取所有历史 */
  getAll() {
    return Storage.get(this.KEY, []);
  },

  /**
   * 添加一条历史记录
   * @param {{ rankings: Array, playPool: Array, timestamp: number }} game
   * @returns {object} 保存后的记录（含 id）
   */
  add(game) {
    const history = this.getAll();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: game.timestamp || Date.now(),
      rankings: game.rankings,
      playPool: game.playPool
    };

    history.unshift(entry);

    // 上限50条
    if (history.length > this.MAX_ENTRIES) {
      history.length = this.MAX_ENTRIES;
    }

    Storage.set(this.KEY, history);
    return entry;
  },

  /**
   * 删除一条记录
   * @param {string} id
   */
  remove(id) {
    const history = this.getAll().filter(h => h.id !== id);
    Storage.set(this.KEY, history);
  },

  /** 清空全部历史 */
  clear() {
    Storage.set(this.KEY, []);
  },

  /**
   * 按 id 获取单条记录
   * @param {string} id
   * @returns {object|null}
   */
  getById(id) {
    return this.getAll().find(h => h.id === id) || null;
  }
};

/* === 游戏进行中状态（sessionStorage — 页面刷新后恢复，关闭标签页后清除）=== */
const CurrentGameStore = {
  KEY: 'bard_current_game',

  /** 保存当前游戏状态 */
  save(gameState) {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(gameState));
    } catch (e) {
      console.error('保存游戏状态失败:', e);
    }
  },

  /** 读取当前游戏状态 */
  load() {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /** 清除当前游戏状态 */
  clear() {
    sessionStorage.removeItem(this.KEY);
  }
};
