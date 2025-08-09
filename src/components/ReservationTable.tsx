import { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Schema } from "../../amplify/data/resource";

export interface ReservationTableProps {
  reservations: Array<Schema["Reservation"]["type"]>;
  onEdit: (reservation: Schema["Reservation"]["type"]) => void;
  onDelete: (reservation: Schema["Reservation"]["type"]) => void;
}

export default function ReservationTable({ reservations, onEdit, onDelete }: ReservationTableProps) {
  const columns = useMemo<MRT_ColumnDef<Schema["Reservation"]["type"]>[]>(
    () => [
      {
        // Material React Table expects a Date object for date filters with 'between'.
        // We convert the stored ISO string (or number) into a Date here.
        accessorFn: (row) => new Date((row as Schema["Reservation"]["type"]).datetime as unknown as string),
        id: "datetime",
        header: "Fecha y hora",
        Cell: ({ cell }) => (cell.getValue<Date>()).toLocaleString(),
        filterVariant: "date",
        filterFn: "between",
        size: 180,
      },
      {
        accessorKey: "customerName",
        header: "Cliente",
      },
      {
        accessorKey: "partySize",
        header: "Nº Personas",
      },
      {
        accessorKey: "tableNumber",
        header: "Mesa",
      },
      {
        accessorKey: "notes",
        header: "Observaciones",
      },
    ],
    []
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MaterialReactTable
        columns={columns}
        data={reservations}
        enableGlobalFilter
        enableColumnFilters
        enableRowActions
        positionActionsColumn="last"
        initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
        muiTablePaperProps={{ elevation: 0 }}
        renderRowActions={({ row }) => (
          <>
            <IconButton
              color="primary"
              size="small"
              onClick={() => onEdit(row.original)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => onDelete(row.original)}
            >
              <DeleteIcon />
            </IconButton>
          </>
        )}
      />
    </LocalizationProvider>
  );
}
