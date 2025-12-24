"use client"

import {
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    PaginationOptions
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table"

import React, { useState } from "react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    getRowClassName?: (row: TData) => string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    getRowClassName,
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = useState<SortingState>([])
    const [filterCriteria, setFilterCriteria] = useState<ColumnFiltersState>([])
    const [filterCol, setFilterCol] = useState<string>("")

    const columnNames = columns.map((column) => {
        return column.header as string
    })


    const handleFilter = (value: string) => {
        setFilterCol(value)
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setFilterCriteria,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters: filterCriteria,
        },
        initialState: {
            pagination: {
                pageSize: 20,
                pageIndex: 0,
            },
        },


    })

    return <div >
        <div className="rounded-md border-2 border-neon-purple bg-foreground w-inherit">
            <Table>
                <TableHeader className="border-neon-purple text-text">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead
                                        className="border-neon-purple border-r-2 text-text"
                                        key={header.id} >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {
                            const rowClassName = getRowClassName 
                                ? getRowClassName(row.original)
                                : "";
                            return (
                            <TableRow
                                className={`hover:bg-background border-neon-purple border-r-2 text-text ${rowClassName}`}
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}
                                        className="max-w-32 overflow-hidden border-neon-purple border-r-2">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className=" text-center border-neon-purple border-r-2">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

    </div>
}
