// Dropdown component for adding new notes and folders。
// Currently mainly used in note pages

import PlusIcon from "@/components/icons/plus";
import { DocumentTextIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import { Button, Dropdown, DropdownItem, useDisclosure, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { Form } from "react-router-dom";


const NoteDropdown = () => {
    const { t } = useLingui();
    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button size="sm" variant="flat" isIconOnly aria-label="add note">
                        <PlusIcon filled fill="#909090" />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Dropdown Variants" color="default" variant="faded">
                    <DropdownItem key="file" startContent={<DocumentTextIcon className="size-4" />}>{t`New file`}</DropdownItem>
                    <DropdownItem key="folder" startContent={<FolderPlusIcon className="size-4" />}>{t`New folder`}</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </>
    )
}

export default NoteDropdown