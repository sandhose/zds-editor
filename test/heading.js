'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getHeading', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.deepEqual(ed.getHeading('## beep'), { level: 2, text: 'beep' },
                   'extracts heading properties');
  assert.deepEqual(ed.getHeading('boop'), { level: 0, text: 'boop' },
                   'extracts heading with level=0 when text is not a heading');
  assert.deepEqual(ed.getHeading('#### '), { level: 4, text: '' },
                   'extracts heading where there is no text inside the heading');

  destroyEditor(ed);
});

test('Editor#setHeading', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.equal(ed.setHeading({ level: 2, text: 'Lorem ipsum' }), '## Lorem ipsum',
               'converts heading to string');
  assert.equal(ed.setHeading({ level: 0, text: 'Doloir sit amet' }), 'Doloir sit amet',
               'converts heading to string with level=0');
  assert.equal(ed.setHeading({ level: 4, text: '' }), '#### ',
               'converts heading to string without text');

  destroyEditor(ed);
});
