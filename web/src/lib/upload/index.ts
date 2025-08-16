
import { i18n } from '@lingui/core';
import { UploadController, UploadEvent, UploadOptions } from './type';
import { startQiniuUpload } from '@/thirdpart/qiniu/upload';
import toast from 'react-hot-toast';
import { store } from '@/store';
function qiniuUpload(options: Required<Pick<UploadOptions, 'file' | 'domain'>> & Pick<UploadOptions,
    'forceDirect' | 'filename' | 'signal' | 'onProgress' | 'onError' | 'onComplete'
>): UploadController {
    const { file, domain, ...rest } = options;
    return startQiniuUpload(file, domain, rest);
}



function createFailedController(err: any): UploadController {
    const subscribers = new Set<(e: UploadEvent) => void>();
    const promise = Promise.reject(err);
    // 异步触发 error 事件，保证订阅者有机会先注册
    setTimeout(() => {
        subscribers.forEach(fn => fn({ type: 'error', error: err }));
    }, 0);
    return {
        on: (handler) => {
            subscribers.add(handler);
            return () => subscribers.delete(handler);
        },
        cancel: () => { },
        promise,
    };
}

export function UploadFile(options: UploadOptions): UploadController {
    const state = store.getState();

    // === 1) 大小校验 ===
    const limitMB = options.sizeLimitMB ?? (state.settings?.system?.maximun_size ?? 30);
    const limitBytes = limitMB * 1024 * 1024;
    if (Number(options.file.size) > limitBytes) {
        const err = new Error(
            i18n._('File size exceeds the limit of {size} MB', { size: limitMB })
        );
        toast.error(err.message);
        return createFailedController(err);
    }

    // === 2) 类型校验 ===
    if (options.accept) {
        const acceptedTypes = options.accept
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean);

        const fileType = options.file.type.toLowerCase();
        const isAccepted = acceptedTypes.some(accepted => {
            // 通配：image/*、audio/* …
            if (accepted.endsWith('/*')) {
                const prefix = accepted.slice(0, -1); // "image/"
                return fileType.startsWith(prefix);
            }
            // 精确匹配：image/png、application/pdf …
            return fileType === accepted;
        });

        if (!isAccepted) {
            const err = new Error(i18n._('File type {type} is not accepted', { type: fileType }));
            toast.error(err.message);
            return createFailedController(err);
        }
    }

    // === 3) 选择存储驱动 ===
    const driver = state.settings?.system?.storage_driver;
    switch (driver) {
        case 'qiniu': {
            const domain =
                options.domain ?? state.settings?.system?.qiniu_domain;
            if (!domain) {
                const err = new Error('Qiniu domain is not configured');
                toast.error(err.message);
                return createFailedController(err);
            }
            // 返回可订阅/可取消的上传控制器
            return qiniuUpload({
                file: options.file,
                domain,
                forceDirect: options.forceDirect,
                filename: options.filename,
                signal: options.signal,
                onProgress: options.onProgress,
                onError: options.onError,
                onComplete: options.onComplete,
            });
        }

        default: {
            const err = new Error(`Unsupported storage driver: ${driver}`);
            toast.error(err.message);
            return createFailedController(err);
        }
    }
}