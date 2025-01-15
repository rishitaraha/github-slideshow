// Ref: https://skeletonreact.com/
import React from 'react';
import ContentLoader, { IContentLoaderProps } from 'react-content-loader';
import { ColorCodes } from '../../../enums';

export type TableSkeletonProps = IContentLoaderProps & {
  colCount?: number;
  rowCount?: number;
  rowWidth?: number;
};

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  speed = 2,
  rowCount = 4,
  ...rest
}) => {
  // Variables.
  const maxX = 1380;
  const maxY = 788;

  const minX = 0;
  const minY = 0;

  const radius = 6;

  // Renderers.
  const tableHeaderRenderer = (columnCount = 4) => {
    const negativeBlockSize = { height: 22, width: 90 };
    const blockSize = {
      height: negativeBlockSize.height,
      width: (maxX - negativeBlockSize.width * columnCount) / (columnCount + 1),
    };
    const blocksArray: number[] = [];

    for (let i = 0; i < columnCount + 1; i++) {
      blocksArray.push(minX + i * (blockSize.width + negativeBlockSize.width));
    }

    return (
      <>
        {/* Header Top Border */}
        <rect x={minX} y={minY} rx={0} ry={0} width={maxX} height={13} />
        {/* Header Top Border */}

        {/* Header column blocks */}
        {blocksArray.map((el, index) => (
          <rect
            key={el + index}
            x={el}
            y={13}
            rx={0}
            ry={0}
            width={blockSize.width}
            height={negativeBlockSize.height}
          />
        ))}
        {/* Header column blocks */}

        {/* Header Bottom Border */}
        <rect x={minX} y={minY + 35} rx={0} ry={0} width={maxX} height={13} />
        {/* Header Bottom Border */}
      </>
    );
  };

  const renderRowDivider = (y: number) => (
    <rect x={minX} y={y} rx="3" ry="3" width={maxX} height="2" />
  );

  const renderRow = (
    columnCount = 4,
    rowStart = 48,
    topBottomPadding = 14.5,
  ) => {
    const blockSize = {
      height: 22,
      width: 90,
    };
    const negativeBlockSize = {
      height: blockSize.height,
      width: (maxX - blockSize.width * columnCount) / (columnCount + 1),
    };

    const blocksArray: number[] = [];

    for (let i = 0; i < columnCount + 1; i++) {
      blocksArray.push(
        negativeBlockSize.width +
          i * (blockSize.width + negativeBlockSize.width),
      );
    }

    return (
      <>
        {blocksArray.map((el, index) => (
          <>
            <rect
              key={el + index}
              x={el}
              y={rowStart + topBottomPadding}
              rx={radius}
              ry={radius}
              width={blockSize.width}
              height={negativeBlockSize.height}
            />
          </>
        ))}
      </>
    );
  };

  const renderRows = (
    rowCount: number,
    rowStart = 48,
    rowSize = 22,
    topPadding = 14.5,
  ) => {
    const rowArray: number[] = [];
    for (let i = 1; i < rowCount + 1; i++) {
      rowArray.push(i * rowStart);
    }
    return rowArray.map((el) => {
      return (
        <>
          {renderRow(4, el, topPadding)}
          {renderRowDivider(el + topPadding * 2 + rowSize)}
        </>
      );
    });
  };

  return (
    <ContentLoader
      {...rest}
      width={1380}
      height={788}
      viewBox="0 0 1380 788"
      foregroundColor={'#ededed'}
      backgroundColor={ColorCodes.White}
      speed={speed}
    >
      {tableHeaderRenderer()}
      {renderRows(rowCount)}

      {/* Table left right border */}
      <rect x={minX} y={minY} rx="3" ry="3" width="2" height={maxY} />
      <rect x={maxX - 1} y={minY} rx="3" ry="3" width="2" height={maxY} />
      {/* Table left right border */}

      {/* Table last border */}
      <rect x={minX - 1} y={maxY - 1} rx="3" ry="3" width={maxX} height={2} />
      {/* Table last border */}
    </ContentLoader>
  );
};
