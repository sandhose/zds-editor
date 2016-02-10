/**
 * A position in the editor, with the line & the char number
 * @class
 */
class Pos {
  /**
   * @param {object} pos
   * @param {number} pos.line
   * @param {number} pos.ch
   */
  constructor({ line, ch }) {
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
  static compare(pos1, pos2) {
    return pos1.line - pos2.line || pos1.ch - pos2.ch;
  }

  /**
   * Sort a list of positions
   * @param {...Pos} positions
   * @return {Pos[]}
   */
  static sort(...positions) {
    return positions.sort((a, b) => Pos.compare(a, b) >= 0);
  }
}

class Range {
  /**
   * @param {Pos} start
   * @param {Pos} end
   */
  constructor(start, end) {
    /** @type {Pos} */
    this.start = new Pos(start);
    /** @type {Pos} */
    this.end = new Pos(end || start);
  }

  /**
   * Transform Range to a codemirror's range
   * @return {codemirror.Range}
   */
  toCmRange() {
    return {
      anchor: this.start,
      head: this.end,
    };
  }

  /**
   * Create a range from a codemirror's range
   * @param {codemirror.Range} range
   * @return {Range}
   */
  static fromCmRange({ anchor, head }) {
    return new Range(...Pos.sort(anchor, head));
  }
}

export { Pos, Range };
