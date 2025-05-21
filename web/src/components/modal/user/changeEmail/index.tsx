import { updateInfoRequest } from "@/features/api/user";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { FormEvent } from "react";
import toast from "react-hot-toast";
const ChangeEmailModal = ({ userID, isOpen, onChange }: { userID: string, isOpen: boolean; onChange: (open: boolean) => void }) => {
    const { t } = useLingui();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.currentTarget));
        let isUpdated = await updateInfoRequest(userID, data)
        if (isUpdated) {
            toast.success(t`Update password successfully`)
            onChange(false)
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onChange}>
                <ModalContent>
                    <ModalHeader>
                        {t`Change Email`}
                    </ModalHeader>
                    <ModalBody>
                        <Form onSubmit={handleSubmit} >
                            <Input name="email" type="email" size="sm" labelPlacement="outside" placeholder={t`Enter your new email`} className="mb-4">
                            </Input>
                            <Button size="sm" color="primary" className="w-full mb-4" type="submit">
                                {t`Change Email`}
                            </Button>
                        </Form>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}

export default ChangeEmailModal;