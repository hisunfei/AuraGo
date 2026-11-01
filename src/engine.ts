/**
 * 炁体围棋 - 游戏引擎
 * 负责围棋规则计算：气的计算、提子、劫争等
 */

import { StoneColor, Position, StoneGroup, GameState, Move, LibertyInfo, LibertyOwner } from './types';

export class GoEngine {
  private boardSize: number;
  private board: StoneColor[][];
  private currentPlayer: StoneColor;
  private moveHistory: Move[];
  private captures: { black: number; white: number };
  private koPosition: Position | null;
  private moveCount: number;

  constructor(boardSize: number = 19) {
    this.boardSize = boardSize;
    this.board = this.createEmptyBoard();
    this.currentPlayer = StoneColor.Black;
    this.moveHistory = [];
    this.captures = { black: 0, white: 0 };
    this.koPosition = null;
    this.moveCount = 0;
  }

  // 创建空棋盘
  private createEmptyBoard(): StoneColor[][] {
    const board: StoneColor[][] = [];
    for (let i = 0; i < this.boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        board[i][j] = StoneColor.Empty;
      }
    }
    return board;
  }

  // 获取棋盘状态
  getBoard(): StoneColor[][] {
    return this.board.map(row => [...row]);
  }

  // 获取当前玩家
  getCurrentPlayer(): StoneColor {
    return this.currentPlayer;
  }

  // 获取提子数
  getCaptures(): { black: number; white: number } {
    return { ...this.captures };
  }

  // 获取手数
  getMoveCount(): number {
    return this.moveCount;
  }

  // 获取劫争位置
  getKoPosition(): Position | null {
    return this.koPosition;
  }

  // 检查坐标是否有效
  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.boardSize && pos.y >= 0 && pos.y < this.boardSize;
  }

  // 获取相邻位置
  private getNeighbors(pos: Position): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 },  // 上
      { x: 0, y: 1 },   // 下
      { x: -1, y: 0 },  // 左
      { x: 1, y: 0 }    // 右
    ];

    for (const dir of directions) {
      const neighbor: Position = {
        x: pos.x + dir.x,
        y: pos.y + dir.y
      };
      if (this.isValidPosition(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  // 获取棋块（使用 BFS）
  getStoneGroup(pos: Position): StoneGroup | null {
    const color = this.board[pos.y][pos.x];
    if (color === StoneColor.Empty) return null;

    const stones: Position[] = [];
    const liberties: Set<string> = new Set();
    const visited: Set<string> = new Set();
    const queue: Position[] = [pos];

    const posKey = (p: Position) => `${p.x},${p.y}`;
    visited.add(posKey(pos));

    while (queue.length > 0) {
      const current = queue.shift()!;
      stones.push(current);

      for (const neighbor of this.getNeighbors(current)) {
        const key = posKey(neighbor);
        const neighborColor = this.board[neighbor.y][neighbor.x];

        if (neighborColor === StoneColor.Empty) {
          liberties.add(key);
        } else if (neighborColor === color && !visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return {
      id: this.hashCode(stones),
      color,
      stones,
      liberties: Array.from(liberties).map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }),
      isDead: false
    };
  }

  // 简单的哈希函数
  private hashCode(stones: Position[]): number {
    let hash = 0;
    for (const stone of stones) {
      hash = ((hash << 5) - hash) + stone.x * 100 + stone.y;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // 获取所有棋块
  getAllStoneGroups(): StoneGroup[] {
    const groups: StoneGroup[] = [];
    const visited: Set<string> = new Set();
    const posKey = (p: Position) => `${p.x},${p.y}`;

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const pos: Position = { x, y };
        const key = posKey(pos);

        if (this.board[y][x] !== StoneColor.Empty && !visited.has(key)) {
          const group = this.getStoneGroup(pos)!;
          for (const stone of group.stones) {
            visited.add(posKey(stone));
          }
          groups.push(group);
        }
      }
    }

    return groups;
  }

  // 检查是否可以落子
  canPlaceStone(pos: Position, color: StoneColor): boolean {
    if (!this.isValidPosition(pos)) return false;
    if (this.board[pos.y][pos.x] !== StoneColor.Empty) return false;

    // 检查劫争
    if (this.koPosition && pos.x === this.koPosition.x && pos.y === this.koPosition.y) {
      return false;
    }

    // 模拟落子
    const tempBoard = this.board.map(row => [...row]);
    tempBoard[pos.y][pos.x] = color;

    // 检查是否能提子
    const opponent = color === StoneColor.Black ? StoneColor.White : StoneColor.Black;
    let canCapture = false;

    for (const neighbor of this.getNeighbors(pos)) {
      if (tempBoard[neighbor.y][neighbor.x] === opponent) {
        const group = this.getGroupOnBoard(tempBoard, neighbor);
        if (group && group.liberties.length === 0) {
          canCapture = true;
          break;
        }
      }
    }

    if (canCapture) return true;

    // 检查自杀
    const selfGroup = this.getGroupOnBoard(tempBoard, pos);
    if (selfGroup && selfGroup.liberties.length === 0) {
      return false;  // 自杀
    }

    return true;
  }

  // 在指定棋盘上获取棋块
  private getGroupOnBoard(board: StoneColor[][], pos: Position): StoneGroup | null {
    const color = board[pos.y][pos.x];
    if (color === StoneColor.Empty) return null;

    const stones: Position[] = [];
    const liberties: Set<string> = new Set();
    const visited: Set<string> = new Set();
    const queue: Position[] = [pos];

    const posKey = (p: Position) => `${p.x},${p.y}`;
    visited.add(posKey(pos));

    while (queue.length > 0) {
      const current = queue.shift()!;
      stones.push(current);

      for (const neighbor of this.getNeighbors(current)) {
        const key = posKey(neighbor);
        const neighborColor = board[neighbor.y][neighbor.x];

        if (neighborColor === StoneColor.Empty) {
          liberties.add(key);
        } else if (neighborColor === color && !visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return {
      id: 0,
      color,
      stones,
      liberties: Array.from(liberties).map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }),
      isDead: false
    };
  }

  // 落子
  placeStone(pos: Position): { success: boolean; capturedStones: Position[] } {
    if (!this.canPlaceStone(pos, this.currentPlayer)) {
      return { success: false, capturedStones: [] };
    }

    this.board[pos.y][pos.x] = this.currentPlayer;
    const capturedStones: Position[] = [];

    // 检查并提子
    const opponent = this.currentPlayer === StoneColor.Black ? StoneColor.White : StoneColor.Black;

    for (const neighbor of this.getNeighbors(pos)) {
      if (this.board[neighbor.y][neighbor.x] === opponent) {
        const group = this.getStoneGroup(neighbor);
        if (group && group.liberties.length === 0) {
          // 提子
          for (const stone of group.stones) {
            this.board[stone.y][stone.x] = StoneColor.Empty;
            capturedStones.push(stone);
          }
        }
      }
    }

    // 更新提子数
    if (capturedStones.length > 0) {
      if (this.currentPlayer === StoneColor.Black) {
        this.captures.black += capturedStones.length;
      } else {
        this.captures.white += capturedStones.length;
      }
    }

    // 检查劫争
    if (capturedStones.length === 1) {
      const selfGroup = this.getStoneGroup(pos);
      if (selfGroup && selfGroup.stones.length === 1 && selfGroup.liberties.length === 1) {
        this.koPosition = capturedStones[0];
      } else {
        this.koPosition = null;
      }
    } else {
      this.koPosition = null;
    }

    // 记录历史
    this.moveHistory.push({
      position: pos,
      color: this.currentPlayer,
      capturedStones,
      timestamp: Date.now()
    });

    // 切换玩家
    this.currentPlayer = opponent;
    this.moveCount++;

    return { success: true, capturedStones };
  }

  // 停一手（Pass）
  pass(): void {
    this.moveHistory.push({
      position: null,
      color: this.currentPlayer,
      capturedStones: [],
      timestamp: Date.now()
    });

    this.currentPlayer = this.currentPlayer === StoneColor.Black ? StoneColor.White : StoneColor.Black;
    this.moveCount++;
    this.koPosition = null;
  }

  // 悔棋
  undo(): boolean {
    if (this.moveHistory.length === 0) return false;

    const lastMove = this.moveHistory.pop()!;
    
    // 恢复棋盘
    if (lastMove.position) {
      this.board[lastMove.position.y][lastMove.position.x] = StoneColor.Empty;
    }

    // 恢复被提的子
    for (const stone of lastMove.capturedStones) {
      const opponent = lastMove.color === StoneColor.Black ? StoneColor.White : StoneColor.Black;
      this.board[stone.y][stone.x] = opponent;
    }

    // 恢复提子数
    if (lastMove.capturedStones.length > 0) {
      if (lastMove.color === StoneColor.Black) {
        this.captures.black -= lastMove.capturedStones.length;
      } else {
        this.captures.white -= lastMove.capturedStones.length;
      }
    }

    // 恢复当前玩家
    this.currentPlayer = lastMove.color;
    this.moveCount--;
    this.koPosition = null;

    return true;
  }

  // 获取气的信息
  getLibertyInfo(): LibertyInfo[] {
    const info: LibertyInfo[] = [];
    const groups = this.getAllStoneGroups();

    for (const group of groups) {
      for (const liberty of group.liberties) {
        // 检查是否是公气
        const neighboringGroups = groups.filter(g => 
          g.id !== group.id && 
          g.liberties.some(l => l.x === liberty.x && l.y === liberty.y)
        );

        let owner: LibertyOwner;
        const groupIds: number[] = [group.id];

        if (neighboringGroups.length > 0) {
          // 检查是否有对方棋块也把这个气作为气
          const hasOpponent = neighboringGroups.some(g => g.color !== group.color);
          if (hasOpponent) {
            owner = LibertyOwner.Shared;
            for (const g of neighboringGroups) {
              if (g.color === group.color) {
                groupIds.push(g.id);
              }
            }
          } else {
            owner = group.color === StoneColor.Black ? LibertyOwner.Black : LibertyOwner.White;
            for (const g of neighboringGroups) {
              groupIds.push(g.id);
            }
          }
        } else {
          owner = group.color === StoneColor.Black ? LibertyOwner.Black : LibertyOwner.White;
        }

        info.push({
          position: liberty,
          owner,
          groupIds,
          libertyCount: group.liberties.length
        });
      }
    }

    // 去重
    const uniqueInfo: LibertyInfo[] = [];
    const seen = new Set<string>();
    for (const item of info) {
      const key = `${item.position.x},${item.position.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueInfo.push(item);
      }
    }

    return uniqueInfo;
  }

  // 重置游戏
  reset(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = StoneColor.Black;
    this.moveHistory = [];
    this.captures = { black: 0, white: 0 };
    this.koPosition = null;
    this.moveCount = 0;
  }
}
