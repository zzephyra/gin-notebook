import { updateInfoRequest } from "@/features/api/user";
import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { FormEvent, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import zxcvbn from "zxcvbn";

const ModifyPasswordModal = ({ userID, isOpen, onChange }: { userID: string, isOpen: boolean, onChange: (open: boolean) => void }) => {
    var { t } = useLingui()
    var [password, setPassword] = useState('')
    var [strength, setStrength] = useState(0);
    const zxcvbnResultRef = useRef<zxcvbn.ZXCVBNResult | null>(null)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.currentTarget));
        let isUpdated = await updateInfoRequest(userID, data)
        if (isUpdated) {
            toast.success(t`Update password successfully`)
            onChange(false)
        }
    }

    const handlePasswordChange = useCallback((val: string) => {
        setPassword(val)
        const result = zxcvbn(val)
        zxcvbnResultRef.current = result
        setStrength(result.score)
    }, [])

    const validatePassword = useCallback((val: string) => {
        const result = zxcvbnResultRef.current || zxcvbn(val)
        return result.score <= 3 ? result.feedback.suggestions.join(', ') : ''
    }, [])


    return (
        <Modal isOpen={isOpen} onOpenChange={onChange} onSubmit={handleSubmit}>
            <ModalContent>
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        {t`Change Password`}
                    </div>
                </ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit}>
                        <Input label={t`New Password`} size="sm" labelPlacement="outside" placeholder={t`Enter your new password`} className="mb-4"
                            validate={validatePassword}
                            name="password"
                            type="password"
                            onValueChange={handlePasswordChange}>
                        </Input>
                        <Input label={t`Confirm Password`} type="password" size="sm" labelPlacement="outside" placeholder={t`Confirm your new password`} className="mb-4"
                            validate={(value) => {
                                return password !== value ? t`Passwords do not match` : ''
                            }}
                        >
                        </Input>
                        <div className="flex justify-end w-full gap-2">
                            <Button size="sm" onPress={() => onChange(false)} >{t`Cancel`}</Button>
                            <Button size="sm" color="primary" type="submit">{t`Save`}</Button>
                        </div>
                    </Form>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}
export default ModifyPasswordModal