import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Form, Input, Modal, ModalBody, ModalContent, ModalHeader, Popover, PopoverContent, PopoverTrigger, Textarea, useDisclosure } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

function PromptItem({ prompt, onSave, onDelete }: { prompt: Prompt, onSave?: (id: string, data: Partial<Prompt>) => void, onDelete?: (prompt: Prompt) => void }) {
    const { i18n, t } = useLingui();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isOpenPopover, setIsOpenPopover] = useState(false);
    const formRef = useRef(null);
    const handleDelete = () => {
        onDelete && onDelete(prompt);
    }

    const handleSave = (e: any) => {
        e.preventDefault();
        let data: Partial<Prompt> = Object.fromEntries(new FormData(e.currentTarget));
        if (data.template) {
            var template = data.template.trim();
            if (template === '') {
                toast.error(t`Prompt template cannot be empty`);
                return
            }
            if (template == prompt.template) {
                delete data.template;
            } else {
                data.template = template;
            }
        }


        if (data.description !== undefined) {
            data.description = data.description.trim();
            if (data.description === '') {
                toast.error(t`Prompt description cannot be empty`);
                return;
            }

            if (data.description == prompt.description) {
                delete data.description;
            }
        }
        if (Object.keys(data).length === 0) {
            toast.success(t`No changes made`);
            return;
        }
        if (onSave) {
            onSave(prompt.id, data);
        }
    }

    return <>
        <div className="flex flex-1 justify-between items-center">
            <div className="flex flex-1 items-center">
                <span className="text-sm">
                    {i18n._(prompt.intent)}
                </span>
                {
                    prompt.description && <span className="text-gray-500 ml-2"> - {prompt.description}</span>
                }
            </div>
            <div>
                <Button isIconOnly radius="full" size="sm" variant="light" onPress={onOpen}>
                    <PencilIcon className="w-4 text-gray-400" />
                </Button>
                <Popover placement="left" isOpen={isOpenPopover} onOpenChange={setIsOpenPopover}>
                    <PopoverTrigger>
                        <Button isIconOnly radius="full" size="sm" variant="light">
                            <TrashIcon className="w-4 text-red-400" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-[200px]">
                        <div className="text-sm font-semibold text-red-600 mb-1">
                            {t`Delete Prompt`}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                            {t`Are you sure you want to delete this prompt? This action cannot be undone.`}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="light" color="default" onPress={() => setIsOpenPopover(false)}>
                                {t`Cancel`}
                            </Button>
                            <Button size="sm" color="danger" onPress={handleDelete}>
                                {t`Delete`}
                            </Button>
                        </div>
                    </PopoverContent>

                </Popover>


            </div>
        </div>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader>
                    {t`Edit Prompt`}
                </ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSave} ref={formRef}>
                        <Input defaultValue={prompt.description} labelPlacement="outside" placeholder={t`Enter a short description of what this prompt does (e.g., create a new todo item).`} label={t`Prompt Description`} name="description" />
                        <Textarea
                            labelPlacement="outside"
                            placeholder={t`Write your prompt template here. You can use variables like {title}, {content}, etc.`}
                            label={t`Prompt Template`} name="template" defaultValue={prompt.template} />

                        <div className="w-full flex justify-end">
                            <Button variant="light" size="sm" onPress={onOpenChange}>
                                {t`Cancel`}
                            </Button>
                            <Button type="submit" color="primary" size="sm" className="ml-2" >
                                {t`Save`}
                            </Button>
                        </div>
                    </Form>
                </ModalBody>
            </ModalContent>
        </Modal>
    </>

}

export default PromptItem;