/* @flow */

import type { Pos, Range } from "./util";

export interface Adapter {
  attach(): void,
  destroy(): void,
  setToolbar(Map<string, any>): void,
  setKeymap(Map<string, any>): void,
  listSelections(): Array<Range>,
  focus(): void,
  getRange(Range): string,
  replaceRange(string, Range): void,
  setSelection(...Array<Range | Pos>): void,
  getLine(number): string,
  setText(string): void,
  getText(): string,
  lock(): void,
  unlock(): void,
  on(string, Function): void
}

export type SimpleActionType = "code" | "link";
export type LeveledActionType = "emphasis" | "heading" | "blockquote";
export type RawAction =
  | {
      type: SimpleActionType
    }
  | {
      type: LeveledActionType,
      level: number
    };

export type WeakAction = RawAction | { level: number };

export type Action = RawAction | Function;

export type ToolbarItem = {
  action: Action,
  alt?: string,
  children?: Map<string, ToolbarItem>
};

export type Toolbar = Map<string, ToolbarItem>;

export type Keymap = Map<string, Action>;

export type EditorAction = {
  name?: string,
  keymap?: string,
  action: RawAction,
  children?: Array<any>
};

export type ListItem =
  | {
      type: "ordered",
      number: number,
      text: string
    }
  | {
      type: "unordered",
      bullet: "*" | "-",
      text: string
    }
  | {
      type: "none",
      text: string
    };

export type Emphasis = {
  level: number,
  type: "*" | "_",
  text: string
};

export type Blockquote = {
  level: number,
  text: string
};

export type Heading = {
  level: number,
  text: string
};

export type RangeMap = (
  string,
  Range,
  number
) => string | { text: string, selection: [number, number] };
