import { flexRender } from '@tanstack/react-table';

export const HRATable = ({ table }) => {
  return (
    <div className="hra-table-container">
      <table className="hra-table">
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell, idx) => (
                <td
                  key={cell.id}
                  className={idx === 0 ? 'table-header' : 'table-cell'}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
