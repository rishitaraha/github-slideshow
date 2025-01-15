import { Textbox } from '@aus-platform/cesium';

export type TextboxListener = (textboxes: Textbox[]) => void;
export type TextboxToolEventListener = TextboxListener | VoidFunction;
