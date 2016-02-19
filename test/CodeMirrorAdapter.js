const test = require('tape');
const sinon = require('sinon');
const simulant = require('simulant');

const CodeMirrorAdapter = require('../src/CodeMirrorAdapter.js');
const { Range, Pos } = require('../src/util');

test('new CodeMirrorAdapter()', assert => {
  assert.throws(() => new CodeMirrorAdapter(), 'throws when no textarea is provided');
  assert.throws(() => new CodeMirrorAdapter('beep'), 'throws when argument is not a DOMNode');
  assert.throws(() => new CodeMirrorAdapter(document.createElement('div')),
                'throws when node is not a textarea');
  assert.doesNotThrow(() => new CodeMirrorAdapter(document.createElement('textarea')),
                      'does not throw when a textarea is provided');
  assert.end();
});

test('CodeMirrorAdapter#attach', assert => {
  const container = document.createElement('div');
  const textarea = document.createElement('textarea');
  container.appendChild(textarea);
  const adapter = new CodeMirrorAdapter(textarea);

  assert.equal(container.children[0], textarea, 'textarea is left untouched before attach()');
  adapter.attach();

  assert.equal(container.children.length, 1, 'adapter is wrapped in one node');
  assert.equal(container.children[0], adapter.wrapperNode, 'textarea is replaced by wrapperNode');
  assert.ok(container.contains(textarea), 'the same textarea is still in container');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#getText', assert => {
  const textarea = document.createElement('textarea');
  textarea.value = 'beep boop';

  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();
  assert.equal(adapter.getText(), 'beep boop', 'gets the textarea\'s value');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#setText', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText('beep boop');
  assert.equal(textarea.value, 'beep boop', 'changes the textarea\'s value');
  adapter.setText('beep\nboop');
  assert.equal(adapter.getText(), 'beep\nboop', 'reflects the change in getText()');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#listSelections', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();
  adapter.focus();

  adapter.setText('beep\nboop');
  adapter.cm.setSelection({ line: 1, ch: 2 }, { line: 0, ch: 2 });
  assert.deepEqual(adapter.listSelections(), [new Range(
    new Pos({ line: 0, ch: 2 }),
    new Pos({ line: 1, ch: 2 })
  )], 'returns an array with a Range with the selection');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#focus', assert => {
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  assert.notOk(adapter.wrapperNode.contains(document.activeElement),
               'editor should not have the focus');

  adapter.focus();
  assert.ok(adapter.wrapperNode.contains(document.activeElement),
            'editor should have the focus');

  adapter.destroy();
  textarea.remove();
  assert.end();
});

test('CodeMirrorAdapter#getRange', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  assert.equal(adapter.getRange(new Range(
    new Pos({ line: 0, ch: 0 }), new Pos({ line: 0, ch: 4 })
  )), 'beep', 'returns the text of a whole line');
  assert.equal(adapter.getRange(new Range(
    new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 })
  )), 'ep\nbo', 'returns the text of a multi-line range');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#replaceRange', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText('beep');
  adapter.replaceRange('oo', new Range(new Pos({ line: 0, ch: 1 }), new Pos({ line: 0, ch: 3 })));
  assert.equal(adapter.getText(), 'boop', 'should replace a single-line range');

  adapter.setText('be like a while(1)' + '\n'
                + 'an infinite loop');
  adapter.replaceRange('ep bo', new Range(new Pos({ line: 0, ch: 2 }),
                                          new Pos({ line: 1, ch: 14 })));
  assert.equal(adapter.getText(), 'beep boop', 'should replace a multi-line range');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#setSelection', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  adapter.setSelection(new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 })));
  assert.deepEqual(adapter.cm.listSelections(),
                   [{ anchor: { line: 0, ch: 2 }, head: { line: 1, ch: 2 } }],
                   'should select the range');

  adapter.setSelection(new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 0, ch: 4 })),
                       new Range(new Pos({ line: 1, ch: 1 }), new Pos({ line: 1, ch: 2 })));
  assert.deepEqual(adapter.cm.listSelections(), [
                   { anchor: { line: 0, ch: 2 }, head: { line: 0, ch: 4 } },
                   { anchor: { line: 1, ch: 1 }, head: { line: 1, ch: 2 } }],
                   'should select multiple ranges');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#getLine', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  assert.equal(adapter.getLine(0), 'beep', 'should return the first line');
  assert.equal(adapter.getLine(1), 'boop', 'should return the second line');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#lock', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  assert.equal(adapter.cm.getOption('readOnly'), false, 'editor should not be readOnly');
  adapter.lock();
  assert.equal(adapter.cm.getOption('readOnly'), true, 'editor should get locked');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#unlock', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea, { codemirror: { readOnly: true } });
  adapter.attach();

  assert.equal(adapter.cm.getOption('readOnly'), true, 'editor should be readOnly');
  adapter.unlock();
  assert.equal(adapter.cm.getOption('readOnly'), false, 'editor should get unlocked');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#setKeymap', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  const keymap = new Map();
  keymap.set('Ctrl-B', { action: 'beep' });
  keymap.set('Cmd-Ctrl-Alt-B', { action: 'boop' });
  adapter.setKeymap(keymap);

  const keys = adapter.cm.getOption('keyMap');
  const handler = sinon.spy();
  adapter.on('action', handler);

  assert.ok(keys['Ctrl-B'], 'first keymap should be set');
  keys['Ctrl-B'].call();
  assert.ok(handler.calledWith({ action: 'beep' }), 'first keymap should emit action');
  handler.reset();

  assert.ok(keys['Cmd-Ctrl-Alt-B'], 'second keybinding should be set');
  keys['Cmd-Ctrl-Alt-B'].call();
  assert.ok(handler.calledWith({ action: 'boop' }), 'second keybinding should emit action');
  handler.reset();

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#setToolbar', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  const toolbar = new Map();
  toolbar.set('beep', { action: 'beep' });
  toolbar.set('boop', { action: 'boop' });

  const handler = sinon.spy();
  adapter.on('action', handler);
  adapter.setToolbar(toolbar);

  const buttons = adapter.toolbarNode.querySelectorAll('.editor-button');
  assert.equal(buttons[0].innerText, 'beep', 'should append first button');
  assert.equal(buttons[1].innerText, 'boop', 'should append second button');

  simulant.fire(buttons[0], 'click'); // Click first button
  assert.ok(handler.calledWith('beep'),
            'should emit action event on click on the first button');
  handler.reset();

  simulant.fire(buttons[1], 'click'); // Click first button
  assert.ok(handler.calledWith('boop'),
            'should emit action event on click on the second button');
  handler.reset();

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#on paste', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();
  const input = adapter.cm.display.input.getField();

  const handler = sinon.spy();
  adapter.on('paste', handler);

  simulant.fire(input, 'paste');
  assert.ok(handler.calledOnce, 'should be fired');

  adapter.destroy();
  assert.end();
});

test('CodeMirrorAdapter#on drop', assert => {
  const textarea = document.createElement('textarea');
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  const handler = sinon.spy();
  adapter.on('drop', handler);

  const event = simulant('drop');
  event.dataTransfer = { files: [] };
  simulant.fire(adapter.cm.display.scroller, event);
  assert.ok(handler.calledOnce, 'should be fired');

  adapter.destroy();
  assert.end();
});
