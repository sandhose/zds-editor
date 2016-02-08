'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getEmphasis', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.deepEqual(ed.getEmphasis('***beep***'), { level: 3, text: 'beep', type: '*' });
  assert.deepEqual(ed.getEmphasis('boop'), { level: 0, text: 'boop', type: '*' });
  assert.deepEqual(ed.getEmphasis('____'), { level: 2, text: '', type: '_' });

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
