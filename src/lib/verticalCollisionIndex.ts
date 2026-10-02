import type { PositionedEvent } from './types';

interface Node {
  rect: PositionedEvent;
  left: Node | null;
  right: Node | null;
  height: number;
  bottom: number;
}
const height = (node: Node | null) => node?.height ?? 0;
function update(node: Node): Node {
  node.height = 1 + Math.max(height(node.left), height(node.right));
  node.bottom = Math.max(node.rect.y + node.rect.height,
    node.left?.bottom ?? -Infinity, node.right?.bottom ?? -Infinity);
  return node;
}
function rotateLeft(node: Node): Node {
  const root = node.right!;
  node.right = root.left;
  root.left = update(node);
  return update(root);
}
function rotateRight(node: Node): Node {
  const root = node.left!;
  node.left = root.right;
  root.right = update(node);
  return update(root);
}
function insert(node: Node | null, rect: PositionedEvent): Node {
  if (!node) return { rect, left: null, right: null, height: 1, bottom: rect.y + rect.height };
  if (rect.y < node.rect.y) node.left = insert(node.left, rect);
  else node.right = insert(node.right, rect);
  update(node);
  const balance = height(node.left) - height(node.right);
  if (balance > 1) {
    if (height(node.left!.left) < height(node.left!.right)) node.left = rotateLeft(node.left!);
    return rotateRight(node);
  }
  if (balance < -1) {
    if (height(node.right!.right) < height(node.right!.left)) node.right = rotateRight(node.right!);
    return rotateLeft(node);
  }
  return node;
}

/** 上下方向で交差する矩形だけを検索する AVL 木。全件走査を配置ごとに繰り返さない。 */
export class VerticalCollisionIndex {
  private root: Node | null = null;
  add(rect: PositionedEvent): void { this.root = insert(this.root, rect); }
  intersecting(top: number, bottom: number): PositionedEvent[] {
    const matches: PositionedEvent[] = [];
    const visit = (node: Node | null) => {
      if (!node || node.bottom <= top) return;
      visit(node.left);
      if (node.rect.y >= bottom) return;
      if (node.rect.y + node.rect.height > top) matches.push(node.rect);
      visit(node.right);
    };
    visit(this.root);
    return matches;
  }
}
