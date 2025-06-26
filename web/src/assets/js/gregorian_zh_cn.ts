// gregorian_zh_cn.js   （放到自己项目 src/locales 目录）
import gregorian_en from "react-date-object/locales/gregorian_en";

const gregorian_zh_cn = {
    ...gregorian_en,           // 先继承，改下面几项
    name: "gregorian_zh_cn",
    months: [
        ["一月", "1月"], ["二月", "2月"], ["三月", "3月"], ["四月", "4月"],
        ["五月", "5月"], ["六月", "6月"], ["七月", "7月"], ["八月", "8月"],
        ["九月", "9月"], ["十月", "10月"], ["十一月", "11月"], ["十二月", "12月"]
    ],
    weekDays: [
        ["星期日", "日"], ["星期一", "一"], ["星期二", "二"], ["星期三", "三"],
        ["星期四", "四"], ["星期五", "五"], ["星期六", "六"]
    ],
    digits: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],  // 也可以换成中文数字
    rtl: false
};

export default gregorian_zh_cn;