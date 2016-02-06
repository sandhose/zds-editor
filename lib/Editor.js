require('codemirror/mode/gfm/gfm');
require('codemirror/addon/mode/loadmode');
const codemirror = require('codemirror');

export default class Editor {
  /**
   * @constructor
   * @param {DOMNode} textarea
   */
  constructor(textarea, options) {
    if (!textarea) throw new Error('No textarea provided');
    this.options = Object.assign({
      upload: file => new Promise(resolve =>
        setTimeout(() => resolve(URL.createObjectURL(file)), 200)
      ),
      codemirror: {
        mode: {
          name: 'gfm',
          gitHubSpice: false,
        },
        extraKeys: {},
        tabMode: 'indent',
        lineWrapping: true,
      },
    }, options);

    this.buildToolbar();
    this.cm = codemirror.fromTextArea(textarea, this.options.codemirror);
    this.cm.on('paste', (cm, e) => this.handlePaste(e));

    // Append the toolbar
    const wrapper = this.cm.getWrapperElement();
    wrapper.parentNode.insertBefore(this.toolbar, wrapper);
  }

  /**
   * Build the toolbar
   */
  buildToolbar() {
    this.toolbar = document.createElement('div');

    this.addToolbarButton({ name: 'bold', type: 'emphasis', level: 2,
                            keymaps: ['Cmd-B', 'Ctrl-B'] });
    this.addToolbarButton({ name: 'italic', type: 'emphasis', level: 1,
                            keymaps: ['Cmd-I', 'Ctrl-I'] });
    this.addToolbarButton({ name: 'h1', type: 'heading', level: 1 });
    this.addToolbarButton({ name: 'h2', type: 'heading', level: 2 });
    this.addToolbarButton({ name: 'h3', type: 'heading', level: 3 });
    this.addToolbarButton({ name: 'h4', type: 'heading', level: 4 });
    this.addToolbarButton({ name: 'h5', type: 'heading', level: 5 });
    this.addToolbarButton({ name: 'h6', type: 'heading', level: 6 });
    this.addToolbarButton({ name: '+quote', type: 'blockquote', level: 1,
                            keymaps: ["Cmd-'", "Ctrl-'"] });
    this.addToolbarButton({ name: '-quote', type: 'blockquote', level: -1,
                            keymaps: ["Cmd-Alt-'", "Ctrl-Alt-'"] });
    this.addToolbarButton({ name: 'code', type: 'code' });
    this.addToolbarButton({ name: 'link', type: 'link', keymaps: ['Cmd-K', 'Ctrl-K'] });
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
   * Sort a given array of positions
   * @param {Pos[]} positions
   * @return {Pos[]}
   * @example
   * editor.orderPosition([{ line: 4, ch: 7 }, { line: 4, ch: 5 },
   *                       { line: 8, ch: 42 }, { line: 2, ch: 9 }]);
   * [{ line: 2, ch: 9 }, { line: 4, ch: 5 }, { line: 4, ch: 7 }, { line: 8, ch: 42 }]
   */
  orderPositions(positions) {
    return positions.sort((a, b) =>
      a.line === b.line ? a.ch >= b.ch : a.line >= b.line
    );
  }

  /**
   * @typedef Pos
   * @type Object
   * @property {number} line - The line number
   * @property {number} ch - The character number
   */

  /**
   * @typedef Range
   * @type Object
   * @property {Pos} anchor - The start of the range
   * @property {Pos} head - The end of the range
   */

  /**
   * Extract an array of range for the given lines (each line are separate ranges)
   * @param {Range[]} [selections=this.cm.doc.listSelections()] - The selection to extract
   * @param {boolean} [fullLine=false] - If true, each selection will be expanded to the full line
   * @return {Range[]} All the extracted ranges
   * @see Editor#mapRanges
   * @example
   * // Wraps the selected text with ~
   * let ranges = editor.extractLines();
   * editor.mapRanges(text => `~${text}~`, ranges);
   */
  extractLines(selections = this.cm.doc.listSelections(), fullLine = false) {
    // Extracting lines from selections
    const lines = fullLine ? new Set() : new Map();
    selections.forEach(sel => {
      const [start, end] = this.orderPositions([sel.anchor, sel.head]);
      for (let i = start.line; i <= end.line; i++) {
        if (fullLine) {
          lines.add(i);
        } else {
          if (!lines.has(i)) lines.set(i, []);
          lines.get(i).push([
            i === start.line ? start.ch : 0,
            i === end.line ? end.ch : this.cm.doc.getLine(i).length,
          ]);
        }
      }
    });

    // Building ranges
    let ranges = [];
    if (fullLine) {
      ranges = Array.from(lines).map(l =>
        ({ anchor: { line: l, ch: 0 }, head: { line: l, ch: this.cm.doc.getLine(l).length } })
      );
    } else {
      ranges = Array.from(lines).map(([line, lineRanges]) =>
        lineRanges.map(([start, end]) =>
          ({ anchor: { line, ch: start }, head: { line, ch: end } })
        )
      ).reduce((a, b) => a.concat(b));
    }

    return ranges;
  }

  /**
   * Expands the selection to the whole line
   * @param {Range[]} [selections=this.cm.doc.listSelections()] - The ranges to expand
   * @return {Range[]} The expanded selections
   */
  expandSelectionsToLines(selections = this.cm.doc.listSelections()) {
    return selections.map(sel => {
      const [start, end] = this.orderPositions([sel.anchor, sel.head]);
      start.ch = 0;
      end.ch = this.cm.doc.getLine(end.line).length;
      return { anchor: start, head: end };
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
    const newSelections = ranges.map(({ anchor, head }, index) => {
      const rangeText = this.cm.doc.getRange(anchor, head);

      const result = mapFunc(rangeText, { anchor, head }, index);
      let resultText;
      const resultSelection = result.selection || [0, 0];

      if (typeof result === 'string') {
        resultText = result;
      } else {
        resultText = result.text;
      }

      ranges.slice(index + 1).forEach((range, i) => {
        ranges[index + 1 + i] = {
          anchor: this.adjustPosForChange(range.anchor, { from: anchor, to: head,
                                                          text: resultText.split('\n') }),
          head: this.adjustPosForChange(range.head, { from: anchor, to: head,
                                                      text: resultText.split('\n') }),
        };
      });

      this.cm.doc.replaceRange(resultText, anchor, head);
      const s1 = resultText.slice(0, resultSelection[0]).split('\n');
      const s2 = resultText.slice(0, resultText.length - resultSelection[1]).split('\n');
      return {
        anchor: {
          line: anchor.line - 1 + s1.length,
          ch: (s1.length > 1 ? 0 : anchor.ch) + s1[s1.length - 1].length,
        },
        head: {
          line: anchor.line - 1 + s2.length,
          ch: (s2.length > 1 ? 0 : anchor.ch) + s2[s2.length - 1].length,
        },
      };
    });
    this.cm.doc.setSelections(newSelections);
    return newSelections;
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
    if (codemirror.cmpPos(pos, from) < 0) return pos;
    if (codemirror.cmpPos(pos, to) <= 0) return codemirror.changeEnd({ from, to, text });

    let ch = pos.ch;
    if (pos.line === to.line) ch += codemirror.changeEnd({ from, to, text }).ch - to.ch;
    return {
      line: pos.line + text.length - (to.line - from.line) - 1,
      ch,
    };
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
      const ranges = this.extractLines(this.cm.doc.listSelections());
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
      const ranges = this.extractLines(this.cm.doc.listSelections(), true);
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
      const ranges = this.extractLines(this.cm.doc.listSelections(), true);
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
      const ranges = this.extractLines(this.cm.doc.listSelections());
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

    this.cm.focus();
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
      return {
        codemirrorIgnore: true,
      };
    }
  }

  /**
   * Upload images and insert a link
   * @param {Blob[]} files - Images to upload
   */
  uploadImages(files) {
    const selections = this.cm.doc.listSelections();
    const uploadingChanges = files.map((file, index) => {
      let text = '';
      if (selections[index]) {
        [selections[index].anchor, selections[index].head] = this.orderPositions([
          selections[index].anchor,
          selections[index].head,
        ]);
        text = `![${this.cm.doc.getRange(selections[index].anchor,
                                         selections[index].head)}](Uploading...)`;
      } else {
        text = ' ![](Uploading...)';
        const lastPos = selections[selections.length - 1];
        selections.push(this.orderPositions([lastPos.anchor, lastPos.head])[1]);
      }

      return {
        text,
        selection: [text.length - 13, 1],
      };
    });

    const imageLinkSelections = this.mapRanges((text, range, index) => uploadingChanges[index],
                                               selections);
    this.cm.setOption('readOnly', true);
    this.locked = true;

    Promise.all(files.map(file =>
      this.options.upload(file)
          .then(url => url, error => `error while uploading ${error}`) // Silently catch errors
    )).then(uploadURLs => {
      this.cm.setOption('readOnly', false);
      this.locked = false;
      this.cm.doc.setSelections(imageLinkSelections);
      this.cm.doc.replaceSelections(uploadURLs, 'around');
    });
  }

  /**
   * Add a button to the toolbar
   * @param {object} opts
   * @param {string} opts.name - The name of the button (if empty, no button will be added)
   * @param {string} opts.type - The type of the button (will be passed to `handleAction`)
   * @param {} opts.level - Arbitrary level (will be passed to `handleAction`)
   * @param {string[]} opts.keymaps - An array of keymaps to bind to this action
   * @example
   * editor.addToolbarButton({ name: "bold", type: "emphasis", level: 2,
   *                           keymaps: ["Cmd-B", "Ctrl-B"]});
   */
  addToolbarButton({ name, type, level, keymaps }) {
    if (name) {
      const button = document.createElement('button');
      button.innerHTML = name;
      button.addEventListener('click', () => this.handleAction({ type, level }));
      this.toolbar.appendChild(button);
    }

    if (keymaps) {
      keymaps.forEach(key => {
        if (this.options.codemirror.extraKeys[key]) throw new Error(`${key} is already registered`);

        this.options.codemirror.extraKeys[key] = () => this.handleAction({ type, level });
      });
    }
  }
}
