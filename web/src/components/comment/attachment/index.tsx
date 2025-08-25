import PDFIcon from "@/components/icons/pdf";
import { CommentAttachmentProps } from "./type";
import { PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { ArrowDownTrayIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Tag } from "@douyinfe/semi-ui";
import { CommentAttachment } from "../main/type";
import { Card, Image, Skeleton } from "@heroui/react";
import { formatFileSize } from "@/utils/calculate";

const handleDownload = async (file: CommentAttachment) => {
    const response = await fetch(file.url); // 若私有空间请带 headers
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    window.URL.revokeObjectURL(url);
};

function identifyAttachmentType(type: string): "image" | "video" | "audio" | "pdf" | "file" {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type === "application/pdf") return "pdf";
    return "file";
}

const FileInfo = ({
    name,
    size,
    type,
    icon,
}: {
    name: string;
    size?: number;
    type?: string;
    icon?: React.ReactNode;
}) => (
    <div className="flex flex-1 items-center gap-2 min-w-0">
        {icon}
        <div>
            <div className="truncate text-xs mb-1.5">{name}</div>
            <div className="flex gap-1">
                {size && (
                    <Tag shape="circle" color="grey" type="solid" size="small" className="text-xs">
                        {formatFileSize(size)}
                    </Tag>
                )}
                {type && (
                    <Tag shape="circle" color="light-green" type="solid" size="small">
                        {type}
                    </Tag>
                )}
            </div>
        </div>
    </div>
);

function ImageAttachment({ attachment }: CommentAttachmentProps) {
    const { url, from, status, name, size, type } = attachment;
    const showMeta = from !== "box" && status;

    return (
        <PhotoView src={url}>
            {showMeta ? (
                <FileInfo
                    name={name}
                    size={size}
                    type={type}
                    icon={<Image src={url} alt={url} width={48} height={48} />}
                />
            ) : (
                <img src={url} alt={url} className="max-w-full max-h-60 rounded cursor-pointer" />
            )}
        </PhotoView>
    );
}

const VideoAttachment = ({ url }: { url: string }) => (
    <video src={url} controls className="max-w-full max-h-60 rounded" />
);

const AudioAttachment = ({ url }: { url: string }) => (
    <audio src={url} controls className="w-full" />
);

const PdfAttachment = ({ attachment }: CommentAttachmentProps) => (
    <FileInfo
        name={attachment.name}
        size={attachment.size}
        icon={<PDFIcon className="shrink-0 h-[36px] w-[36px] fill-gray-500 dark:fill-white" />}
    />
);

const FileAttachment = ({ attachment }: CommentAttachmentProps) => (
    <FileInfo
        name={attachment.name}
        size={attachment.size}
        type={attachment.type}
        icon={<PDFIcon className="fill-gray-500 dark:fill-white" />}
    />
);

function CommentAttachmentFile(props: CommentAttachmentProps) {
    const { attachment } = props;
    const fileType = identifyAttachmentType(attachment.type);
    const p = Math.max(0, Math.min(100, Number(attachment.progress ?? 0)));
    const isUploading = attachment.status === "uploading";
    const hasStatus = Boolean(attachment.status);
    const uploadFromBox = !attachment.from || attachment.from === "box";
    const isImageOrVideo = fileType === "image" || fileType === "video";
    const useCard = !isImageOrVideo || hasStatus && !uploadFromBox;

    const ProgressShadow = () => (
        <>
            <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 rounded-[inherit] transition-[width] duration-300 ease-out dark:hidden"
                style={{
                    width: `${p}%`,
                    background: "linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0.03))",
                }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 hidden rounded-[inherit] transition-[width] duration-300 ease-out dark:block"
                style={{
                    width: `${p}%`,
                    background: "linear-gradient(to right, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
                }}
            />
        </>
    );

    const renderAttachment = () => {
        switch (fileType) {
            case "image":
                return <ImageAttachment attachment={attachment} />;
            case "video":
                return <VideoAttachment url={attachment.url} />;
            case "audio":
                return <AudioAttachment url={attachment.url} />;
            case "pdf":
                return <PdfAttachment attachment={attachment} />;
            default:
                return <FileAttachment attachment={attachment} />;
        }
    };

    const Content = (
        <div className="flex items-center gap-2 group px-3 justify-between">
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative flex w-full items-center gap-1 rounded-md p-2 text-gray-600 dark:text-gray-100 overflow-hidden"
            >
                {isUploading && !uploadFromBox && <ProgressShadow />}
                {isImageOrVideo ? (
                    <Skeleton className="rounded-lg" isLoaded={!isUploading}>
                        {renderAttachment()}
                    </Skeleton>
                ) : (
                    renderAttachment()
                )}
            </div>

            <div className="flex items-center gap-4 mr-1">
                {isUploading && !uploadFromBox ? (
                    <span className="text-xs text-gray-500 dark:text-gray-300 tabular-nums">{p}%</span>
                ) : hasStatus && !uploadFromBox ? (
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
                    fileType !== "image" && (
                        <ArrowDownTrayIcon
                            className="w-4 h-4 cursor-pointer text-gray-500 dark:text-white shrink-0"
                            onClick={() => handleDownload(attachment)}
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
