import classnames from 'classnames';
import React from 'react';
import { IndentedTreeProps } from './types';

export const IndentedTree: React.FC<IndentedTreeProps> = ({
  className,
  visible = true,
  children,
}) => {
  const customClassName = classnames([
    'indented-tree-container',
    className,
    {
      'indented-tree-container--visible': visible,
    },
  ]);
  return <div className={customClassName}>{visible && children}</div>;
};
