import React from 'react';
import { ListItemVariant } from '.';
import { ForwardRef } from 'shared/type-utils';

export type ListItemProps = React.FC<
  React.HTMLProps<HTMLDivElement> & {
    variant?: ListItemVariant;
    enableCheckBox?: boolean;
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
    onCheckChange?: (event: React.MouseEvent, checked: boolean) => void;
  }
>;

type ForwardRefDivType = ForwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>;

export type ListItemComponents = {
  Avatar: ForwardRefDivType;
  Action: ForwardRefDivType;
  Content: ForwardRefDivType;
};
