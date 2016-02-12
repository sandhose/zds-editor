'use strict';

import test from 'tape';
import Editor from '../src/Editor.js';
import GenericAdapter from '../src/GenericAdapter';

/**
 * Create an editor instance
 * @param {object} options - Options to pass to the Editor constructor
 * @return {Editor}
 */
const createEditor = options => new Editor(new GenericAdapter(), options);

/**
 * Destroy an editor instance
 * @param {Editor} editor
 */
const destroyEditor = editor => {
  editor.wrapper.remove();
};

export { createEditor, destroyEditor };

test('Editor#constructor', assert => {
  assert.plan(2);
  assert.throws(() => new Editor(), new Error('No adapter provided'),
                'throws an exception if there is no adapter provided');
  assert.doesNotThrow(createEditor, null, 'should not throw when an adapter is provided');
});
