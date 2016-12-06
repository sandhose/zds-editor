const test = require('tape');
const sinon = require('sinon');
const simulant = require('simulant');
const keycode = require('keycode');

const TextareaAdapter = require('../src/TextareaAdapter');
const { Pos, Range } = require('../src/util');

test('new TextareaAdapter()', (assert) => {
  assert.throws(() => new TextareaAdapter(), 'throws when no textarea is provided');
  assert.throws(() => new TextareaAdapter('beep'), 'throws when argument is not a DOMNode');
  assert.throws(() => new TextareaAdapter(document.createElement('div')),
                'throws when node is not a textarea');
  assert.doesNotThrow(() => new TextareaAdapter(document.createElement('textarea')),
                      'does not throw when a textarea is provided');
  assert.end();
});

test('TextareaAdapter#attach', (assert) => {
  const container = document.createElement('div');
  const textarea = document.createElement('textarea');
  container.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);

  assert.equal(container.children[0], textarea, 'textarea is left untouched before attach()');
  adapter.attach();

  assert.equal(container.children.length, 1, 'adapter is wrapped in one node');
  assert.equal(container.children[0], adapter.wrapperNode, 'textarea is replaced by wrapperNode');
  assert.ok(container.contains(textarea), 'the same textarea is still in container');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#destroy', (assert) => {
  const container = document.createElement('div');
  const textarea = document.createElement('textarea');
  container.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  const wrapper = adapter.wrapperNode;

  adapter.destroy();
  assert.equal(textarea.parentNode, container, 'textarea is reattached to its original parentNode');
  assert.notOk(container.contains(wrapper), 'wrapperNode is dettached from DOM');
  assert.equal(container.children.length, 1, 'other nodes are dettached from the container');

  assert.end();
});

test('TextareaAdapter#getText', (assert) => {
  const textarea = document.createElement('textarea');
  textarea.value = 'beep boop';

  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  assert.equal(adapter.getText(), 'beep boop', 'gets the textarea\'s value');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#setText', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText('beep boop');
  assert.equal(textarea.value, 'beep boop', 'changes the textarea\'s value');
  adapter.setText('beep\nboop');
  assert.equal(adapter.getText(), 'beep\nboop', 'reflects the change in getText()');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#getLines', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  assert.deepEqual(adapter.getLines(), [''], 'returns an array with an empty string');
  adapter.setText('beep');
  assert.deepEqual(adapter.getLines(), ['beep'], 'returns an array with one line');
  adapter.setText('beep\nboop');
  assert.deepEqual(adapter.getLines(), ['beep', 'boop'], 'returns an array with the lines of text');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#getPosFromIndex', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  assert.deepEqual(adapter.getPosFromIndex(0), new Pos({ line: 0, ch: 0 }),
                   'returns the correct Pos on index 0');
  assert.deepEqual(adapter.getPosFromIndex(4), new Pos({ line: 0, ch: 4 }),
                   'returns the correct Pos on the end of the first line');
  assert.deepEqual(adapter.getPosFromIndex(5), new Pos({ line: 1, ch: 0 }),
                   'returns the correct Pos on the start of another line');
  assert.deepEqual(adapter.getPosFromIndex(9), new Pos({ line: 1, ch: 4 }),
                   'returns the correct Pos on the end of another line');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#getIndexFromPos', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  assert.equal(adapter.getIndexFromPos(new Pos({ line: 0, ch: 0 })), 0,
               'returns the correct index on the first line, first char');
  assert.equal(adapter.getIndexFromPos(new Pos({ line: 0, ch: 4 })), 4,
               'returns the correct index on the first line, last char');
  assert.equal(adapter.getIndexFromPos(new Pos({ line: 1, ch: 0 })), 5,
               'returns the correct index on another line, first char');
  assert.equal(adapter.getIndexFromPos(new Pos({ line: 1, ch: 4 })), 9,
               'returns the correct index on another line, last char');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#listSelections', (assert) => {
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  adapter.focus();

  adapter.setText('beep\nboop');
  textarea.setSelectionRange(2, 7);
  assert.deepEqual(adapter.listSelections(), [new Range(
    new Pos({ line: 0, ch: 2 }),
    new Pos({ line: 1, ch: 2 }),
  )], 'returns an array with a Range with the selection');

  adapter.destroy();
  document.body.removeChild(textarea);
  assert.end();
});

