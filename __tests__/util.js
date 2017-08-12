const { Pos, Range } = require("../src/util");

test("new Pos()", () => {
  expect.assertions(8);
  expect(() => new Pos()).toThrow();
  expect(() => new Pos({ line: 0 })).toThrow();
  expect(() => new Pos({ ch: 0 })).toThrow();
  expect(() => new Pos({ line: "beep" })).toThrow();
  expect(() => new Pos({ ch: "boop" })).toThrow();

  expect(() => new Pos({ line: 0, ch: 42 })).not.toThrow();

  const pos = new Pos({ line: 42, ch: 12 });
  expect(pos.line).toBe(42);
  expect(pos.ch).toBe(12);
});

test("Pos.compare", () => {
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  const pos3 = new Pos({ line: 2, ch: 3 });

  expect.assertions(4);
  expect(Pos.compare(pos1, pos2) < 0).toBeTruthy();
  expect(Pos.compare(pos2, pos3) < 0).toBeTruthy();
  expect(Pos.compare(pos2, pos1) > 0).toBeTruthy();
  expect(Pos.compare(pos1, pos1)).toBe(0);
});

test("Pos.sort", () => {
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  const pos3 = new Pos({ line: 2, ch: 3 });

  expect.assertions(3);
  expect(Pos.sort(pos3, pos2, pos1)).toEqual([pos1, pos2, pos3]);
  expect(Pos.sort(pos1, pos2, pos3)).toEqual([pos1, pos2, pos3]);
  expect(Pos.sort(pos3, pos2, pos3, pos2, pos1, pos2, pos1)).toEqual([
    pos1,
    pos1,
    pos2,
    pos2,
    pos2,
    pos3,
    pos3
  ]);
});

test("new Range()", () => {
  expect.assertions(6);
  expect(() => new Range()).toThrow();
  expect(() => new Range("beep", "boop")).toThrow();
  expect(
    () => new Range(new Pos({ line: 0, ch: 5 }), new Pos({ line: 42, ch: 0 }))
  ).not.toThrow();
  expect(
    () => new Range({ line: 0, ch: 5 }, { line: 42, ch: 0 })
  ).not.toThrow();

  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  expect(new Range(pos1, pos2)).toEqual({ start: pos1, end: pos2 });
  expect(new Range(pos1)).toEqual({ start: pos1, end: pos1 });
});

test("Range#toCmRange", () => {
  expect.assertions(1);
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  expect(new Range(pos1, pos2).toCmRange()).toEqual({
    anchor: pos1,
    head: pos2
  });
});

test("Range.fromCmRange", () => {
  expect.assertions(2);
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  const range = new Range(pos1, pos2);
  expect(Range.fromCmRange({ anchor: pos1, head: pos2 })).toEqual(range);
  expect(Range.fromCmRange({ anchor: pos2, head: pos1 })).toEqual(range);
});
