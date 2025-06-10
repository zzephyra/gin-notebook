import { AdjustmentsHorizontalIcon, BarsArrowDownIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline";
import {
    Card, CardBody, Table, TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    Divider,
    Button,
    Popover, PopoverTrigger, PopoverContent,
    TableCell,
    Select,
    SelectItem,
    getKeyValue,
    Avatar,
    Tooltip,
    Image
} from "@heroui/react"
import { AnimatePresence, motion } from "framer-motion"
import emptyFavorites from "@/assets/images/common/emptyFavorite.png";
import React, { useEffect } from "react";
import { useLingui } from "@lingui/react/macro";
import { GetFavoriteNoteListRequest, SetFavoriteNoeRequest } from "@/features/api/note";
import { useParams } from "react-router-dom";
import { FavoriteNoteListParams, FavoriteNote } from "@/features/api/type";
import { Key } from "@react-types/shared";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import NoteListViewEditor from "@/components/note/noteList";
import { Note } from "./type";
const FavoritesPage = () => {
    const { t } = useLingui();
    const params = useParams();
    // const [isEditTitle, setisEditTitle] = React.useState<boolean>(false);
    const [data, setData] = React.useState<Note[]>([]);
    const [filter] = React.useState<FavoriteNoteListParams>({
        workspace_id: params.id || "",
        limit: 10,
        offset: 0,
    });
    const [hasMounted, setHasMounted] = React.useState(false);
    const [selectIndex, setSelectIndex] = React.useState<number | null>(null);
    const selectedNote = selectIndex != null ? data[selectIndex] : null;
    React.useEffect(() => {
        setHasMounted(true); // 页面挂载完成，后续可以启用动画
    }, []);

    const updateFavoriteNote = (noteId: string, updatedNote: Partial<FavoriteNote>) => {
        setData(prevData =>
            prevData.map(note =>
                note.note_id === noteId
                    ? { ...note, ...updatedNote } // Merge the updated fields
                    : note // Keep the rest unchanged
            )
        );
    };


    const classNames = React.useMemo(
        () => ({
            base: "flex-1",
            wrapper: "h-full",
            table: "h-full",
            tbody: "favorite-note-tbody",
            thead: "group",
            th: ["bg-transparent", "text-default-500", "border-b", "border-divider", "border-x", "border-l-transparent", "border-r-transparent", "group-hover:border-r-slate-100", "group-hover:border-l-slate-100", "group-hover:first:border-l-transparent", "group-hover:last:border-r-transparent"],
            td: [
                "cursor-pointer",
                "group-data-[first=true]/tr:first:w-4",
                "group-data-[last=true]/tr:last:w-20", // apply this to the last column
            ],
        }),
        [],
    );

    const handleGetFavorites = async () => {
        let res = await GetFavoriteNoteListRequest(filter)
        setData(res)
    }

    // const handleUpdateFilter = (newFilter: Partial<FavoriteNoteListParams>) => {
    //     setFilter((prev) => ({
    //         ...prev,
    //         ...newFilter,
    //     }));
    // }

    const handleChangeNoteFavorite = async (note_id: string, is_favorite: boolean) => {
        SetFavoriteNoeRequest(note_id, is_favorite);
        updateFavoriteNote(note_id, { is_favorite });
    }

    const note: null | Note = React.useMemo(() => {
        return selectIndex == null ? null : data[selectIndex];
    }, [selectIndex, selectedNote])

    const handleChangeIndex = (index: number) => {
        if (index < 0 || index >= data.length) {
            return;
        }
        setSelectIndex(index);
    }

    const tableCell = React.useCallback((item: Note, columnKey: Key) => {
        switch (columnKey) {
            case "is_favorite":
                return (
                    <div className="cursor-pointer">
                        <Button size="sm" isIconOnly variant="light" radius="full" className="hover:!bg-transparent" onPress={() => { handleChangeNoteFavorite(item.note_id, !item.is_favorite) }}>
                            {item.is_favorite ? <SolidStarIcon className="w-4 text-yellow-400" /> : <StarIcon className="w-5" />}
                        </Button>
                    </div>
                );
            case "note_title":
                return (
                    <div className="block w-full cursor-text h-full hover:bg-slate-300 pl-2 rounded-lg">
                        <span className="text-sm text-slate-400">
                            {item.note_title || t`Untitled Note`}
                        </span>
                    </div>
                );
            case "owner":
                return (
                    <div className="flex items-center gap-2">
                        <Avatar size="sm" src={item.owner_avatar}></Avatar>
                        <span className="text-slate-400 text-xs">{item.owner_nickname || item.owner_email}</span>
                    </div>
                );
            case "updated_at":
                var parseDate = new Date(item.updated_at);
                const year = parseDate.getFullYear();
                const monthText = parseDate.toLocaleString('en-US', { month: 'short' }); // 'Jun'
                const month = String(parseDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始
                const day = String(parseDate.getDate()).padStart(2, '0');
                const hours = String(parseDate.getHours()).padStart(2, '0');
                const minutes = String(parseDate.getMinutes()).padStart(2, '0');
                const seconds = String(parseDate.getSeconds()).padStart(2, '0');
                const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                return (
                    <Tooltip color="foreground" content={formatted} placement="top" showArrow>
                        <span className="text-xs text-slate-400">
                            {monthText} {day}
                        </span>
                    </Tooltip>
                );
            default:
                return getKeyValue(item, columnKey);
        }
    }, []);

    const handleDeleteNote = () => {
        handleGetFavorites()
    }



    useEffect(() => {
        handleGetFavorites()
    }, [filter])


    return (
        <>
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectIndex == null ? "list" : "editor"}
                    variants={{
                        enter: {
                            x: 100,
                            opacity: 0,
                        },
                        center: {
                            x: 0,
                            opacity: 1,
                        },
                        exit: {
                            x: 100,
                            opacity: 0,
                        },
                    }}
                    initial={hasMounted ? "enter" : false}
                    animate={hasMounted ? "center" : false}
                    exit={hasMounted ? "exit" : "undefined"}
                    transition={{ duration: 0.5 }}
                    className="flex-1 relative h-full flex flex-col">
                    {selectIndex == null ? (<div className="p-2 flex-1 flex flex-col items-center justify-center gap-4">
                        <Card className="w-full">
                            <CardBody>
                                <div className="flex items-center  justify-between">
                                    <div className="flex gap-2 items-center select-none">
                                        <h2 className="text-[14px] font-semibold">Favorites</h2>
                                    </div>
                                    <div className="flex h-5 items-center gap-2 text-small">
                                        <Button isIconOnly variant="light" size="sm">
                                            <MagnifyingGlassIcon className="w-4" />
                                        </Button>
                                        <Divider orientation="vertical" className="h-full" />
                                        <Popover>
                                            <PopoverTrigger>
                                                <Button isIconOnly variant="light" size="sm">
                                                    <AdjustmentsHorizontalIcon className="w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-2">
                                                {() => (
                                                    <div className="p-2 flex gap-2 w-full">
                                                        <Select label={t`Ordering`} onSelectionChange={(key) => {
                                                            console.log("Selected ordering key:", key);
                                                        }} size="sm" name="ordering" labelPlacement="outside-left" defaultSelectedKeys={["title"]} classNames={{ trigger: "w-28 min-h-0 h-7", popoverContent: "w-32" }} placeholder={t`Select sorting field`} className="w-full">
                                                            <SelectItem key="title">
                                                                {t`Title`}
                                                            </SelectItem>
                                                            <SelectItem key="updatedAt">
                                                                {t`Updated Time`}
                                                            </SelectItem>
                                                            <SelectItem key="createdAt">
                                                                {t`Created Time`}
                                                            </SelectItem>
                                                        </Select>
                                                        <Button isIconOnly variant="light" size="sm">
                                                            <BarsArrowDownIcon className="w-4 text-gray-600 cursor-pointer" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Table
                            showSelectionCheckboxes
                            classNames={classNames}>
                            <TableHeader>
                                <TableColumn key="is_favorite" className="w-4">
                                    {""}
                                </TableColumn>
                                <TableColumn key="title" className="pl-5">
                                    {t`Title`}
                                </TableColumn>
                                <TableColumn key="owner">{t`Owner`}</TableColumn>
                                <TableColumn key="updated_at">{t`Updated At`}</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent={
                                <div className="flex flex-col items-center justify-center w-full">
                                    <Image className="select-none appearance-none pointer-events-none" width={200} src={emptyFavorites} alt="empty favorite picture" aria-label="empty favority picture" />
                                    <span className="select-none text-gray-400 text-sm">{t`Meow~ No favorite notes here yet. Time to star the ones you love!`}</span>
                                </div>
                            }>
                                {data.map((item, index) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => <TableCell onClick={() => setSelectIndex(index)}>{tableCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>)
                        : (
                            <div className="z-50 absolute flex-1 h-full w-full bottom-0 left-0 right-0 bg-white">
                                <NoteListViewEditor onDelete={handleDeleteNote} note={note} onChangeIndex={handleChangeIndex} currentIndex={selectIndex} maxIndex={data.length} onClose={() => setSelectIndex(null)}></NoteListViewEditor>
                            </div>
                        )}
                </motion.div>
            </AnimatePresence>

        </>
    )
}

export default FavoritesPage