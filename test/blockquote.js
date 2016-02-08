'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getBlockquote', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.deepEqual(ed.getBlockquote('> > beep'), { level: 2, text: 'beep' });
  assert.deepEqual(ed.getBlockquote('boop'), { level: 0, text: 'boop' });
  assert.deepEqual(ed.getBlockquote('> > > '), { level: 3, text: '' });

  destroyEditor(ed);
});

test('Editor#setHeading', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.equal(ed.setBlockquote({ level: 2, text: 'beep' }), '> > beep');
  assert.equal(ed.setHeading({ level: 0, text: 'Doloir sit amet' }), 'Doloir sit amet');
  assert.equal(ed.setHeading({ level: 4, text: '' }), '#### ');

  destroyEditor(ed);
});
