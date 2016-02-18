import 'babel-polyfill';
import Editor from './Editor';
import CodeMirrorAdapter from './CodeMirrorAdapter';
import TextareaAdapter from './TextareaAdapter';
import GenericAdapter from './GenericAdapter';

module.exports = Editor;
module.exports.CodeMirrorAdapter = CodeMirrorAdapter;
module.exports.TextareaAdapter = TextareaAdapter;
module.exports.GenericAdapter = GenericAdapter;
