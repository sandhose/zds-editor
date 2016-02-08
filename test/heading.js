'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getHeading', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.deepEqual(ed.getHeading('## beep'), { level: 2, text: 'beep' });
  assert.deepEqual(ed.getHeading('boop'), { level: 0, text: 'boop' });
  assert.deepEqual(ed.getHeading('#### '), { level: 4, text: '' });

  destroyEditor(ed);
});

test('Editor#setHeading', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.equal(ed.setHeading({ level: 2, text: 'Lorem ipsum' }), '## Lorem ipsum');
  assert.equal(ed.setHeading({ level: 0, text: 'Doloir sit amet' }), 'Doloir sit amet');
  assert.equal(ed.setHeading({ level: 4, text: '' }), '#### ');

  destroyEditor(ed);
});
