import { Note } from "@/pages/workspace/type";
import { ArrowTurnUpRightIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, useDisclosure } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import DeleteNoteModal from "@/components/modal/note/deleteModal";
import SelectCategoryModal from "@/components/modal/note/selectCategory";
import { useParams } from "react-router-dom";


const CategoryListItem = ({ note }: { note: Note }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onOpenChange: onOpenDeleteModalChange } = useDisclosure();
    const { isOpen: isOpenMoveToModal, onOpen: onOpenMoveToModal, onOpenChange: onOpenMoveToModalChange } = useDisclosure();

    const { t } = useLingui();
    const { id } = useParams(); // 获取路径参数

    return (
        <div className={`flex items-center justify-between group`}>
            <div className="text-sm text-gray-700">
                {note.title}
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
                        <DropdownItem key="edit" onPress={onOpenMoveToModal} showDivider startContent={<ArrowTurnUpRightIcon className="w-4" />}>{t`Move to`}</DropdownItem>
                        <DropdownItem key="delete" onPress={onOpenDeleteModal} className="text-danger" color="danger" startContent={<Trash2 className="w-4" />}>
                            {t`Move to trash`}
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                <DeleteNoteModal isOpen={isOpenDeleteModal} onOpenChange={onOpenDeleteModalChange} note={note}></DeleteNoteModal>
                <SelectCategoryModal workspaceID={id} isOpen={isOpenMoveToModal} onOpenChange={onOpenMoveToModalChange} note={note} />
            </div>
        </div>
    );
}

export default CategoryListItem;