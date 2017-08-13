// @flow
import type { Toolbar, Keymap, Adapter } from "./Adapter";

const { Pos, Range } = require("./util");
const keycode = require("keycode");
const { EventEmitter } = require("events");

/**
 * Adapter to use a standard textarea element
 * @class
 * @extends {EventEmitter}
 */
class TextareaAdapter extends EventEmitter implements Adapter {
  textareaNode: HTMLTextAreaElement;
  toolbarNode: HTMLDivElement;
  wrapperNode: HTMLDivElement;
  handlers: {
    keydown: KeyboardEvent => boolean,
    drop: DragEvent => boolean,
    paste: Event => boolean
  };
  keymap: Keymap;

  /**
   * @constructor
   * @param {HTMLTextAreaElement} textarea
   */
  constructor(textarea: HTMLTextAreaElement) {
    if (!textarea || textarea.nodeName !== "TEXTAREA")
      throw new Error("No textarea provided");
    super();

    /** @type {HTMLTextAreaElement} */
    this.textareaNode = textarea;
    /** @type {HTMLTextAreaElement} */
    this.toolbarNode = document.createElement("div");
    /** @type {HTMLDivElement} */
    this.wrapperNode = document.createElement("div");

    this.wrapperNode.className = "editor-wrapper editor-textarea-adapter";
    this.toolbarNode.className = "editor-toolbar";
  }

  /**
   * Called when the adapter is attached to the editor
   */
  attach() {
    if (this.textareaNode.parentNode) {
      this.textareaNode.parentNode.insertBefore(
        this.wrapperNode,
        this.textareaNode
      );
    }
    this.wrapperNode.appendChild(this.toolbarNode);
    this.wrapperNode.appendChild(this.textareaNode);

    this.handlers = {
      keydown: (e: KeyboardEvent) => this.handleKeydown(e),
      paste: e => this.emit("paste", e),
      drop: e => this.emit("drop", e)
    };

    this.textareaNode.addEventListener("keydown", this.handlers.keydown);
    this.textareaNode.addEventListener("paste", this.handlers.paste);
    this.textareaNode.addEventListener("drop", this.handlers.drop);
  }

  /**
   * Called when the toolbar is changed
   * @param {Map.<string, object>} toolbar
   */
  setToolbar(t: Toolbar) {
    const setToolbar = (toolbar: Toolbar, _toolbarNode: HTMLDivElement) => {
      const toolbarNode = _toolbarNode.cloneNode(false);
      const focusHandler = (wrapper, action: "add" | "remove") => () => {
        if (action === "add") {
          toolbarNode.classList.add("active");
          wrapper.classList.add("active");
        } else {
          toolbarNode.classList.remove("active");
          wrapper.classList.remove("active");
        }
      };

      toolbar.forEach(({ action, alt, children }, name) => {
        const wrapper = document.createElement("div");
        wrapper.className = "editor-button-wrapper";
        const button = document.createElement("button");
        const text = document.createTextNode(name);
        button.appendChild(text);
        button.classList.add("editor-button");
        if (action.type) button.classList.add(`editor-button-${action.type}`);
        if (alt) button.title = alt;
        button.addEventListener("click", () => this.emit("action", action));
        button.addEventListener("focus", focusHandler(wrapper, "add"));
        button.addEventListener("blur", focusHandler(wrapper, "remove"));
        wrapper.appendChild(button);

        if (children && children.size > 0) {
          const childWrapper = document.createElement("div");
          childWrapper.className = "editor-toolbar-children";
          setToolbar(children, childWrapper);
          wrapper.appendChild(childWrapper);
        }

        toolbarNode.appendChild(wrapper);
      });

      if (_toolbarNode.parentNode)
        _toolbarNode.parentNode.replaceChild(_toolbarNode, toolbarNode);
    };

    setToolbar(t, this.toolbarNode);
  }

  /**
   * Called when the keymap is changed
   * @param {Map.<string, object>} keymap
   */
  setKeymap(keymap: Keymap) {
    this.keymap = keymap;
  }

