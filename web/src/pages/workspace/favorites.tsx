import { MagnifyingGlassIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import {
    Card, CardBody, Table, TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    Divider,
    Button
} from "@heroui/react"
import React from "react";

const FavoritesPage = () => {
    const data: any[] = []
    // const [data, setData] = React.useState<any[]>([]);
    const classNames = React.useMemo(
        () => ({
            base: "flex-1",
            wrapper: "h-full",
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
            <div className="p-2 flex-1 flex flex-col items-center justify-center gap-4">
                <Card className="w-full">
                    <CardBody>
                        <div className="flex items-center  justify-between">
                            <div className="flex gap-2 items-center select-none">
                                <Button isIconOnly variant="light" size="sm">
                                    <ViewColumnsIcon className="w-4 text-gray-600 cursor-pointer" />

                                </Button>
                                <h2 className="text-[14px] font-semibold">Favorites</h2>
                            </div>
                            <div className="flex h-5 items-center gap-2 text-small">
                                <Button isIconOnly variant="light" size="sm">
                                    <MagnifyingGlassIcon className="w-4" />
                                </Button>
                                <Divider orientation="vertical" className="h-full" />
                                <Button isIconOnly variant="light" size="sm">
                                    <MagnifyingGlassIcon className="w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

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
            </div>
        </>
    )
}

export default FavoritesPage