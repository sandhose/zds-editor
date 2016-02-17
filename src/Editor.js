import { Pos, Range } from './util.js';

class Editor {
  /**
   * @callback uploadFunc
   * @param {File} file - The input text
   * @return {Promise<string>} A Promise that resolves to the uploaded image's URL
   */

  /**
   * @constructor
   * @param {GenericAdapter} adapter
   * @param {object} options
   * @param {uploadFunc} options.upload - Called when an image need to be uploaded
   */
  constructor(adapter, options) {
    if (!adapter) throw new Error('No adapter provided');
    this.options = Object.assign({
      upload: file => new Promise(resolve =>
        setTimeout(() => resolve(URL.createObjectURL(file)), 200)
      ),
    }, options);

    /** @type {Map.<string, object>} */
    this.keymap = new Map();
    /** @type {Map.<string, object>} */
    this.toolbar = new Map();

    this.keymap.set('Enter', e => this.handleEnter(e));

    this.buildToolbar();

    this.setAdapter(adapter);
  }

  /**
   * Set the adapter to use
   * @param {Adapter} adapter - the adapter to use
   */
  setAdapter(adapter) {
    // Destroy the old adapter, but keep the text & selections
    let text;
    let selections;
    if (this.adapter) {
      selections = this.adapter.listSelections();
      text = this.adapter.getText();
      this.adapter.destroy();
    }

    /** @type {GenericAdapter} */
    this.adapter = adapter;
    this.adapter.attach();
    this.adapter.setKeymap(this.keymap);
    this.adapter.setToolbar(this.toolbar);
    this.adapter.on('paste', e => this.handlePaste(e));
    this.adapter.on('drop', e => this.handleDrop(e));
    this.adapter.on('action', e => this.handleAction(e));

    if (text) this.adapter.setText(text);
    if (selections) this.adapter.setSelection(...selections);
  }

  /**
   * Build the toolbar
   */
  buildToolbar() {
    this.addToolbarButton({ name: 'bold', type: 'emphasis', level: 2,
                            keymap: ['Cmd-B', 'Ctrl-B'] });
    this.addToolbarButton({ name: 'italic', type: 'emphasis', level: 1,
                            keymap: ['Cmd-I', 'Ctrl-I'] });
    this.addToolbarButton({ name: 'h1', type: 'heading', level: 1 });
    this.addToolbarButton({ name: 'h2', type: 'heading', level: 2 });
    this.addToolbarButton({ name: 'h3', type: 'heading', level: 3 });
    this.addToolbarButton({ name: 'h4', type: 'heading', level: 4 });
    this.addToolbarButton({ name: 'h5', type: 'heading', level: 5 });
    this.addToolbarButton({ name: 'h6', type: 'heading', level: 6 });
    this.addToolbarButton({ name: '+quote', type: 'blockquote', level: 1,
                            keymap: ["Cmd-'", "Ctrl-'"] });
    this.addToolbarButton({ name: '-quote', type: 'blockquote', level: -1,
                            keymap: ["Cmd-Alt-'", "Ctrl-Alt-'"] });
    this.addToolbarButton({ name: 'code', type: 'code' });
    this.addToolbarButton({ name: 'link', type: 'link', keymap: ['Cmd-K', 'Ctrl-K'] });
  }

  /**
   * @typedef Heading
   * @type Object
   * @property {number} level - The level of heading
   * @property {string} text - The text of the heading
   */

