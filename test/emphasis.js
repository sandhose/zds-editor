'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getEmphasis', assert => {
  assert.plan(8);
  const ed = createEditor();

  const emph = ed.getEmphasis('***beep***');
  assert.equal(emph.level, 3);
  assert.equal(emph.text, 'beep');
  assert.equal(emph.type, '*');

  const emph2 = ed.getEmphasis('boop');
  assert.equal(emph2.level, 0);
  assert.equal(emph2.text, 'boop');

  const emph3 = ed.getEmphasis('____');
  assert.equal(emph3.level, 2);
  assert.equal(emph3.text, '');
  assert.equal(emph3.type, '_');

  destroyEditor(ed);
});

test('Editor#setEmphasis', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.equal(ed.setEmphasis({ level: 3, text: 'beep', type: '*' }), '***beep***');
  assert.equal(ed.setEmphasis({ level: 0, text: 'boop', type: '*' }), 'boop');
  assert.equal(ed.setEmphasis({ level: 2, text: '', type: '_' }), '____');

  destroyEditor(ed);
});
