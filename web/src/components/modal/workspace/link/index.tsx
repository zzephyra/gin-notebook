import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Form, Select, Button, SelectItem } from "@heroui/react"
import { useLingui } from "@lingui/react/macro";
import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion"
import ChaseLoading from "@/components/loading/Chase/loading";
import { createWorkspaceInviteLinkRequest } from "@/features/api/workspace";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import toast from "react-hot-toast";

export interface CreateLinkResponse {
    id: string;
    uuid: string;
    expired_at: string;
    is_expired: boolean;
    count: number;
}

const AddWorkspaceLinkModal = ({ isOpen, onOpenChange, onSuccess }: { isOpen: boolean, onOpenChange: () => void, onSuccess?: (result: CreateLinkResponse) => void }) => {
    const { t } = useLingui();
    const workspaceState = useSelector((s: RootState) => s.workspace);
    const [url, setUrl] = useState<string>("");
    const [step, setStep] = useState(1);
    const [generating, setGenerating] = useState(false);
    const expiration = [
        { key: "", label: "Unlimited" },
        { key: "1", label: "1 day" },
        { key: "7", label: "7 days" },
        { key: "30", label: "1 month" },
        { key: "90", label: "3 months" },
        { key: "180", label: "a half year" },
    ];

    const handleCloseModal = () => {
        setStep(1);
        setGenerating(false);
    }

    const handleGenerateLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        setGenerating(true);
        if (workspaceState.currentWorkspace?.id == undefined) {
            return;
        }
        data["workspace_id"] = workspaceState.currentWorkspace?.id; // Replace with actual workspace ID
        let res = await createWorkspaceInviteLinkRequest(data)
        setGenerating(false);
        if (res != null) {
            setStep(2);
            setUrl(`${window.location.origin}/invite/${res.uuid}`);
            if (onSuccess) {
                onSuccess(res);
            }
        } else {
            toast.error(t`Failed to generate invite link`);
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url)
        toast.success(t`Invite link copied to clipboard`);
    }

    function downloadQrcode() {
        const canvas = document.getElementById('new-link-qrcode') as HTMLCanvasElement;
        if (!canvas) return
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'qrcode.png';
        downloadLink.click();
    }


    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={handleCloseModal} >
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-2">
                            {t`Add Invite Link`}
                        </div>
                    </ModalHeader>
                    <ModalBody className="mb-4">
                        {generating == true ?
                            <>
                                <ChaseLoading text={t`Generating invite link`} />
                            </> :
                            <>
                                <AnimatePresence>
                                    <motion.div>
                                        {step === 1 && (
                                            <>
                                                <Form onSubmit={handleGenerateLink}>
                                                    <Select defaultSelectedKeys={[""]} name="expired_at">
                                                        {expiration.map((exp) => (
                                                            <SelectItem key={exp.key}>
                                                                {exp.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Button size="sm" color="primary" type="submit" className="w-full mt-4">
                                                        {t`Generate Link`}
                                                    </Button>
                                                </Form>

                                            </>
                                        )}
                                        {step === 2 && (
                                            <div className="flex flex-col items-center gap-4 mb-4">
                                                <QRCodeCanvas id="new-link-qrcode" value={url}></QRCodeCanvas>
                                                <div className="flex gap-2">
                                                    <Button color="primary" size="sm" onPress={downloadQrcode}>{t`Download QR Code`}</Button>
                                                    <Button color="primary" size="sm" onPress={handleCopyLink}>{t`Copy Link`}</Button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </>}

                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}

export default AddWorkspaceLinkModal;