// @flow
declare module "codemirror" {
  declare export default typeof CodeMirror

  declare export type Position = { line: number, ch: number };

  declare type KeyMap = {
    [string]: { [string]: string | false },
    fallthrough: string
  };

  declare class TextMarker {
    changed(): void,
    clear(): void,
    find(): { from: Position, to: Position }
  }

  declare type TextMarkerOptions = {
    atomic?: boolean,
    className?: string,
    css?: string,
    readOnly?: boolean
  };

  declare class Doc {
    size: number, // undocumented (number of lines)
    clearHistory(): void,
    eachLine(f: (l: LineHandle) => void): void,
    getCursor(start?: "anchor" | "from" | "to" | "head"): Position,
    markClean(): void,
    isClean(generation?: number): boolean,
    getValue(separator?: string): string,
    setValue(string): void,
    getLine(n: number): string,
    replaceRange(
      replacement: string,
      from: Position,
      to: Position,
      origin?: string
    ): void,
    getRange(from: Position, to: Position, separator?: string): string,
    markText(
      from: Position,
      to: Position,
      options?: TextMarkerOptions
    ): TextMarker
  }

  declare export type CodeMirrorOptions = {
    cursorBlinkRate?: number,
    disableScrollWheel?: boolean,
    firstLineNumber?: number,
    gutters?: Array<string>,
    lineWrapping?: boolean,
    lineNumbers?: boolean,
    lineNumberFormatter?: (line: number) => string,
    mode?: any,
    readOnly?: boolean,
    scrollbarStyle?: "native" | null,
    theme?: string,
    undoDepth?: number,
    keyMap?: KeyMap,
    extraKeys?: { [key: string]: (cm: CodeMirror) => void }
  };

  declare class Cursor {
    pos: { from: Position, to: Position }, // undocumented
    find(): { from: Position, to: Position } | false, // undocumented
    findNext(): boolean,
    findPrevious(): boolean,
    from(): Position,
    to(): Position,
    replace(text: string, origin?: string): void
  }

  declare class LineHandle {
    gutterMarkers: { [gutterId: string]: string },
    height: number,
    text: string,
    widgets: Array<Widget>
    // other obviously private properties
  }

  declare class Widget {
    line: LineHandle,
    changed(): void,
    clear(): void
  }

  declare type Events = {
    change: (
      cm: CodeMirror,
      changeObj: {
        from: Position,
        to: Position,
        text: string,
        removed: string,
        origin: string
      }
    ) => void,
    cursorActivity: (cm: CodeMirror) => void,
    focus: (cm: CodeMirror, event: SyntheticEvent) => void,
    drop: (cm: CodeMirror, event: SyntheticEvent) => void,
    paste: (cm: CodeMirror, event: SyntheticEvent) => void,
    gutterClick: (
      cm: CodeMirror,
      line: number,
      gutter: string,
      clickEvent: SyntheticMouseEvent
    ) => void
  };

  declare class CodeMirror {
    static fromTextArea(
      textArea: HTMLElement,
      config?: CodeMirrorOptions
    ): CodeMirrorTextarea,

    addLineClass(
      line: number | LineHandle,
      where: string,
      className: string
    ): LineHandle,
    removeLineClass(
      line: number | LineHandle,
      where: string,
      className?: string
    ): LineHandle,
    addLineWidget(
      line: number | LineHandle,
      node: HTMLElement,
      options?: {
        coverGutter?: boolean,
        noHScroll?: boolean,
        above?: boolean,
        handleMouseEvents?: boolean,
        insertAt?: boolean
      }
    ): Widget,
    charCoords(
      pos: Position,
      mode?: string
    ): { left: number, right: number, top: number, bottom: number },
    clearGutter(gutterId: string): void,
    defaultTextHeight(): number,
    findMarks(from: Position, to: Position): Array<TextMarker>,
    focus(): void,
    getDoc(): Doc,
    getSearchCursor(
      query: string,
      start: ?Position,
      options: ?{ caseFold?: boolean, multiline?: boolean }
    ): Cursor,
    getScrollerElement(): HTMLElement,
    getScrollInfo(): {
      top: number,
      left: number,
      width: number,
      height: number,
      clientWidth: number,
      clientHeight: number
    },
    getValue(separator?: string): string,
    setValue(string): void,
    getWrapperElement(): HTMLElement,
    lastLine(): number,
    lineAtHeight(height: number, mode?: "window" | "page" | "local"): number,
    lineInfo(
      n: number
    ): {
      textClass: string
    },
    on<K: $Keys<Events>>(type: K, value: $ElementType<Events, K>): void,
    off<K: $Keys<Events>>(type: K, value: $ElementType<Events, K>): void,
    refresh(): void,
    scrollTo(left: ?number, top: ?number): void,
    setGutterMarker(
      line: number | LineHandle,
      gutterId: string,
      value: HTMLElement
    ): LineHandle,
    setOption<K: $Keys<CodeMirrorOptions>>(
      option: K,
      value: $ElementType<CodeMirrorOptions, K>
    ): void,
    // https://codemirror.net/doc/manual.html#setSelection
    setSelection(
      anchor: Position,
      head?: Position,
      options?: {
        scroll?: boolean,
        origin?: string,
        bias?: -1 | 1
      }
    ): void,
    setSelections(
      ranges: Array<{
        anchor: Position,
        head?: Position
      }>,
      primary?: number,
      options?: {
        scroll?: boolean,
        origin?: string,
        bias?: -1 | 1
      }
    ): void,
    listSelections(): Array<{ anchor: Position, head: Position }>,
    setSize(
      width: number | string | null,
      height: number | string | null
    ): void,
    static normalizeKeyMap(KeyMap): KeyMap,
    static Pass: any,
    static keyMap: KeyMap
  }

  declare export class CodeMirrorTextarea extends CodeMirror {
    save(): void,
    toTextArea(): void,
    getTextArea(): HTMLTextAreaElement
  }
}
