import React from "react";
import * as XLSX from 'xlsx';
import { DownloadIcon } from "../../icons";

export interface Column<T> {
  header: string;
  accessor: keyof T;
  cellRenderer?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  onRowClick?: (row: T) => void;
  title?: string;
}

function DataTable<T extends object>({ columns, data, className = "", onRowClick, title = "Datos" }: DataTableProps<T>) {
  const exportToExcel = () => {
    // Preparar los datos para Excel
    const excelData = data.map(row => {
      const rowData: Record<string, any> = {};
      columns.forEach(col => {
        const value = row[col.accessor];
        rowData[col.header] = value;
      });
      return rowData;
    });

    // Crear un libro de Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");

    // Generar el archivo Excel
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="flex justify-end mb-4">
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <DownloadIcon className="w-4 h-4" />
          Exportar a Excel
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-white/[0.05]">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`hover:bg-gray-50 dark:hover:bg-white/[0.04] ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {col.cellRenderer
                    ? col.cellRenderer(row[col.accessor], row)
                    : String(row[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
