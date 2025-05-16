import { GetNoteCategory, GetRecommandCategories, UpdateNote } from "@/features/api/note";
import {
    Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Button, Autocomplete,
    AutocompleteSection,
    Listbox, ListboxItem, ListboxSection,
    AutocompleteItem
} from "@heroui/react";
import { store } from "@/store";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { CategoryType } from "@/types/note";
import toast from "react-hot-toast";
import { responseCode } from "@/features/constant/response";
import { UpdateNoteByID } from "@/store/features/workspace";
import { Note } from "@/pages/workspace/type";
const SelectCategoryModal = ({ isOpen, onOpenChange, workspaceID, note }: { isOpen: boolean, onOpenChange: (open: boolean) => void, workspaceID: any, note: Note }) => {
    const { t } = useLingui();
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>([]);
    const [recommandCategories, setRecommandCategories] = useState<{
        recent: CategoryType[];
        hot: CategoryType[];
    }>({
        recent: [],
        hot: [],
    });
    useEffect(() => {
        if (isOpen) {
            GetRecommandCategories(workspaceID).then((res) => {
                setRecommandCategories(res);
            })
            handleInputKeyword("");
        }
    }, [isOpen, workspaceID]);

    function handleSelectCategory(key: any) {
        setSelectedCategoryKeys([key.currentKey]);
    }

    async function handleInputKeyword(value: string) {
        const data = await GetNoteCategory(workspaceID, value)
        setCategories(data);
    }

    function handleSelectCategoryItem(key: any) {
        setSelectedCategoryKeys([key]);
    }

    async function ModifyNoteCategory() {
        if (selectedCategoryKeys.length == 0) {
            toast.error(t`Please select a category`);
            return;
        }
        // const selectedCategory = categories.find((category) => category.id == selectedCategoryKeys[0]);
        const data = await UpdateNote(workspaceID, note.id, { category_id: selectedCategoryKeys[0] })
        if (data.code == responseCode.SUCCESS) {
            toast.success(t`Move to category successfully`);
            store.dispatch(UpdateNoteByID({ ...note, category_id: selectedCategoryKeys[0] }));
            onOpenChange(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        {t`Move to Category`}
                    </div>
                </ModalHeader>
                <ModalBody>
                    <Autocomplete
                        label={t`Search Category`}
                        placeholder={t`Search Category`}
                        onInputChange={handleInputKeyword}
                        onSelectionChange={handleSelectCategoryItem}
                    >
                        {categories.map((category) => (
                            <>
                                <AutocompleteItem key={category.id}>
                                    {category.category_name}
                                </AutocompleteItem>
                            </>
                        ))}
                    </Autocomplete>
                    {recommandCategories?.recent?.length > 0 || recommandCategories?.hot?.length > 0 ? (
                        <Listbox aria-label="Listbox menu with sections" variant="flat"
                            selectedKeys={selectedCategoryKeys}
                            selectionMode="single"
                            disallowEmptySelection
                            onSelectionChange={handleSelectCategory}>
                            {recommandCategories.hot?.length > 0 ? (
                                <ListboxSection title={t`Frequent Used`}>
                                    {recommandCategories.hot.map((category) => (
                                        <ListboxItem key={category.id}>
                                            {category.category_name}
                                        </ListboxItem>
                                    ))}
                                </ListboxSection>
                            ) : null}
                            {recommandCategories.recent?.length > 0 ? (
                                <ListboxSection title={t`Recent Created`}>
                                    {recommandCategories.recent.map((category) => (
                                        <ListboxItem key={category.id}>
                                            {category.category_name}
                                        </ListboxItem>
                                    ))}
                                </ListboxSection>
                            ) : null}
                        </Listbox>
                    ) : null}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={() => onOpenChange(false)}>{t`Cancel`}</Button>
                    <Button color="primary" onPress={ModifyNoteCategory}>{t`Select`}</Button>
                </ModalFooter>
            </ModalContent>
        </Modal >
    );
}
export default SelectCategoryModal;