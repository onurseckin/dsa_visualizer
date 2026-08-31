import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_arrays_and_hashing_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Flat Memory Hash Engine Implementation",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "flat-robin-hood-hash-table",
      title: "High-Performance Robin Hood Hash Table with Backward-Shift Deletion",
      difficulty: "Hard",
      rationale:
        "Implement a cache-conscious open-addressing Hash Table utilizing the Robin Hood displacement principle. The table must support `set(key, value)`, `get(key)`, and `delete(key)` with $O(1)$ amortized operations, dynamic power-of-two resizing at $75\\%$ load factor, and tombstone-free backward-shift deletion.",
      starterCode: `/**
 * High-Performance Robin Hood Hash Table
 */

export class RobinHoodMap {
  private capacity: number;
  private mask: number;
  private keys: Int32Array;
  private values: Float64Array;
  private dibs: Int8Array; // Distance from Initial Bucket
  private occupied: Uint8Array;
  public size: number;

  constructor(initialCap: number = 16) {
    let cap = 1;
    while (cap < initialCap) cap <<= 1;
    this.capacity = cap;
    this.mask = cap - 1;
    this.keys = new Int32Array(cap);
    this.values = new Float64Array(cap);
    this.dibs = new Int8Array(cap).fill(-1);
    this.occupied = new Uint8Array(cap);
    this.size = 0;
  }

  private hash(k: number): number {
    let h = k | 0;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h & this.mask;
  }

  public set(key: number, val: number): void {
    if (this.size >= this.capacity * 0.75) {
      this.rehash(this.capacity << 1);
    }

    let slot = this.hash(key);
    let currKey = key;
    let currVal = val;
    let currDIB = 0;

    while (true) {
      if (!this.occupied[slot]) {
        this.keys[slot] = currKey;
        this.values[slot] = currVal;
        this.dibs[slot] = currDIB;
        this.occupied[slot] = 1;
        this.size++;
        return;
      }

      if (this.keys[slot] === currKey) {
        this.values[slot] = currVal;
        return;
      }

      // Robin Hood swap if incoming element is poorer (higher DIB)
      if (currDIB > this.dibs[slot]) {
        const tmpK = this.keys[slot];
        const tmpV = this.values[slot];
        const tmpDIB = this.dibs[slot];

        this.keys[slot] = currKey;
        this.values[slot] = currVal;
        this.dibs[slot] = currDIB;

        currKey = tmpK;
        currVal = tmpV;
        currDIB = tmpDIB;
      }

      slot = (slot + 1) & this.mask;
      currDIB++;
    }
  }

  public get(key: number): number | undefined {
    let slot = this.hash(key);
    let currDIB = 0;

    while (this.occupied[slot]) {
      if (this.keys[slot] === key) {
        return this.values[slot];
      }
      // Robin Hood early exit: key is guaranteed not present
      if (currDIB > this.dibs[slot]) {
        return undefined;
      }
      slot = (slot + 1) & this.mask;
      currDIB++;
    }
    return undefined;
  }

  public delete(key: number): boolean {
    let slot = this.hash(key);
    let currDIB = 0;

    while (this.occupied[slot]) {
      if (this.keys[slot] === key) {
        this.size--;
        // Backward-shift to eliminate tombstones
        let curr = slot;
        while (true) {
          const next = (curr + 1) & this.mask;
          if (!this.occupied[next] || this.dibs[next] === 0) {
            this.occupied[curr] = 0;
            this.dibs[curr] = -1;
            break;
          }
          this.keys[curr] = this.keys[next];
          this.values[curr] = this.values[next];
          this.dibs[curr] = this.dibs[next] - 1;
          this.occupied[curr] = 1;
          curr = next;
        }
        return true;
      }
      if (currDIB > this.dibs[slot]) return false;
      slot = (slot + 1) & this.mask;
      currDIB++;
    }
    return false;
  }

  private rehash(newCap: number): void {
    const oldKeys = this.keys;
    const oldVals = this.values;
    const oldOcc = this.occupied;
    const oldCap = this.capacity;

    this.capacity = newCap;
    this.mask = newCap - 1;
    this.keys = new Int32Array(newCap);
    this.values = new Float64Array(newCap);
    this.dibs = new Int8Array(newCap).fill(-1);
    this.occupied = new Uint8Array(newCap);
    this.size = 0;

    for (let i = 0; i < oldCap; i++) {
      if (oldOcc[i]) {
        this.set(oldKeys[i], oldVals[i]);
      }
    }
  }
}`,
    },
  ],
};
