// Dropdown component for adding new notes and folders。
// Currently mainly used in note pages
import { CreateCategory, CreateNote } from "@/features/api/note";
import { responseCode } from "@/features/constant/response";
import { RootState, store } from "@/store";
import { DocumentTextIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import { Button, Dropdown, DropdownItem, useDisclosure, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Form, Select, SelectItem, Checkbox } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion"
import { Play } from "lucide-react";
import { setSelectedNoteId } from "@/store/features/workspace";
import { PlusIcon } from "@heroicons/react/24/solid";


const NoteDropdown = () => {
    const { t } = useLingui();
    const [loadingCategory, setLoadingCategory] = useState(false)
    const [_, setLoadingNote] = useState(false)
    const { isOpen: isOpenNewCategoryModel, onOpen: onOpenNewCategoryModel, onOpenChange: onOpenChangeNewCategoryModel } = useDisclosure();
    const { isOpen: isOpenNewNoteModel, onOpen: onOpenNewNoteModel, onOpenChange: onOpenChangeNewNoteModel } = useDisclosure();
    const categoryList = useSelector((state: RootState) => state.workspace.categoryList);
    const [showAdvanced, setShowAdvanced] = useState(false)

    var params = useParams();
    async function handleSubmitNewCategory(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoadingCategory(true)
        try {
            const formData = new FormData(e.currentTarget);

            const categoryName = formData.get("category_name") as string;
            if (!categoryName) {
                toast.error(t`Category name is required`)
                return
            }
            let res = await CreateCategory({ category_name: categoryName, workspace_id: params.id })
            if (res.code == responseCode.SUCCESS) {
                onOpenChangeNewCategoryModel()
            }
        } finally {
            setLoadingCategory(false)
        }
    }

    async function handleSubmitNewNote(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (params.id == undefined) return
        setLoadingNote(true)
        try {
            const formData = new FormData(e.currentTarget);
            const data = {
                title: formData.get("title") as string,
                category_id: formData.get("category_id") as string,
                content: formData.get("content") as string,
                tag_id: formData.get("tag_id") as string,
                allow_edit: formData.get("allow_edit") != null,
                allow_comment: formData.get("allow_comment") != null,
                allow_share: formData.get("allow_share") != null,
                allow_join: formData.get("allow_join") != null,
                allow_invite: formData.get("allow_invite") != null,
                status: formData.get("status") as "draft" | "published" | "archived",
            }
            let res = await CreateNote({ ...data, workspace_id: params.id })
            if (res.code == responseCode.SUCCESS) {
                onOpenChangeNewNoteModel()
                toast.success(t`Create note success`)
                store.dispatch(setSelectedNoteId(res.data.id))
            }
        } finally {
            setLoadingNote(false)
        }
    }


    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button color="primary" size="sm" isIconOnly aria-label="add note">
                        <PlusIcon className="w-6" />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Dropdown Variants" color="default" variant="faded">
                    <DropdownItem key="file" startContent={<DocumentTextIcon className="size-4" />} onPress={onOpenNewNoteModel}>{t`New file`}</DropdownItem>
                    <DropdownItem key="folder" startContent={<FolderPlusIcon className="size-4" />} onPress={onOpenNewCategoryModel} >{t`New folder`}</DropdownItem>
                </DropdownMenu>
            </Dropdown>
            {/* Add new category modal */}
            <Modal isOpen={isOpenNewCategoryModel} onOpenChange={onOpenChangeNewCategoryModel}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <Form onSubmit={handleSubmitNewCategory}>
                                <ModalHeader className="flex flex-col gap-1">{t`Add New Category`}</ModalHeader>
                                <ModalBody className="w-full">
                                    <Input errorMessage={t`Category name is required`} size="sm" isRequired label={t`Category Name`} name="category_name" />
                                </ModalBody>
                                <ModalFooter className="w-full">
                                    <Button size="sm" onPress={onClose}>
                                        {t`Cancel`}
                                    </Button>
                                    <Button size="sm" color="primary" type="submit" isLoading={loadingCategory}>
                                        {t`Create`}
                                    </Button>
                                </ModalFooter>
                            </Form>
                        </>
                    )}
                </ModalContent>
            </Modal>
            {/* Add new category modal end */}
            {/* Add new note modal */}
            <Modal isOpen={isOpenNewNoteModel} onOpenChange={onOpenChangeNewNoteModel} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <Form onSubmit={handleSubmitNewNote}>
                                <ModalHeader className="flex flex-col gap-1">{t`Add New Note`}</ModalHeader>
                                <ModalBody className="w-full gap-6">
                                    <Input labelPlacement="outside" errorMessage={t`Note title is required`} size="sm" isRequired label={t`Note Name`} name="title" placeholder={t`The note title is required and must not exceed 100 characters in length.`} />
                                    <div className="flex gap-4">
                                        <Select labelPlacement="outside" name="category_id" label={t`Select Category`} size="sm" isRequired className="mt-4" defaultSelectedKeys={categoryList[0]?.id.toString()} >
                                            {categoryList.map((category) => (
                                                <SelectItem key={category.id} >
                                                    {category.category_name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Select labelPlacement="outside" name="tag_id" label={t`Select Category`} size="sm" className="mt-4" >
                                            {categoryList.map((category) => (
                                                <SelectItem key={category.id} >
                                                    {category.category_name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    <fieldset className="border p-4 rounded space-y-3">
                                        <legend className="text-sm font-medium">{t`Permission Setting`}</legend>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox name="allow_edit" defaultSelected>
                                                    {t`Allow editing`}
                                                </Checkbox>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox name="allow_comment" defaultSelected>
                                                    {t`Allow commenting`}
                                                </Checkbox>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox name="allow_share" defaultSelected >
                                                    {t`Allow sharing`}
                                                </Checkbox>
                                            </div>
                                        </div>
                                    </fieldset>
                                    <fieldset className="space-y-3">
                                        <legend
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="cursor-pointer font-semibold flex items-center gap-1"
                                        >
                                            <Play fill="#fff" className={`transition-transform duration-100 ease-in-out size-4 ${showAdvanced ? "rotate-90" : "rotate-0"}`} /> Advanced Collaboration Settings
                                        </legend>

                                        <AnimatePresence initial={false}>
                                            <motion.div
                                                key="advanced-settings"
                                                initial={{ height: showAdvanced ? "auto" : 0, opacity: 0 }}
                                                animate={{ height: showAdvanced ? "auto" : 0, opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox name="allow_join" defaultSelected >
                                                            {t`Allow joining`}
                                                        </Checkbox>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox name="allow_invite" defaultSelected >
                                                            {t`Allow inviting`}
                                                        </Checkbox>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                    </fieldset>
                                    <div>
                                        <Select labelPlacement="outside" name="status" label={t`Status`} placeholder={t`Select note status`} size="sm" className="mt-4" defaultSelectedKeys={['public']}>
                                            <SelectItem key="private">Private</SelectItem>
                                            <SelectItem key="public">Public</SelectItem>
                                            <SelectItem key="archived">Archived</SelectItem>
                                        </Select>
                                    </div>
                                </ModalBody>
                                <ModalFooter className="w-full">
                                    <Button size="sm" onPress={onClose}>
                                        {t`Cancel`}
                                    </Button>
                                    <Button size="sm" color="primary" type="submit" isLoading={loadingCategory}>
                                        {t`Create`}
                                    </Button>
                                </ModalFooter>
                            </Form>
                        </>
                    )}
                </ModalContent>
            </Modal>
            {/* Add new note modal end */}
        </>
    )
}

export default NoteDropdown