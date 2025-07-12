import { Card, Image, Tooltip } from "@heroui/react";
import { TemplateCardProps } from "./type";
import BlockNoteEditor from "@/components/third-party/BlockNoteEditor";
import "./style.css"
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { v4 as uuid } from "uuid";
import { useDraggable } from '@dnd-kit/react';

function TemplateCard(props: TemplateCardProps) {

    const { ref } = useDraggable({
        id: uuid(),
        disabled: !props.draggable,
        data: {
            content: props.note?.content || "",
            cover: props.note?.cover,
        }
    });

    function handleClick() {
        if (props.onClick) {
            props.onClick(props.note);
        }
    }

    return (
        <>
            <div ref={ref}>
                <Card className="h-[200px] cursor-pointer  overflow-hidden" >
                    <div onClick={handleClick} className="flex flex-col h-full w-full relative">
                        {
                            props.empty || !props.note ? (
                                <>
                                    {
                                        props.emptyRender ? (
                                            props.emptyRender()
                                        ) : (
                                            <>
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <div className="text-gray-500 text-sm">No Template</div>
                                                </div>
                                            </>
                                        )
                                    }
                                </>
                            ) : (
                                <>
                                    {
                                        props?.note?.cover && (
                                            <Image
                                                radius="none"
                                                src={props.note.cover}
                                                alt={props.note.title}
                                                removeWrapper
                                                className="h-[30%] w-full object-cover"
                                            />
                                        )
                                    }
                                    <BlockNoteEditor noteID={props.note.id} className="temlate-note-card-editor  light:bg-white " content={props.note.content} options={{ editable: false }} />
                                    <div className="flex w-full justify-between mt-2 pl-2 pb-2 ">
                                        <Tooltip content={props.note.title} className="w-full" closeDelay={150}>
                                            <div className="truncate hover:scale-95 transition-all ">
                                                <span className="text-sm font-semibold">{props.note.title}</span>
                                            </div>
                                        </Tooltip>
                                        <EllipsisVerticalIcon className="cursor-pointer w-5 text-gray-400" />
                                    </div>
                                </>
                            )
                        }
                    </div>
                </Card>
            </div>
        </>
    )
}

export default TemplateCard;