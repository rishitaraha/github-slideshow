import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import classNames from 'classnames';
import { isNil } from 'lodash';
import { Spinner } from '@aus-platform/design-system';
import { HRATable } from './hra-table';
import { HRATableCardHeader } from './hra-table-card-header';
import { handleResponseErrorMessage, useHaulRoadAttributes } from 'shared/api';

type HRATableCardProps = {
  isExpanded: boolean;
  onClose: VoidFunction;
  haulRoadId: string;
  haulRoadName: string;
};

export const HRATableCard: React.FC<HRATableCardProps> = ({
  isExpanded,
  onClose,
  haulRoadId,
  haulRoadName,
}) => {
  // States.
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);

  // Constants.
  const safeValue = (value: any): string | number => {
    if (isNil(value)) {
      return 'N/A';
    }
    return value;
  };

  // API.
  const {
    data: haulRoadAttributeResponseData,
    error: haulRoadAttributeErrorResponse,
    isSuccess: isSuccessHaulRoadAttributes,
    isError: isErrorHaulRoadAttribute,
    isLoading: isLoadingHaulRoadAttribute,
  } = useHaulRoadAttributes(haulRoadId);

  // Helpers.
  const transformHaulRoadAttributes = (
    haulRoadAttributeResponseData: any[],
  ): { attribute: string; values: (string | number)[] }[] => {
    return [
      {
        attribute: 'PATCH INTERVALS',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.patchName),
        ),
      },
      {
        attribute: 'SEGMENT NAME',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.chainName),
        ),
      },
      {
        attribute: 'CHAINAGE (m)',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.chainDist),
        ),
      },
      {
        attribute: 'START ELEVATION (m)',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.startElev),
        ),
      },
      {
        attribute: 'END ELEVATION (m)',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.endElev),
        ),
      },
      {
        attribute: 'GRADIENT ANGLE (°)',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.gradient),
        ),
      },
      {
        attribute: 'GRADIENT RATIO (1:X)',
        values: haulRoadAttributeResponseData.map(
          (row) => `1:${safeValue(row.gradientX)}`,
        ),
      },
      {
        attribute: 'GRADIENT RISK CLASSIFICATION',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.gradientRiskCategory),
        ),
      },
      {
        attribute: 'WIDTH (m)',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.chainwidth),
        ),
      },
      {
        attribute: 'WIDTH RISK CLASSIFICATION',
        values: haulRoadAttributeResponseData.map((row) =>
          safeValue(row.widthRiskCategory),
        ),
      },
    ];
  };

  // useEffects.
  useEffect(() => {
    if (isSuccessHaulRoadAttributes && haulRoadAttributeResponseData) {
      // Transformed rows with updated headings and logic.
      const updatedData = transformHaulRoadAttributes(
        haulRoadAttributeResponseData,
      );

      setTableData(updatedData);

      // Generate columns based on the patches.
      const generatedColumns: ColumnDef<{
        attribute: string;
        values: string[];
      }>[] = [
        {
          accessorKey: 'attribute',
          cell: (info: any) => <span>{info.getValue()}</span>,
        },
        ...haulRoadAttributeResponseData.map((_, idx: number) => ({
          id: `Patch_${idx}`,
          accessorFn: (row) => safeValue(row.values[idx]),
          cell: (info) => <span>{info.getValue()}</span>,
        })),
      ];

      setColumns(generatedColumns);
    }
  }, [isSuccessHaulRoadAttributes, haulRoadAttributeResponseData]);

  useEffect(() => {
    handleResponseErrorMessage(
      isErrorHaulRoadAttribute,
      haulRoadAttributeErrorResponse,
    );
  }, [isErrorHaulRoadAttribute]);

  // Table instance.
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableCardClassName = classNames([
    'hra-table-card',
    isExpanded && 'hra-table-card--expand',
  ]);
  return (
    <Card className={tableCardClassName}>
      <HRATableCardHeader
        onClose={onClose}
        haulRoadId={haulRoadId}
        haulRoadName={haulRoadName}
      />
      <Card.Body className="hra-table-card__body">
        {isLoadingHaulRoadAttribute ? <Spinner /> : <HRATable table={table} />}
      </Card.Body>
    </Card>
  );
};
