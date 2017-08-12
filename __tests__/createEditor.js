const Editor = require("../src/Editor.js");
const GenericAdapter = require("../src/GenericAdapter");

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

test("Editor#constructor", () => {
  expect.assertions(2);
  expect(() => new Editor()).toThrowError(new Error("No adapter provided"));
  expect(createEditor).not.toThrowError();
});
