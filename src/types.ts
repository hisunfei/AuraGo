/**
 * 炁体围棋 - 类型定义
 */

// 棋子颜色
export enum StoneColor {
  Empty = 0,
  Black = 1,
  White = 2
}

// 棋盘坐标
export interface Position {
  x: number;
  y: number;
}

// 棋块（一组相连的同色棋子）
export interface StoneGroup {
  id: number;
  color: StoneColor;
  stones: Position[];
  liberties: Position[];
  isDead: boolean;
}

// 气的归属类型
export enum LibertyOwner {
  None = 0,
  Black = 1,
  White = 2,
  Shared = 3  // 公气
}

// 气的信息
export interface LibertyInfo {
  position: Position;
  owner: LibertyOwner;
  groupIds: number[];  // 属于哪些棋块
  libertyCount: number;  // 该棋块的总气数
}

// 特殊状态
export enum SpecialState {
  None = 0,
  Atari = 1,      // 叫吃
  Seki = 2,       // 双活
  Dead = 3,       // 死子
  Ko = 4          // 劫争
}

// 视图模式
export enum ViewMode {
  Pure = 'pure',           // 纯净模式
  Number = 'number',       // 数字模式
  Qi = 'qi',               // 炁视模式
  Fight = 'fight'          // 对杀模式
}

// 游戏状态
export interface GameState {
  board: StoneColor[][];
  currentPlayer: StoneColor;
  moveHistory: Move[];
  captures: {
    black: number;  // 黑方提子数
    white: number;  // 白方提子数
  };
  koPosition: Position | null;  // 劫争位置
  moveCount: number;
  viewMode: ViewMode;
}

// 落子记录
export interface Move {
  position: Position | null;  // null 表示停一手
  color: StoneColor;
  capturedStones: Position[];
  timestamp: number;
}

// 渲染配置
export interface RenderConfig {
  boardSize: number;
  cellSize: number;
  padding: number;
  stoneRadius: number;
}
