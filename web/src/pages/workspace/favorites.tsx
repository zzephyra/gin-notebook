import {
    Card, CardBody, Table, TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell
} from "@heroui/react"
import React from "react";

const FavoritesPage = () => {
    const [data, setData] = React.useState<any[]>([]);
    const classNames = React.useMemo(
        () => ({
            th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
            td: [
                // changing the rows border radius
                // first
                "group-data-[first=true]/tr:first:before:rounded-none",
                "group-data-[first=true]/tr:last:before:rounded-none",
                // middle
                "group-data-[middle=true]/tr:before:rounded-none",
                // last
                "group-data-[last=true]/tr:first:before:rounded-none",
                "group-data-[last=true]/tr:last:before:rounded-none",
            ],
        }),
        [],
    );

    return (
        <>
            <div className="p-10 flex-1 flex flex-col items-center justify-center">
                <Card className="w-full">
                    <CardBody>
                        <Table

                            isCompact
                            selectionBehavior="toggle"
                            selectionMode="multiple"
                            classNames={classNames}>
                            <TableHeader>
                                <TableColumn>NAME</TableColumn>
                                <TableColumn>ROLE</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id}>
                                        {item.name}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </>
    )
}

export default FavoritesPage