/* @flow */

type CmPos = { line: number, ch: number };
type CmRange = { anchor: CmPos, head?: CmPos };

/**
 * A position in the editor, with the line & the char number
 * @class
 */
class Pos {
  line: number;
  ch: number;

  /**
   * @param {object} pos
   * @param {number} pos.line
   * @param {number} pos.ch
   */
  constructor({ line, ch }: CmPos) {
    if (typeof line !== "number") throw new TypeError("line is not a number");
    if (typeof ch !== "number") throw new TypeError("ch is not a number");
    /** @type {number} */
    this.line = line;
    /** @type {number} */
    this.ch = ch;
  }

  /**
   * Compare two positions
   * @param {Pos} pos1
   * @param {Pos} pos2
   * @return {number}
   */
  static compare(pos1: Pos, pos2: Pos): number {
    return pos1.line - pos2.line || pos1.ch - pos2.ch;
  }

  /**
   * Sort a list of positions
   * @param {...Pos} positions
   * @return {Pos[]}
   */
  static sort(...positions: Array<Pos>): Array<Pos> {
    return positions.sort((a, b) => Pos.compare(a, b));
  }
}

class Range {
  start: Pos;
  end: Pos;

  /**
   * @param {Pos} start
   * @param {Pos} end
   */
  constructor(start: Pos, end?: Pos) {
    /** @type {Pos} */
    this.start = new Pos(start);
    /** @type {Pos} */
    this.end = new Pos(end || start);
  }

  /**
   * Transform Range to a codemirror's range
   * @return {codemirror.Range}
   */
  toCmRange(): CmRange {
    return {
      anchor: this.start,
      head: this.end
    };
  }

  /**
   * Create a range from a codemirror's range
   * @param {codemirror.Range} range
   * @return {Range}
   */
  static fromCmRange({ anchor, head }: CmRange): Range {
    if (head) {
      return new Range(...Pos.sort(new Pos(anchor), new Pos(head)));
    }

    return new Range(new Pos(anchor));
  }
}

module.exports = { Pos, Range };
