import PDFIcon from "@/components/icons/pdf";
import { CommentAttachmentProps } from "./type";
import { PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { ArrowDownTrayIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Tag } from '@douyinfe/semi-ui';
import { CommentAttachment } from "../main/type";
import { Card, Image } from "@heroui/react";
import { formatFileSize } from "@/utils/calculate";

const handleDownload = async (file: CommentAttachment) => {
    const response = await fetch(file.url); // 若私有空间请带 headers
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name; // 可动态替换为你想保存的名称
    a.click();
    window.URL.revokeObjectURL(url);
};



function identifyAttachmentType(type: string): string {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type === 'application/pdf') return 'pdf';
    return 'file';
}

function ImageAttachment(props: CommentAttachmentProps) {

    return (
        <>
            <PhotoView src={props.attachment.url} >
                {props.attachment.status ? (

                    <div className="flex flex-1 items-center gap-2 min-w-0">
                        <Image src={props.attachment.url} alt={props.attachment.url} width={48} height={48} />
                        <div>
                            <div className="truncate text-xs mb-1.5">{props.attachment.name}</div>
                            <div className="flex gap-1">
                                {
                                    props.attachment.size && (
                                        <Tag shape='circle' color="grey" type='solid' size="small" className="text-xs">
                                            {formatFileSize(props.attachment.size)}
                                        </Tag>
                                    )
                                }
                                <Tag shape='circle' color="light-green" type='solid' size="small">
                                    {props.attachment.type}
                                </Tag>
                            </div>
                        </div>
                    </div>
                ) : (
                    <img src={props.attachment.url} alt={props.attachment.url} className="max-w-full max-h-60 rounded cursor-pointer" />
                )
                }
            </PhotoView>
        </>
    );
}

function VideoAttachment({ url }: { url: string }) {
    return <video src={url} controls className="max-w-full max-h-60 rounded" />;
}

function AudioAttachment({ url }: { url: string }) {
    return <audio src={url} controls className="w-full" />;
}

function PdfAttachment(props: CommentAttachmentProps) {
    return (
        <div className="flex flex-1 items-center gap-2 min-w-0">
            <PDFIcon className="shrink-0 h-[36px] w-[36px] fill-gray-500 dark:fill-white" />
            <div>
                <div className="truncate text-xs mb-[2px]">{props.attachment.name}</div>
                {
                    props.attachment.size && (
                        <Tag shape='circle' color="grey" type='solid' size="small" className="text-xs">
                            {formatFileSize(props.attachment.size)}
                        </Tag>
                    )
                }
            </div>
        </div>
    );
}


function FileAttachment(props: CommentAttachmentProps) {
    return (
        <div className="flex flex-1 items-center gap-2 min-w-0">
            <PDFIcon className={"fill-gray-500 dark:fill-white"}></PDFIcon>                    {props.attachment.name}
            <div>
                <div className="truncate text-xs mb-[2px]">{props.attachment.name}</div>
                {
                    props.attachment.size && (
                        <Tag shape='circle' color="grey" type='solid' size="small" className="text-xs">
                            {formatFileSize(props.attachment.size)}
                        </Tag>
                    )
                }
            </div>
        </div>
    );
}

function CommentAttachmentFile(props: CommentAttachmentProps) {
    const fileType = identifyAttachmentType(props.attachment.type);
    const p = Math.max(0, Math.min(100, Number(props.attachment.progress ?? 0))); // 0~100
    const isUploading = props.attachment.status === 'uploading';
    const hasStatus = Boolean(props.attachment.status);
    const isImageOrVideo = fileType === 'image' || fileType === 'video';

    // 需要使用 Card 的条件
    const useCard = !isImageOrVideo || hasStatus;

    const ProgressShadow = () => (
        <>
            {/* Light mode */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 rounded-[inherit] transition-[width] duration-300 ease-out dark:hidden"
                style={{
                    width: `${p}%`,
                    background: 'linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0.03))',
                }}
            />
            {/* Dark mode */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 hidden rounded-[inherit] transition-[width] duration-300 ease-out dark:block"
                style={{
                    width: `${p}%`,
                    background: 'linear-gradient(to right, rgba(255,255,255,0.10), rgba(255,255,255,0.06))',
                }}
            />
        </>
    );

    const renderAttachment = () => {
        switch (fileType) {
            case 'image':
                return <ImageAttachment attachment={props.attachment} />;
            case 'video':
                return <VideoAttachment url={props.attachment.url} />;
            case 'audio':
                return <AudioAttachment url={props.attachment.url} />;
            case 'pdf':
                return <PdfAttachment attachment={props.attachment} />;
            default:
                return <FileAttachment attachment={props.attachment} />;
        }
    };

    const Content = (
        <div className="flex items-center gap-2 group px-3 justify-between">
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative flex w-full items-center justify-between gap-1 rounded-md p-2 text-gray-600 dark:text-gray-100 overflow-hidden"
            >
                {isUploading && <ProgressShadow />}
                {renderAttachment()}
            </div>

            <div className="flex items-center gap-4 mr-1">
                {isUploading ? (
                    <span className="text-xs text-gray-500 dark:text-gray-300 tabular-nums">{p}%</span>
                ) : hasStatus ? (
                    <>
                        {props.attachment.status === 'uploaded' ? (
                            <ArrowDownTrayIcon
                                onClick={() => handleDownload(props.attachment)}
                                className="w-4 h-4 cursor-pointer hover:text-gray-500"
                            />
                        ) : props.attachment.status === 'error' ? (
                            <span className="text-xs text-red-600 dark:text-red-400">上传失败</span>
                        ) : null}
                        <XCircleIcon onClick={() => props.onDelete?.(props.attachment.id || "")} className="w-4 h-4 cursor-pointer hover:text-gray-500" />
                    </>
                ) : (
                    fileType !== 'image' && (
                        <ArrowDownTrayIcon
                            className="w-4 h-4 cursor-pointer text-gray-500 dark:text-white shrink-0"
                            onClick={() => handleDownload(props.attachment)}
                            aria-label="Download"
                        />
                    )
                )}
            </div>
        </div>
    );

    return useCard ? <Card className="!shadow-small">{Content}</Card> : Content;
}



export default CommentAttachmentFile;
