import { Note } from "@/pages/workspace/type";
import { ArrowLongUpIcon, ArrowLongDownIcon, ArrowTopRightOnSquareIcon, ArrowUturnLeftIcon, ChevronDownIcon, ChevronUpIcon, EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { t } from "@lingui/core/macro";
import PlateEditor from "@/components/third-party/PlateEditor";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import PDFIcon from "@/components/icons/pdf";
import { exportToPDf, exportToWord } from "@/utils/tools";
import WordIcon from "@/components/icons/word";
import { DeleteNote } from "@/features/api/note";
import { responseCode } from "@/features/constant/response";
import toast from "react-hot-toast";
const NoteListViewEditor = ({ note, currentIndex, maxIndex, onClose, onChangeIndex, onDelete }: { note: Note | null, currentIndex: number, maxIndex: number, onClose: () => void, onChangeIndex: (index: number) => void, onDelete?: (noteID: string) => void }) => {
    if (note == null) {
        onClose();
        return
    }

    const handleExportAsPDF = () => {
        exportToPDf(note.title || "note", note.content || "")
    }

    const handleExportAsWord = () => {
        exportToWord(note.title || "note", note.content || "")
    }

    const handleDeleteNote = async () => {
        var res = await DeleteNote(note.workspace_id, note.id)
        if (res.code == responseCode.SUCCESS) {
            if (onDelete) {
                onDelete(note.id);
            }
            onClose();
        } else {
            toast.error(t`Delete note failed: ${res.error || "Unknown error"}`);
        }
    }

    return (
        <>
            <div className="w-full h-full flex flex-col flex-1">
                <div className="px-2 min-h-12 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button isIconOnly variant="light" onPress={onClose} size="sm" radius="full">
                            <ArrowUturnLeftIcon className="w-4" />
                        </Button>
                        <div>
                            {note.title || "无标题"}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="md:flex gap-2 hidden">
                            <Button isIconOnly variant="flat" size="sm" isDisabled={currentIndex <= 0} onPress={() => onChangeIndex(currentIndex - 1)}>
                                <ChevronUpIcon className="w-4" />
                            </Button>
                            <Button isIconOnly variant="flat" size="sm" isDisabled={currentIndex >= maxIndex - 1} onPress={() => onChangeIndex(currentIndex + 1)}>
                                <ChevronDownIcon className="w-4" />
                            </Button>
                        </div>
                        <Button variant="light" size="sm" className="hidden md:flex gap-1">
                            <ArrowTopRightOnSquareIcon className="w-4" />
                            {t`Share`}
                        </Button>
                        <Dropdown >
                            <DropdownTrigger>
                                <Button isIconOnly variant="light" size="sm" className="gap-1">
                                    <EllipsisHorizontalIcon className="w-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="more actions" itemClasses={{ title: "text-xs" }}>
                                <DropdownItem isDisabled={currentIndex <= 0} onPress={() => onChangeIndex(currentIndex - 1)} startContent={<ArrowLongUpIcon className="w-4" />} key="previous_note">{t`Previous Note`}</DropdownItem>
                                <DropdownItem isDisabled={currentIndex >= maxIndex - 1} onPress={() => onChangeIndex(currentIndex + 1)} showDivider startContent={<ArrowLongDownIcon className="w-4" />} key="next_note">{t`Next Note`}</DropdownItem>

                                <DropdownItem onPress={handleExportAsPDF} startContent={<PDFIcon className="w-4" />} key="save_pdf">{t`Export As PDF`}</DropdownItem>
                                <DropdownItem onPress={handleExportAsWord} key="save_word" startContent={<WordIcon className="w-4" />} showDivider>{t`Export As Word`}</DropdownItem>
                                <DropdownItem onPress={handleDeleteNote} className="text-danger" key="delete" startContent={<TrashIcon className="w-4" />} color="danger">{t`Delete`}</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>

                    </div>
                </div>
                <div>
                    <PlateEditor readOnly={true} value={note.content || ""} />
                </div>
            </div>
        </>
    )
}

export default NoteListViewEditor;