  /**
   * Get the heading level and text for a given text
   * @param {string} text - The text to parse
   * @return {Heading} The parsed heading
   * @example
   * editor.getHeading("## test");
   * { level: 2, text: "test" }
   */
  getHeading(text) {
    const match = text.match(/^(#{0,6})(.*)$/);
    return { level: match[1].length, text: match[2].trim() };
  }

  /**
   * Return the text representation of a Heading
   * @param {Heading} heading
   * @return {string} The text representation of the heading
   * @example
   * editor.setHeading({ level: 3, text: "Lorem ipsum"});
   * "### Lorem ipsum"
   */
  setHeading({ level, text }) {
    return (`${'#'.repeat(level)} ${text}`).replace(/^ /, '');
  }

  /**
   * @typedef Blockquote
   * @type Object
   * @property {number} level - The level of blockquote
   * @property {string} text - The text of the blockquote
   */

  /**
   * Get the quotation level and text for a given text
   * @param {string} text - The text to parse
   * @return {Blockquote} The parsed blockquote
   * @example
   * editor.getBlockquote("> > > nested");
   * { level: 3, text: "nested" }
   */
  getBlockquote(text) {
    const match = text.match(/^((> )*)(.*)$/);
    return { level: match[1].length / 2, text: match[3] };
  }

  /**
   * Return the text representation of a Blockquote
   * @param {Blockquote} blockquote
   * @return {string} The text representation of the blockquote
   * @example
   * editor.setBlockquote({ level: 1, text: "quote" });
   * "> quote"
   */
  setBlockquote({ level, text }) {
    return `${'> '.repeat(level)}${text}`;
  }

  /**
   * @typedef Emphasis
   * @type Object
   * @property {number} level - The level of emphasis
   * @property {string} text - The text of the emphasis
   * @property {string} type - The type of the emphasis (* or _)
   */

  /**
   * Get the emphasis level, text and type for a given text
   * @param {string} text - The text to parse
   * @return {Emphasis} The parsed emphasis
   * @example
   * editor.getEmphasis("__bold__");
   * { level: 2, text: "bold", type: "_" }
   */
  getEmphasis(text) {
    const start = text.charAt(0);
    if (start !== '*' && start !== '_') return { type: '*', level: 0, text };
    for (let i = 3; i > 0; i--) {
      const match = text.match(new RegExp(`^\\${start}{${i}}(.*)\\${start}{${i}}`));
      if (match) {
        return { type: start, level: i, text: match[1] };
      }
    }
  }

  /**
   * Return the text representation of an Emphasis
   * @param {Emphasis} emphasis
   * @return {string} The text representation of the emphasis
   * @example
   * editor.setEmphasis({ text: "italic", level: 1, type: "*" });
   * "*italic*"
   */
  setEmphasis({ text, level, type }) {
    return type.repeat(level) + text + type.repeat(level);
  }

  /**
   * @typedef ListItem
   * @type Object
   * @property {number} level - The number of space before the item
   * @property {string} text - The text of the list item
   * @property {boolean} ordered - True if it is an ordered list
   * @property {string} [bullet] - `*` or `-`
   * @property {number} [number] - The number of the ordered list
   */

  /**
   * Return the list type, level and text for a given text
   * @param {string} text - The text to parse
   * @return {ListItem}
   */
  getListItem(text) {
    const match = /^([ ]*)(\*|-|[0-9]+\.) (.*)$/.exec(text);
    if (match) {
      if (match[2] === '-' || match[2] === '*') {
        return {
          level: match[1].length,
          ordered: false,
          bullet: match[2],
          text: match[3],
        };
      }

      return {
        level: match[1].length,
        ordered: true,
        text: match[3],
        number: parseInt(match[2], 10),
      };
    }

    return {
      level: -1,
      text,
    };
  }

  /**
   * Return the text representation of a ListItem
   * @param {ListItem} item
   * @return {string}
   */
  setListItem({ text, level, ordered, number, bullet }) {
    if (level === -1) {
      return text;
    }

    const prefix = ordered ? `${number}.` : bullet;
    return `${' '.repeat(level)}${prefix} ${text}`;
  }

  /**
   * Extract an array of range for the given lines (each line are separate ranges)
   * @param {Range[]} [selections=this.adapter.listSelections()] - The selection to extract
   * @param {boolean} [fullLine=false] - If true, each selection will be expanded to the full line
   * @return {Range[]} All the extracted ranges
   * @see Editor#mapRanges
   * @example
   * // Wraps the selected text with ~
   * let ranges = editor.extractLines();
   * editor.mapRanges(text => `~${text}~`, ranges);
   */
  extractLines(selections = this.adapter.listSelections(), fullLine = false) {
    // Extracting lines from selections
    const lines = fullLine ? new Set() : new Map();
    selections.forEach(({ start, end }) => {
      for (let i = start.line; i <= end.line; i++) {
        if (fullLine) {
          lines.add(i);
        } else {
          if (!lines.has(i)) lines.set(i, []);
          lines.get(i).push([
            i === start.line ? start.ch : 0,
            i === end.line ? end.ch : this.adapter.getLine(i).length,
          ]);
        }
      }
    });

    // Building ranges
    let ranges = [];
    if (fullLine) {
      ranges = Array.from(lines).map(line => new Range(
        new Pos({ line, ch: 0 }),
        new Pos({ line, ch: this.adapter.getLine(line).length })
      ));
    } else {
      ranges = Array.from(lines).map(([line, lineRanges]) =>
        lineRanges.map(([start, end]) => new Range(
          new Pos({ line, ch: start }),
          new Pos({ line, ch: end })
        ))
      ).reduce((a, b) => a.concat(b));
    }

    return ranges;
  }

  /**
   * Expands the selection to the whole line
   * @param {Range[]} [selections=this.cm.doc.listSelections()] - The ranges to expand
   * @return {Range[]} The expanded selections
   */
  expandSelectionsToLines(selections = this.adapter.listSelections()) {
    return selections.map(range => {
      const { start, end } = range;
      start.ch = 0;
      end.ch = this.adapter.getLine(end.line).length;
      return { start, end };
    });
  }

  /**
   * @callback rangeMap
   * @param {string} text - The input text
   * @param {Range} range - The range of the text
   * @param {number} index - The index of the current range
   * @return {(string|object)} The transformed text
   */

  /**
   * Transform the text in each range using mapFunc
   * @param {rangeMap} mapFunc
   * @param {Range[]} ranges
   * @see Editor#extractLines
   */
  mapRanges(mapFunc, _ranges) {
    const ranges = _ranges;
    const newSelections = ranges.map((range, index) => {
      const rangeText = this.adapter.getRange(range);

      const result = mapFunc(rangeText, range, index);
      let resultText;
      const resultSelection = result.selection || [0, 0];

      if (typeof result === 'string') {
        resultText = result;
      } else {
        resultText = result.text;
      }

      ranges.slice(index + 1).forEach((range2, i) => {
        ranges[index + 1 + i] = new Range(
          this.adjustPosForChange(range2.start, { from: range.start, to: range.end,
                                                 text: resultText.split('\n') }),
          this.adjustPosForChange(range2.end, { from: range.start, to: range.end,
                                               text: resultText.split('\n') })
        );
      });

      this.adapter.replaceRange(resultText, range);
      const s1 = resultText.slice(0, resultSelection[0]).split('\n');
      const s2 = resultText.slice(0, resultText.length - resultSelection[1]).split('\n');
      return new Range(
        new Pos({
          line: range.start.line - 1 + s1.length,
          ch: (s1.length > 1 ? 0 : range.start.ch) + s1[s1.length - 1].length,
        }),
        new Pos({
          line: range.start.line - 1 + s2.length,
          ch: (s2.length > 1 ? 0 : range.start.ch) + s2[s2.length - 1].length,
        })
      );
    });
    this.adapter.setSelection(...newSelections);
    return newSelections;
  }

  changeEnd(change) {
    if (!change.text) return change.to;
    return new Pos({
      line: change.from.line + change.text.length - 1,
      ch: change.text[change.text.length - 1].length
          + (change.text.length === 1 ? change.from.ch : 0),
    });
  }

  /**
   * Offset a Pos after a change
   * @param {Pos} pos - Position to adjsut
   * @param {object} change - Change to be done
   * @param {Pos} change.from - Start of the change
   * @param {Pos} change.to - End of the change
   * @param {string} change.text - New text for the change
   */
  adjustPosForChange(pos, { from, to, text }) {
    if (Pos.compare(pos, from) < 0) return pos;
    if (Pos.compare(pos, to) <= 0) return this.changeEnd({ from, to, text });

    let ch = pos.ch;
    if (pos.line === to.line) ch += this.changeEnd({ from, to, text }).ch - to.ch;
    return new Pos({
      line: pos.line + text.length - (to.line - from.line) - 1,
      ch,
    });
  }

  /**
   * @typedef Prefix
   * @type Object
   * @property {string} prefix - The prefix of the text
   * @property {string} text - The text itself
   */

  /**
   * Get the prefix and text for given text and level
   * @param {string} text - Text to parse
   * @param {string} level - Level of the block to extract ; can be `cite` or `heading`
   * @return {Prefix}
   */
  getPrefixForText(_text, level) {
    let prefix = '';
    let text = _text;

    if (level === 'cite' || level === 'heading') {
      const quote = this.getBlockquote(text);
      text = quote.text;
      quote.text = '';
      prefix += this.setBlockquote(quote);
    }

    if (level === 'heading') {
      const heading = this.getHeading(text);
      text = heading.text;
      heading.text = '';
      prefix += this.setHeading(heading);
    }

    return { text, prefix };
  }

  /**
   * Execute a given action
   * @param {object} action
   * @param {string} action.type
   * @param {} action.level
   * @example
   * editor.execute({ type: "heading", level: 5 });
   */
  handleAction({ type, level }) {
    if (this.locked) return;
    if (type === 'emphasis') {
      const ranges = this.extractLines(this.adapter.listSelections());
      this.mapRanges(text => {
        const { prefix, text: unprefixedText } = this.getPrefixForText(text, 'heading');
        const emph = this.getEmphasis(unprefixedText);
        if ((emph.level >> (level - 1)) % 2 === 1) emph.level -= level;
        else emph.level += level;

        if (emph.text === '') {
          return {
            text: prefix + '*'.repeat(emph.level * 2),
            selection: [prefix.length + emph.level, emph.level],
          };
        }

        return {
          text: prefix + this.setEmphasis(emph),
          selection: [prefix.length, 0],
        };
      }, ranges);
    } else if (type === 'heading') {
      const ranges = this.extractLines(this.adapter.listSelections(), true);
      this.mapRanges(text => {
        const { prefix, text: unprefixedText } = this.getPrefixForText(text, 'cite');
        const heading = this.getHeading(unprefixedText);
        if (heading.level === level) heading.level = 0; // Toggle heading if same level
        else heading.level = level;
        if (heading.text === '') {
          return {
            text: `${prefix}${'#'.repeat(heading.level)} `,
            selection: [prefix.length + heading.level + 1, 0],
          };
        }
        return {
          text: prefix + this.setHeading(heading),
          selection: [prefix.length, 0],
        };
      }, ranges);
    } else if (type === 'blockquote') {
      const ranges = this.extractLines(this.adapter.listSelections(), true);
      this.mapRanges(text => {
        const quote = this.getBlockquote(text);
        quote.level = Math.max(0, quote.level + level);
        if (quote.text === '') {
          return { text: '> '.repeat(quote.level), selection: [quote.level * 2, 0] };
        }

        return this.setBlockquote(quote);
      }, ranges);
    } else if (type === 'code') {
      const ranges = this.expandSelectionsToLines();
      this.mapRanges(text => {
        let returnValue;
        if (text.trim() === '') {
          returnValue = {
            text: '```\n\n```',
            selection: [4, 4],
          };
        } else {
          returnValue = {
            text: `\`\`\`language\n${text}\n\`\`\``,
            selection: [3, text.length + 5],
          };
        }
        return returnValue;
      }, ranges);
    } else if (type === 'link') {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const ranges = this.extractLines(this.adapter.listSelections());
      this.mapRanges(text => {
        let returnValue;
        if (text === '' || text.match(urlRegex)) {
          returnValue = {
            text: `[](${text})`,
            selection: [1, 3 + text.length],
          };
        } else {
          returnValue = {
            text: `[${text}]()`,
            selection: [text.length + 3, 1],
          };
        }
        return returnValue;
      }, ranges);
    }

    this.adapter.focus();
  }

  /**
   * Called when the enter key is pressed
   * Does things like continue a list
   */
  handleEnter() {
    const selections = this.adapter.listSelections();
    if (selections.length === 1 && Pos.compare(selections[0].start, selections[0].end) === 0) {
      const cursor = selections[0].start;
      const listItem = this.getListItem(this.adapter.getLine(cursor.line));

      if (listItem.level === -1) {
        this.mapRanges(() => ({ text: '\n', selection: [1, 0] }), [new Range(cursor, cursor)]);
      } else if (listItem.text === ''
              && this.getListItem(this.adapter.getLine(cursor.line - 1)).level !== -1) {
        this.mapRanges(() => ({ text: '\n', selection: [1, 0] }),
                       this.expandSelectionsToLines([new Range(cursor, cursor)]));
      } else {
        if (listItem.ordered) listItem.number++;
        listItem.text = '';
        const newText = this.setListItem(listItem);
        this.mapRanges(() => ({ text: `\n${newText}`, selection: [newText.length + 1, 0] }),
                       [new Range(cursor, cursor)]);
      }
    } else {
      this.mapRanges(() => ({ text: '\n', selection: [1, 0] }), selections);
    }
  }

  /**
   * Called when the user pastes something
   * @param {Event} event
   */
  handlePaste(event) {
    if (this.locked) return false;
    const files = Array.from(event.clipboardData.items)
      .filter(item => item.type.match(/^image\//))
      .map(item => item.getAsFile());
    if (files.length) {
      this.uploadImages(files);
      event.preventDefault();
    }
  }

  /**
   * Called when the user drop some files
   * @param {Event} event
   */
  handleDrop(event) {
    if (this.locked) return false;
    const files = Array.from(event.dataTransfer.files).filter(item => item.type.match(/^image\//));
    if (files.length) {
      this.uploadImages(files);
      event.preventDefault();
    }
  }

  /**
   * Upload images and insert a link
   * @param {Blob[]} files - Images to upload
   */
  uploadImages(files) {
    const selections = this.adapter.listSelections();
    const uploadingChanges = files.map((file, index) => {
      let text = '';
      if (selections[index]) {
        const title = this.adapter.getRange(selections[index]) || file.name || '';
        text = `![${title}](Uploading...)`;
      } else {
        const title = file.name || '';
        text = ` ![${title}](Uploading...)`;
        selections.push(new Range(
          selections[selections.length - 1].end,
          selections[selections.length - 1].end
        ));
      }

      return {
        text,
        selection: [text.length - 13, 1],
      };
    });

    const imageLinkSelections = this.mapRanges((text, range, index) => uploadingChanges[index],
                                               selections);
    this.adapter.lock();
    this.locked = true;

    Promise.all(files.map(file =>
      this.options.upload(file)
          .then(url => url, error => `error while uploading ${error}`) // Silently catch errors
    )).then(uploadURLs => {
      this.adapter.unlock();
      this.locked = false;
      this.mapRanges((text, range, index) => uploadURLs[index], imageLinkSelections);
    });
  }

  /**
   * Add a button to the toolbar
   * @param {object} opts
   * @param {string} opts.name - The name of the button (if empty, no button will be added)
   * @param {string} opts.type - The type of the button (will be passed to `handleAction`)
   * @param {} opts.level - Arbitrary level (will be passed to `handleAction`)
   * @param {string[]} opts.keymap - An array of keymap to bind to this action
   * @example
   * editor.addToolbarButton({ name: "bold", type: "emphasis", level: 2,
   *                           keymap: ["Cmd-B", "Ctrl-B"]});
   */
  addToolbarButton({ name, type, level, keymap }) {
    if (name) {
      this.toolbar.set(name, { type, level });
    }

    if (keymap) {
      keymap.forEach(key => {
        if (this.keymap.has(key)) throw new Error(`${key} is already registered`);
        this.keymap.set(key, { type, level });
      });
    }
  }
}

module.exports = Editor;