test('TextareaAdapter#focus', (assert) => {
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  textarea.blur();
  assert.notEqual(document.activeElement, textarea, 'textarea should not have the focus');

  adapter.focus();
  assert.equal(document.activeElement, textarea, 'textarea should have the focus');

  adapter.destroy();
  document.body.removeChild(textarea);
  assert.end();
});

test('TextareaAdapter#getRange', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  assert.equal(adapter.getRange(new Range(
    new Pos({ line: 0, ch: 0 }), new Pos({ line: 0, ch: 4 }),
  )), 'beep', 'returns the text of a whole line');
  assert.equal(adapter.getRange(new Range(
    new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 }),
  )), 'ep\nbo', 'returns the text of a multi-line range');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#replaceRange', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText('beep');
  adapter.replaceRange('oo', new Range(new Pos({ line: 0, ch: 1 }), new Pos({ line: 0, ch: 3 })));
  assert.equal(adapter.getText(), 'boop', 'should replace a single-line range');

  adapter.setText(`be like a while(1)
an infinite loop`);
  adapter.replaceRange('ep bo', new Range(new Pos({ line: 0, ch: 2 }),
                                          new Pos({ line: 1, ch: 14 })));
  assert.equal(adapter.getText(), 'beep boop', 'should replace a multi-line range');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#setSelection', (assert) => {
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  adapter.focus();

  adapter.setText('beep\nboop');
  adapter.setSelection(new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 })));
  assert.equal(textarea.selectionStart, 2, 'should set the selection (start)');
  assert.equal(textarea.selectionEnd, 7, 'should set the selection (end)');

  adapter.destroy();
  document.body.removeChild(textarea);
  assert.end();
});

test('TextareaAdapter#getLine', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText('beep\nboop');
  assert.equal(adapter.getLine(0), 'beep', 'should return the first line');
  assert.equal(adapter.getLine(1), 'boop', 'should return the second line');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#lock', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  assert.equal(textarea.disabled, false, 'textarea should not be locked');
  adapter.lock();
  assert.equal(textarea.disabled, true, 'textarea should get locked');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#unlock', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  textarea.disabled = true;
  adapter.attach();

  assert.equal(textarea.disabled, true, 'textarea should be locked');
  adapter.unlock();
  assert.equal(textarea.disabled, false, 'textarea should get unlocked');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#handleKeydown', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const keymap = new Map();
  keymap.set('Ctrl-B', { action: 'beep' });
  keymap.set('Cmd-Ctrl-Shift-Alt-B', { action: 'boop' });

  const handler = sinon.spy();
  adapter.on('action', handler);
  adapter.setKeymap(keymap);

  simulant.fire(textarea, 'keydown', { which: keycode('b'), ctrlKey: true }); // Press `Ctrl-B`
  assert.ok(handler.calledWith({ action: 'beep' }), 'should emit action event');
  handler.reset();

  simulant.fire(textarea, 'keydown', { which: keycode('b') }); // Press `B`
  assert.equal(handler.called, false, 'should not emit action when keymap not registered');
  handler.reset();

  simulant.fire(textarea, 'keydown', {
    which: keycode('b'),
    ctrlKey: true,
    metaKey: true,
    shiftKey: true,
    altKey: true,
  }); // `Cmd-Ctrl-Shift-Alt-B`
  assert.ok(handler.calledWith({ action: 'boop' }), 'should emit action with complex keymap');
  handler.reset();

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#setKeymap', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const keymap = new Map();
  keymap.set('Ctrl-B', { action: 'beep' });
  keymap.set('Cmd-Ctrl-Alt-B', { action: 'boop' });

  adapter.setKeymap(keymap);
  assert.equal(adapter.keymap, keymap, 'adapter.keymap should be set');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#setToolbar', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
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

test('TextareaAdapter#on paste', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const handler = sinon.spy();
  adapter.on('paste', handler);

  simulant.fire(textarea, 'paste');
  assert.ok(handler.calledOnce, 'should be fired');

  adapter.destroy();
  assert.end();
});

test('TextareaAdapter#on drop', (assert) => {
  const textarea = document.createElement('textarea');
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const handler = sinon.spy();
  adapter.on('drop', handler);

  simulant.fire(textarea, 'drop');
  assert.ok(handler.calledOnce, 'should be fired');

  adapter.destroy();
  assert.end();
});
