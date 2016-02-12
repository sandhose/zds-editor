'use strict';

import test from 'tape';
import { Pos, Range } from '../src/util';

test('new Pos()', assert => {
  assert.plan(8);
  assert.throws(() => new Pos(), 'should throw if line and ch are not defined');
  assert.throws(() => new Pos({ line: 0 }), 'should throw if ch is not defined');
  assert.throws(() => new Pos({ ch: 0 }), 'should throw if ch is not defined');
  assert.throws(() => new Pos({ line: 'beep' }), 'should throw if line is not a number');
  assert.throws(() => new Pos({ ch: 'boop' }), 'should throw if ch is not a number');

  assert.doesNotThrow(() => new Pos({ line: 0, ch: 42 }),
                      'should not throw if line and ch are numbers');

  const pos = new Pos({ line: 42, ch: 12 });
  assert.equal(pos.line, 42, 'has line property');
  assert.equal(pos.ch, 12, 'has ch property');
});

test('Pos.compare', assert => {
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  const pos3 = new Pos({ line: 2, ch: 3 });

  assert.plan(4);
  assert.true(Pos.compare(pos1, pos2) < 0, 'is negative if a is before b (on the same line)');
  assert.true(Pos.compare(pos2, pos3) < 0, 'is negative if a is before b (on different lines)');
  assert.true(Pos.compare(pos2, pos1) > 0, 'is positive if a is after b');
  assert.equal(Pos.compare(pos1, pos1), 0, 'is equal to 0 if a equal to b');
});

test('Pos.sort', assert => {
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  const pos3 = new Pos({ line: 2, ch: 3 });

  assert.plan(3);
  assert.deepEqual(Pos.sort(pos3, pos2, pos1), [pos1, pos2, pos3],
                   'sorts an array of unordered unique positions');
  assert.deepEqual(Pos.sort(pos1, pos2, pos3), [pos1, pos2, pos3],
                   'keeps positions order whe they are already sorted');
  assert.deepEqual(Pos.sort(pos3, pos2, pos3, pos2, pos1, pos2, pos1),
                   [pos1, pos1, pos2, pos2, pos2, pos3, pos3],
                   'sorts an array of unordered non-unique positions');
});

test('new Range()', assert => {
  assert.plan(6);
  assert.throws(() => new Range(), 'should throw if no start & end are defined');
  assert.throws(() => new Range('beep', 'boop'), 'should throw if start or end are not Pos');
  assert.doesNotThrow(() => new Range(new Pos({ line: 0, ch: 5 }), new Pos({ line: 42, ch: 0 })),
                      'does not throw if start and end are Pos');
  assert.doesNotThrow(() => new Range({ line: 0, ch: 5 }, { line: 42, ch: 0 }),
                      'does not throw if start and end are correct objects');

  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  assert.deepEqual(new Range(pos1, pos2), { start: pos1, end: pos2 },
                   'has start and end property if both were provided');
  assert.deepEqual(new Range(pos1), { start: pos1, end: pos1 },
                   'has the same start and end property if no end was provided');
});

test('Range#toCmRange', assert => {
  assert.plan(1);
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  assert.deepEqual(new Range(pos1, pos2).toCmRange(), { anchor: pos1, head: pos2 },
                   'transforms to codemirror\'s range');
});

test('Range.fromCmRange', assert => {
  assert.plan(2);
  const pos1 = new Pos({ line: 1, ch: 4 });
  const pos2 = new Pos({ line: 1, ch: 8 });
  const range = new Range(pos1, pos2);
  assert.deepEqual(Range.fromCmRange({ anchor: pos1, head: pos2 }), range,
                   'transforms from codemirror\'s range');
  assert.deepEqual(Range.fromCmRange({ anchor: pos2, head: pos1 }), range,
                   'transforms from codemirror\'s range (reverse order)');
});
