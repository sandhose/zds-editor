'use strict';

const test = require('tape');
const Editor = require('../src/Editor.js');
const GenericAdapter = require('../src/GenericAdapter');

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
  editor.adapter.destroy();
};

module.exports = { createEditor, destroyEditor };

test('Editor#constructor', assert => {
  assert.plan(2);
  assert.throws(() => new Editor(), new Error('No adapter provided'),
                'throws an exception if there is no adapter provided');
  assert.doesNotThrow(createEditor, null, 'should not throw when an adapter is provided');
});
