import { RenderActionProps } from "@douyinfe/semi-ui/lib/es/chat/interface";
import { EllipsisHorizontalIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, useDisclosure, Button, ButtonProps, ModalContent, ModalHeader, Modal, ModalBody } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
const AIChatToolset = ({ props }: { props: RenderActionProps }) => {
    const { message, defaultActions, className } = props;
    const { t } = useLingui();
    const commonAttributes: ButtonProps = {
        size: "sm",
        isIconOnly: true,
        variant: "light",
        className: "w-4 h-4 min-w-0 hover:!bg-transparent",
    }
    const { isOpen: isOpenSaveToNoteModal, onOpen: _, onClose: onCloseSaveToNoteModal } = useDisclosure();

    return (
        <>
            <Modal isOpen={isOpenSaveToNoteModal} onOpenChange={onCloseSaveToNoteModal} className="!max-w-2xl">
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-bold">{t`Save to Note`}</h2>
                    </ModalHeader>
                    <ModalBody>

                    </ModalBody>
                </ModalContent>
            </Modal>
            <div className={className}>
                {defaultActions}
                {message?.role === 'assistant' && (
                    <Dropdown classNames={{ content: "min-w-0" }} aria-label="extra actions">
                        <DropdownTrigger>
                            <Button
                                {...commonAttributes}
                            >
                                <EllipsisHorizontalIcon className="w-4 h-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="extra actions">
                            <DropdownItem key="save" startContent={<PencilIcon className="w-4"></PencilIcon>} >
                                {t`Save to Note`}
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                )}
            </div>
        </>
    )
}

export default AIChatToolset;