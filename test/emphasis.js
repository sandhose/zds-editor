'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getEmphasis', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.deepEqual(ed.getEmphasis('***beep***'), { level: 3, text: 'beep', type: '*' },
                   'extracts emphasis properties');
  assert.deepEqual(ed.getEmphasis('boop'), { level: 0, text: 'boop', type: '*' },
                   'extracts emphasis with level=0 when text has no emphasis');
  assert.deepEqual(ed.getEmphasis('____'), { level: 2, text: '', type: '_' },
                   'extracts emphasis when there is nothing inside the emphasis');

  destroyEditor(ed);
});

test('Editor#setEmphasis', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.equal(ed.setEmphasis({ level: 3, text: 'beep', type: '*' }), '***beep***',
               'converts emphasis to string');
  assert.equal(ed.setEmphasis({ level: 0, text: 'boop', type: '*' }), 'boop',
               'converts emphasis to string with level=0');
  assert.equal(ed.setEmphasis({ level: 2, text: '', type: '_' }), '____',
               'converts emphasis to string without text');

  destroyEditor(ed);
});
