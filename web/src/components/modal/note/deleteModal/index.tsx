import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DeleteNote } from '@/features/api/note';
import { responseCode } from '@/features/constant/response';
import { Note } from '@/pages/workspace/type';
import toast from 'react-hot-toast';

function DeleteNoteModal({ isOpen, onOpenChange, note }: { isOpen: boolean, onOpenChange: (open: boolean) => void, note: Note }) {
    const { t } = useLingui();
    const [deleteLoading, setDeleteLoading] = useState(false);
    const handleDeleteNote = async () => {
        setDeleteLoading(true);
        let res = await DeleteNote(note.workspace_id, note.id);
        if (res.code == responseCode.SUCCESS) {
            toast.success(t`Delete successfully`);
            onOpenChange(false);
        } else {
            toast.error(res.error);
        }
        setDeleteLoading(false);
    }
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        {t`Delete`}
                        <span className="bg-gray-200 px-2 rounded-lg">{note.title}</span>
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon color="#FBBF24" className="w-10" />
                        <span>
                            {t`Are you sure you want to delete this note? This action cannot be undone.`}
                        </span>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={() => onOpenChange(false)}>{t`Cancel`}</Button>
                    <Button color="danger" isLoading={deleteLoading} onPress={handleDeleteNote}>{t`Delete`}</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default DeleteNoteModal;