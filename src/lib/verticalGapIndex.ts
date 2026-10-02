interface Node {
  top: number;
  bottom: number;
  left: Node | null;
  right: Node | null;
  height: number;
  firstTop: number;
  lastBottom: number;
  maxGap: number;
}
const height = (node: Node | null) => node?.height ?? 0;
function update(node: Node): Node {
  node.height = 1 + Math.max(height(node.left), height(node.right));
  node.firstTop = node.left?.firstTop ?? node.top;
  node.lastBottom = node.right?.lastBottom ?? node.bottom;
  node.maxGap = Math.max(node.left?.maxGap ?? 0, node.right?.maxGap ?? 0,
    node.left ? node.top - node.left.lastBottom : 0,
    node.right ? node.right.firstTop - node.bottom : 0);
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
function balance(node: Node): Node {
  update(node);
  if (height(node.left) - height(node.right) > 1) {
    if (height(node.left!.left) < height(node.left!.right)) node.left = rotateLeft(node.left!);
    return rotateRight(node);
  }
  if (height(node.right) - height(node.left) > 1) {
    if (height(node.right!.right) < height(node.right!.left)) node.right = rotateRight(node.right!);
    return rotateLeft(node);
  }
  return node;
}
function insert(node: Node | null, top: number, bottom: number): Node {
  if (!node) return { top, bottom, left: null, right: null, height: 1, firstTop: top, lastBottom: bottom, maxGap: 0 };
  if (top < node.top) node.left = insert(node.left, top, bottom);
  else node.right = insert(node.right, top, bottom);
  return balance(node);
}
function remove(node: Node | null, top: number): Node | null {
  if (!node) return null;
  if (top < node.top) node.left = remove(node.left, top);
  else if (top > node.top) node.right = remove(node.right, top);
  else {
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let successor = node.right;
    while (successor.left) successor = successor.left;
    node.top = successor.top; node.bottom = successor.bottom;
    node.right = remove(node.right, successor.top);
  }
  return balance(node);
}
function findInternalGap(node: Node, size: number): number | undefined {
  if (node.left) {
    if (node.left.maxGap >= size) return findInternalGap(node.left, size);
    if (node.top - node.left.lastBottom >= size) return node.left.lastBottom;
  }
  if (node.right) {
    if (node.right.firstTop - node.bottom >= size) return node.bottom;
    if (node.right.maxGap >= size) return findInternalGap(node.right, size);
  }
  return undefined;
}

/** 横方向でまだ交差する出来事の高さを管理し、最初の空きを O(log n) で探す。 */
export class VerticalGapIndex {
  private root: Node | null = null;
  add(top: number, bottom: number): void { this.root = insert(this.root, top, bottom); }
  remove(top: number): void { this.root = remove(this.root, top); }
  firstGap(size: number, minimumTop: number): number {
    if (!this.root || this.root.firstTop - minimumTop >= size) return minimumTop;
    return findInternalGap(this.root, size) ?? this.root.lastBottom;
  }
}
