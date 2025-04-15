import ChaseLoading from "@/components/loading/Chase/loading";
import { GetNoteCategory, GetNoteList } from "@/features/api/note";
import {
  Button,
  Divider, Input, Listbox,
  ListboxItem
} from "@heroui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLingui } from "@lingui/react/macro";
import { Note, NoteCategory } from "./type"
import { Accordion, AccordionItem } from "@heroui/accordion";
import PlusIcon from "@/components/icons/plus";
import FolderIcon from "@/components/icons/folder";
import SearchIcon from "@/components/icons/search";
import NotePage from "@/components/note/main";


export default function WorkspaceMain() {
  const [collapsed, setCollapsed] = useState(false);
  var params = useParams();
  const { t } = useLingui();
  const [loading, setLoading] = useState(true);
  const [noteCategory, setNoteCategory] = useState<NoteCategory[]>([]);
  const [noteList, setNoteList] = useState<Note[]>([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set(["0"]));
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const handleSelectionChange = (keys: any) => {
    setSelectedKeys(keys);
  };

  useEffect(() => {
    Promise.all([GetNoteCategory(params.id), GetNoteList(params.id, 0, 50)]).then((res) => {
      setNoteList(res[1].data.notes);
      setNoteCategory(res[0].data);
      setLoading(false);
    })
  }, [])

  if (loading) {
    return <ChaseLoading text={t`Loading notes...`} />;
  }

  const grouped = noteCategory.map(category => ({
    ...category,
    notes: noteList.filter(n => n.category_id === category.id)
  }))
  console.log(grouped)

  return (
    <>
      <div className="flex h-full flex-1">
        <div
          className={`px-2 pt-4 relative `}
        >
          <div className={`transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-80"}`}>
            <div className="flex items-center justify-between mb-2 gap-4">
              <Input size="sm" startContent={<SearchIcon filled={true} className="fill-gray-400" />} placeholder="Search Notes">

              </Input>
              <Button size="sm" isIconOnly aria-label="add note">
                <PlusIcon />
              </Button>
            </div>
            <Divider className="my-4"></Divider>
            <Accordion selectedKeys={selectedKeys} variant="splitted" isCompact selectionMode="multiple" onSelectionChange={handleSelectionChange}>
              {grouped.map((category) => (
                <AccordionItem className=" flex-shrink-0 text-xl" key={category.id} aria-label={category.category_name || "No Category"} startContent={<FolderIcon />} title={category.category_name || "No Category"}>
                  <Listbox>
                    {category.notes.map((note) => (
                      <ListboxItem onPress={() => setCurrentNote(note)} key={note.id}>New file</ListboxItem>
                    ))}
                  </Listbox>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 
                     w-6 h-20 bg-white text-black shadow-md rounded-full 
                     flex items-center justify-center z-10"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        {!collapsed && <Divider orientation="vertical"></Divider>}
        <div className="flex-1 flex flex-col ">
          {currentNote != null ? <NotePage note={currentNote} /> : <div ></div>}
        </div>
      </div>
    </>
  );
}
