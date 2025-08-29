import 'axios';

declare module 'axios' {
    export interface AxiosRequestConfig {
        /**
         * 是否禁止全局 toast 提示
         */
        suppressToast?: boolean;
    }
}
