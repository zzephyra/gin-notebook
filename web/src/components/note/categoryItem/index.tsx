import { Note } from "@/pages/workspace/type";
import { ArrowTurnUpRightIcon, EllipsisHorizontalIcon, StarIcon } from "@heroicons/react/24/outline";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, useDisclosure } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import DeleteNoteModal from "@/components/modal/note/deleteModal";
import SelectCategoryModal from "@/components/modal/note/selectCategory";
import { useParams } from "react-router-dom";
import { SetFavoriteNoeRequest } from "@/features/api/note";
import { RootState, store } from "@/store";
import { notesAdapter, UpdateNoteByID } from "@/store/features/workspace";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import { useSelector } from "react-redux";
const notesSelectors = notesAdapter.getSelectors<RootState>(
    (state) => state.workspace.noteList
)

const CategoryListItem = ({ note }: { note: Note }) => {

    const noteById = useSelector((state: RootState) =>
        notesSelectors.selectById(state, note.id)
    )


    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onOpenChange: onOpenDeleteModalChange } = useDisclosure();
    const { isOpen: isOpenMoveToModal, onOpen: onOpenMoveToModal, onOpenChange: onOpenMoveToModalChange } = useDisclosure();

    const { t } = useLingui();
    const { id } = useParams(); // 获取路径参数

    const handleSetNoteFavorite = async () => {
        var ori_value = note.is_favorite;
        SetFavoriteNoeRequest(note.id, !ori_value).catch((err) => {
            // 如果设置收藏失败，恢复原状态
            store.dispatch(UpdateNoteByID({ ...note, is_favorite: ori_value }));
        })
        store.dispatch(UpdateNoteByID({ ...note, is_favorite: !ori_value }));
    }

    return (
        <div className={`flex items-center justify-between group`}>
            <div className="text-sm text-gray-700">
                {noteById.title}
            </div>
            <div>
                <Dropdown
                    onOpenChange={setIsDropdownOpen}
                >
                    <DropdownTrigger>
                        <EllipsisHorizontalIcon
                            className={`fill-slate-600 w-5 transition-opacity duration-200 ${isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                        {/* <DropdownItem key="new">New file</DropdownItem>
                        <DropdownItem key="copy">Copy link</DropdownItem> */}
                        {
                            !noteById.is_favorite ?
                                <DropdownItem key="add_favorite" startContent={<StarIcon className="w-4" />} onPress={handleSetNoteFavorite} >{t`Add to Favorites`}</DropdownItem> :
                                <DropdownItem key="remove_favorite" startContent={<SolidStarIcon className="w-4 text-yellow-400" />} onPress={handleSetNoteFavorite} >{t`Remove from Favorites`}</DropdownItem>
                        }
                        <DropdownItem key="edit" onPress={onOpenMoveToModal} showDivider startContent={<ArrowTurnUpRightIcon className="w-4" />}>{t`Move to`}</DropdownItem>
                        <DropdownItem key="delete" onPress={onOpenDeleteModal} className="text-danger" color="danger" startContent={<Trash2 className="w-4" />}>
                            {t`Move to trash`}
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                <DeleteNoteModal isOpen={isOpenDeleteModal} onOpenChange={onOpenDeleteModalChange} note={noteById}></DeleteNoteModal>
                <SelectCategoryModal workspaceID={id} isOpen={isOpenMoveToModal} onOpenChange={onOpenMoveToModalChange} note={noteById} />
            </div>
        </div>
    );
}

export default CategoryListItem;