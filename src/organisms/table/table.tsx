// Table ref: https://tanstack.com/table/v8/docs/examples/react/basic
// Columns ref: https://tanstack.com/table/v8/docs/guide/column-defs
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Button, ButtonVariant, Input, Spinner } from '../../atoms';
import { IconIdentifier, Placement } from '../../enums';
import { Select, SelectOption } from '../../molecules';
import { EmptyList } from '../../shared/components';
import { pageSizeOptions } from './constants';
import { TableProps } from './types';

export const Table: React.FC<TableProps<any>> = ({
  columns,
  data,
  emptyListComponent,
  enableRowSelection = false,
  isEmptySearchResults,
  isLoading,
  onPageSizeChange,
  onPaginationChange,
  onRowSelectionChange,
  rowIdentifier,
  rowSelection,
  pageCount,
  paginationProps,
  scrollToRowId,
  tableHeaderOptions,
  onMouseClick = () => {},
  rowClassesGenerator = () => '',
}) => {
  // States.
  const ausRowClass = classNames([
    'aus-table__tr',
    { 'aus-table__tr__select-enabled': enableRowSelection },
  ]);

  const [gotoPage, setGotoPage] = useState('1');

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getRowId: (row) =>
      rowIdentifier ? row?.[rowIdentifier]?.toString() : row.id,
    state: {
      pagination: paginationProps,
      rowSelection: rowSelection,
    },
    manualPagination: true,
    onRowSelectionChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    enablePinning: true,
  });

  // useEffects.
  useEffect(() => {
    if (scrollToRowId) {
      const rowElement = document.querySelector(
        `.aus-table-container [data-row-id="${scrollToRowId}"]`,
      );
      if (rowElement) {
        const container = document.querySelector('.aus-table-container');
        if (container) {
          const tableOffsetTop = container.getBoundingClientRect().top;
          const rowOffsetTop = rowElement.getBoundingClientRect().top;
          // Calculates the scroll position needed to vertically center the row element within the container by subtracting the container's top offset from the row's top offset and adjusting for the container's visible height.
          const scrollPosition =
            rowOffsetTop - tableOffsetTop - container.clientHeight / 2;

          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [scrollToRowId]);

  useEffect(() => {
    const gotoPageNumber = Number(gotoPage);
    if (gotoPageNumber > 0 && gotoPageNumber <= table.getPageCount()) {
      table.setPageIndex(gotoPageNumber - 1);
    }
  }, [gotoPage]);

  // Conditional Check.
  const isGotoInputValid = () => {
    const gotoPageNumber = Number(gotoPage);
    return gotoPageNumber > 0 && gotoPageNumber <= table.getPageCount();
  };

  return (
    <>
      {tableHeaderOptions && (
        <div className="aus-table__header-options">{tableHeaderOptions}</div>
      )}
      <div className="aus-table-container">
        <table className="aus-table">
          <thead className="aus-table__thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="aus-table__tr" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="aus-table__th"
                    key={header.id}
                    {...{
                      colSpan: header.colSpan,
                      style: {
                        width: header.getSize(),
                      },
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="aus-table__tbody">
            {isLoading ? (
              <tr>
                <td>
                  <Spinner />
                </td>
              </tr>
            ) : isEmptySearchResults && !isLoading ? (
              <tr>
                <td>
                  <EmptyList
                    iconIdentifier={IconIdentifier.Search}
                    headingText="No results"
                    bodyText="We couldn't find what you're looking for"
                  />
                </td>
              </tr>
            ) : data.length == 0 && emptyListComponent ? (
              <tr>
                <td>{emptyListComponent}</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  className={classNames(
                    ausRowClass,
                    rowClassesGenerator(row.original),
                    'cursor',
                  )}
                  key={row.id}
                  data-row-id={row.id}
                  onMouseDown={(e) => onMouseClick(e, row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className="aus-table__td"
                      key={cell.id}
                      {...{
                        style: {
                          width: cell.column.getSize(),
                        },
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="aus-table__pagination">
          <div className="aus-table__pagination-page-size">
            <span className="aus-table__pagination-page-size__text aus-table__pagination__text">
              Rows per page
            </span>
            <Select<SelectOption<number>>
              options={pageSizeOptions}
              value={
                pageSizeOptions.find(
                  (option) => option.value == paginationProps.pageSize,
                ) ?? pageSizeOptions[0]
              }
              onChange={onPageSizeChange}
              menuPlacement={Placement.Top}
            />
          </div>
          <div className="aus-table__pagination-pages">
            <Button
              variant={ButtonVariant.Outline}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              leftIconIdentifier={IconIdentifier.ChevronSmallLeft}
              data-testid="table-pagination-previous-btn"
            ></Button>
            <span
              className="aus-table__pagination-pages__text aus-table__pagination__text"
              data-testid="table-pagination-pages-text"
            >
              {'Page ' +
                (table.getState().pagination.pageIndex + 1) +
                ' of ' +
                table.getPageCount()}
            </span>
            <Button
              variant={ButtonVariant.Outline}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              leftIconIdentifier={IconIdentifier.ChevronSmallRight}
              data-testid="table-pagination-next-btn"
            ></Button>
          </div>
          <div className="aus-table__pagination-goto">
            <span className="aus-table__pagination-goto__text aus-table__pagination__text">
              Jump To Page
            </span>
            <Input.Number
              className="form-control"
              onChange={(e) => {
                setGotoPage(e.currentTarget.value);
              }}
              value={gotoPage}
              max={table.getPageCount()}
              min={1}
              isInvalid={!isGotoInputValid()}
              onBlur={() => {
                if (!isGotoInputValid()) {
                  setGotoPage(
                    (table.getState().pagination.pageIndex + 1).toString(),
                  );
                }
              }}
              data-testid="table-goto-page-input"
            />
          </div>
        </div>
      </div>
    </>
  );
};
