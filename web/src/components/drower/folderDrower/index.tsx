import NotesList from "@/components/list/notes";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from "@heroui/drawer";
import { useLingui } from "@lingui/react/macro";
const FolderDrawer = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: () => void }) => {
    const { t } = useLingui();
    return (
        <>
            <Drawer isOpen={isOpen} onOpenChange={onOpenChange} radius="none">
                <DrawerContent>
                    {() => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">{t`Notes Management`}</h2>
                                    {/* <NoteDropdown></NoteDropdown> */}
                                </div>
                            </DrawerHeader>
                            <DrawerBody>
                                <NotesList></NotesList>
                            </DrawerBody>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    )
}

export default FolderDrawer;