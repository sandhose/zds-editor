'use strict';

import test from 'tape';
import { createEditor, destroyEditor } from './createEditor.js';

test('Editor#getBlockquote', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.deepEqual(ed.getBlockquote('> > beep'), { level: 2, text: 'beep' },
                   'extracts quote properties');
  assert.deepEqual(ed.getBlockquote('boop'), { level: 0, text: 'boop' },
                   'extracts quote with level=0 when text is not a quote');
  assert.deepEqual(ed.getBlockquote('> > > '), { level: 3, text: '' },
                   'extracts quote when there is no text inside the quote');

  destroyEditor(ed);
});

test('Editor#setHeading', assert => {
  assert.plan(3);
  const ed = createEditor();

  assert.equal(ed.setBlockquote({ level: 2, text: 'beep' }), '> > beep',
               'converts quote to string');
  assert.equal(ed.setHeading({ level: 0, text: 'Doloir sit amet' }), 'Doloir sit amet',
               'converts quote to string with level=0');
  assert.equal(ed.setHeading({ level: 4, text: '' }), '#### ',
               'converts quote to string without text');

  destroyEditor(ed);
});
