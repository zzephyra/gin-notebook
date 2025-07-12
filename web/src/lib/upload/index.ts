
import { i18n } from '@lingui/core';
import { UploadOptions } from './type';
import { uploadToQiniu } from '@/thirdpart/qiniu/upload';
import toast from 'react-hot-toast';
async function qiniuUpload(options: UploadOptions) {
    if (!options.domain) {
        return ""
    }

    let { url } = await uploadToQiniu(options.file, options.domain);
    return url;
}

export async function UploadFile(options: UploadOptions) {
    if (options.sizeLimit) {
        if (Number(options.file.size) > options.sizeLimit) {
            toast.error(i18n._("File size exceeds the limit of {size} bytes", { size: options.sizeLimit }));
            return '';
        }
    }

    if (options.accept) {
        const acceptedTypes = options.accept.split(',').map(type => type.trim());
        const fileType = options.file.type;
        if (!acceptedTypes.includes(fileType)) {
            toast.error(i18n._("File type {type} is not accepted", { type: fileType }));
            return '';
        }
    }

    let url = '';

    switch (options.method) {
        case 'qiniu':
            url = await qiniuUpload(options);
            break;
        default:
            throw new Error(`Unsupported upload method: ${options.method}`);
    }
    return url;
}