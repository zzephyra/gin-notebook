import AdvancedFilters from "@/components/advancedFilters";
import { useTodo } from "@/contexts/TodoContext";
import { BarsArrowDownIcon, EllipsisHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import { defaultOperators, RuleGroupType } from "react-querybuilder";

const fields = [
    { name: 'name', label: 'Name', value: 'name' },
    { name: 'status', label: 'Status', operators: defaultOperators.filter((op) => op.name === '='), },
    { name: 'createdAt', label: 'Created At', value: 'createdAt', type: 'date' },
]

function ProjectList() {
    var { projectList } = useTodo()
    var { t } = useLingui()
    const inputRef = useRef<HTMLInputElement>(null);

    const [val, setVal] = useState("");
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState<RuleGroupType>({ combinator: 'and', rules: [] });


    // 打开后自动聚焦
    useEffect(() => {
        if (open) {
            const id = requestAnimationFrame(() => inputRef.current?.focus());
            return () => cancelAnimationFrame(id);
        }
    }, [open]);

    // // Cmd/Ctrl + K 快捷键打开
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleBlur = () => {
        // 只有在空值时才收起
        console.log("blur", !val, val.length, val.strike() == "");
        if (!val || val.strike() == "") setOpen(false);
    };

    return <div className="px-2 relative">
        <div className="h-[32px] items-center flex gap-2 mb-2 justify-end">
            <div className="flex p-1 hover:bg-gray-100 items-center rounded-lg cursor-pointer" onClick={() => setOpen(true)}>
                <MagnifyingGlassIcon className="w-4 h-4  text-gray-400" />
                <input placeholder={t`Search project...`} ref={inputRef}
                    id="project-search-input"
                    className={`focus:outline-none placeholder:text-xs placeholder:leading-8 text-sm text-gray-500 overflow-hidden transition-all duration-200 origin-left ${open ? "w-[150px] ml-2" : "w-0"}`} onBlur={handleBlur} onInput={(e) => setVal((e.target as HTMLDivElement).innerText)} suppressContentEditableWarning={true} />
            </div>
            <div className="p-1">
                <Popover>
                    <PopoverTrigger>
                        <BarsArrowDownIcon className="w-4 h-4  text-gray-400" />
                    </PopoverTrigger>
                    <PopoverContent>
                        <AdvancedFilters fields={fields} query={query} onChange={setQuery} />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        {
            projectList.map(project => (
                <Card className="px-1 shadow-sm">
                    <CardBody>

                        <div className="flex gap-3 items-center">
                            <div className="scale-120">
                                {project.icon}
                            </div>
                            <div className="font-medium text-gray-600">
                                {project.name}
                            </div>
                            <div className="ml-auto float-right flex items-center cursor-pointer hover:bg-gray-100 rounded-lg p-1" >
                                <EllipsisHorizontalIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>

                        </div>
                    </CardBody>
                </Card>
            ))
        }
    </div>;
}

export default ProjectList; 