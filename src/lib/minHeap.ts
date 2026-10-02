/** 小さい順に取り出す優先キュー。追加・削除は O(log n)。 */
export class MinHeap<T> {
  private items: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}
  get size(): number { return this.items.length; }
  peek(): T | undefined { return this.items[0]; }
  push(value: T): void {
    let index = this.items.length;
    this.items.push(value);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[parent], value) <= 0) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = value;
  }
  pop(): T | undefined {
    const first = this.items[0];
    const last = this.items.pop();
    if (!this.items.length || last === undefined) return first;
    let index = 0;
    while (index * 2 + 1 < this.items.length) {
      let child = index * 2 + 1;
      if (child + 1 < this.items.length && this.compare(this.items[child + 1], this.items[child]) < 0) child++;
      if (this.compare(last, this.items[child]) <= 0) break;
      this.items[index] = this.items[child];
      index = child;
    }
    this.items[index] = last;
    return first;
  }
}
