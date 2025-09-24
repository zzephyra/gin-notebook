import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { EmojiPickerProps } from './script';
import i18n from '@emoji-mart/data/i18n/en.json'
import { useLingui } from '@lingui/react/macro';

function EmojiPicker(props: EmojiPickerProps) {
    var { t } = useLingui()

    return (
        <>
            <Picker className={"test"} i18n={props.i18n || i18n} data={data} previewPosition={"none"} onEmojiSelect={props.onSelect} >
            </Picker>
            <div className="w-full py-2 flex justify-end" style={{ backgroundColor: "rgb(var(--em-rgb-background))" }}>
                <div className="cursor-pointer px-1.5 py-1 mt-1 mr-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => props?.onSelect?.({ id: "clean", native: "" })}>
                    {t`Clean`}
                </div>
            </div>
        </>
    )
}
export default EmojiPicker;