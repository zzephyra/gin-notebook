import MarkdownIt from 'markdown-it';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import _ from 'lodash';

export function getUpdatedFieldsDeep<T extends Record<string, any>>(original: T, updated: T): Partial<T> {
    const diff: Partial<T> = {};
    for (const key in updated) {
        if (!_.isEqual(updated[key], original[key])) {
            diff[key] = updated[key];
        }
    }
    return diff;
}
export const getScriptFromLang = (lang: string) => {
    return lang.replace(/-/g, '_').toLowerCase() || "en";
};

export const getSystemLang = () => {
    const lang = navigator.language;
    const script = getScriptFromLang(lang);
    return script || "en";
}

export function formDataToJSON(formData: FormData): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

export function checkFileType(file: File, assertType: string) {
    var type = file.type.split('/')[0]
    return type == assertType
}

export function generateInviteUrl(uuid: string) {
    return `${window.location.origin}/invite/${uuid}`
}

export async function exportToPDf(title: string, content: string) {
    const md = new MarkdownIt();
    const html = md.render(content);
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.padding = '20px';
    container.style.background = 'white';
    container.style.color = 'black';
    document.body.appendChild(container);

    // 转成 Canvas
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // 清除临时 DOM
    document.body.removeChild(container);

    // 生成 PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save(`${title}.pdf`);
}

export const exportToWord = async (title: string, content: string) => {
    const md = new MarkdownIt();
    const renderedHTML = md.render(content);

    // 简单提取纯文本段落（更复杂内容需扩展 HTML 解析）
    const textContent = renderedHTML
        .replace(/<[^>]+>/g, '') // 去除所有 HTML 标签
        .split('\n')
        .filter(line => line.trim() !== '');

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: textContent.map(line =>
                    new Paragraph({
                        children: [new TextRun(line)],
                    }),
                ),
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title}.docx`);
};

export function generateDtstartFromDate(date: Date): string {
    const iso = date.toISOString(); // e.g., "2025-06-25T06:30:00.000Z"
    const ymd = iso.slice(0, 10).replace(/-/g, ''); // "20250625"
    const hms = iso.slice(11, 19).replace(/:/g, ''); // "063000"
    return `DTSTART:${ymd}T${hms}Z`;
}

export function createRecurringEventFromStartEnd(
    start: Date,
    end: Date,
) {
    const durationMs = end.getTime() - start.getTime(); // 毫秒差
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = {
        hours: hours,
        minutes: minutes,
    }
    return duration;
}

export function updateNewRrule(start: Date, rrule: string) {
    const dtstart = generateDtstartFromDate(start);
    const rruleLine = rrule.split('\n').find(line => line.startsWith("RRULE:"));
    return rruleLine ? `${dtstart}\n${rruleLine}` : dtstart;
}

export function RruleTypes(index: string | undefined, date: Date) {
    if (!index || !date) return ``;

    const dtstart = generateDtstartFromDate(date);
    const weekdayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    const byDay = weekdayMap[date.getDay()];  // 'WE'
    const day = date.getDate();     // 25


    switch (index) {
        case "1":
            return `${dtstart}\nRRULE:FREQ=DAILY;INTERVAL=1`;
        case "2":
            return `${dtstart}\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`;
        case "3":
            return `${dtstart}\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=${byDay}`;
        case "4":
            return `${dtstart}\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${byDay}`
        case "5":
            return `${dtstart}\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=${day}`
        case "6":
            return `${dtstart}\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYDAY=${byDay};BYSETPOS=-1`
        default:
            return ``;
    }
}

export function capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}