  /**
   * Handle a keydown event
   * @param {KeyboardEvent} event
   */
  handleKeydown(event: KeyboardEvent): boolean {
    const modifiers = [
      ["Cmd", e => e.metaKey],
      ["Ctrl", e => e.ctrlKey],
      ["Shift", e => e.shiftKey],
      ["Alt", e => e.altKey]
    ];

    let keyStr = modifiers.reduce(
      (str, [name, down]) => (down(event) ? `${str}${name}-` : str),
      ""
    );

    const k = keycode(event);
    if (k) keyStr += k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();

    if (this.keymap.has(keyStr)) {
      const action = this.keymap.get(keyStr);
      if (typeof action === "function") {
        const result = action.call();
        if (result !== false) {
          event.preventDefault();
          return true;
        }
      } else {
        event.preventDefault();
        return this.emit("action", action);
      }
    }

    return false;
  }

  /**
   * Get the text inside the textarea
   * @return {string[]}
   */
  getLines() {
    return this.textareaNode.value.split("\n");
  }

  /**
   * Get the position for a given index
   * @param {number} index
   * @return {Pos}
   */
  getPosFromIndex(index: number) {
    const text = this.getLines();
    let charsBefore = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (charsBefore + text[i].length + 1 > index) {
        return new Pos({
          line: parseInt(i, 10),
          ch: index - charsBefore
        });
      }

      charsBefore += text[i].length + 1;
    }

    return new Pos({
      line: text.length - 1,
      ch: text[text.length - 1].length - 1
    });
  }

  /**
   * Get the index for a given position
   * @param {Pos} pos
   * @return {number}
   */
  getIndexFromPos(pos: Pos) {
    const text = this.getLines();
    let n = 0;
    for (let i = 0; i < pos.line; i += 1) {
      n += text[i].length + 1;
    }
    return n + pos.ch;
  }

  listSelections() {
    return [
      new Range(
        this.getPosFromIndex(this.textareaNode.selectionStart || 0),
        this.getPosFromIndex(this.textareaNode.selectionEnd || 0)
      )
    ];
  }

  focus() {
    this.textareaNode.focus();
  }

  getRange(range: Range) {
    const text = this.getLines().slice(range.start.line, range.end.line + 1);
    text[text.length - 1] = text[text.length - 1].substring(0, range.end.ch);
    text[0] = text[0].substring(range.start.ch);
    return text.join("\n");
  }

  replaceRange(replacement: string, range: Range) {
    // see https://github.com/facebook/flow/issues/4335
    // $FlowFixMe
    if (document.queryCommandSupported("insertText")) {
      this.setSelection(range);
      this.focus();
      document.execCommand("insertText", false, replacement);
    } else {
      const startIndex = this.getIndexFromPos(range.start);
      const endIndex = this.getIndexFromPos(range.end);
      const rawText = this.textareaNode.value;
      this.textareaNode.value =
        rawText.substring(0, startIndex) +
        replacement +
        rawText.substring(endIndex);
    }
  }

  setSelection(sel: Range | Pos) {
    if (sel instanceof Range) {
      this.textareaNode.setSelectionRange(
        this.getIndexFromPos(sel.start),
        this.getIndexFromPos(sel.end)
      );
    } else {
      const index = this.getIndexFromPos(sel);
      this.textareaNode.setSelectionRange(index, index);
    }
  }

  getLine(line: number) {
    return this.getLines()[line];
  }

  getText() {
    return this.textareaNode.value;
  }

  setText(text: string) {
    this.textareaNode.value = text;
  }

  lock() {
    this.textareaNode.disabled = true;
  }

  unlock() {
    this.textareaNode.disabled = false;
  }

  /**
   * Destroy the instance
   */
  destroy() {
    this.removeAllListeners();

    this.textareaNode.removeEventListener("keydown", this.handlers.keydown);
    this.textareaNode.removeEventListener("paste", this.handlers.paste);
    this.textareaNode.removeEventListener("drop", this.handlers.drop);

    this.wrapperNode.removeChild(this.textareaNode);
    this.wrapperNode.removeChild(this.toolbarNode);
    const parentNode = this.wrapperNode.parentNode;
    if (parentNode) {
      parentNode.insertBefore(this.textareaNode, this.wrapperNode);
      parentNode.removeChild(this.wrapperNode);
    }

    // FIXME: should we really destroy this?
    delete this.toolbarNode;
    delete this.wrapperNode;
  }
}

module.exports = TextareaAdapter;
