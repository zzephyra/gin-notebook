import { useRef, forwardRef, useImperativeHandle, useState, useLayoutEffect, useEffect, useMemo } from "react";
import { calcInContainer, extractCommentPayload, handleKeyDown, splitByMentions } from "../script";
import type { CommentContentHandle, CommentContentProps } from "./types";
import type { WorkspaceMember } from "@/types/workspace";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useParams } from "react-router-dom";
import { Avatar, Card, CardBody, Listbox, ListboxItem, ListboxSection } from "@heroui/react";
import MemberCard from "@/components/card/member";
import { useLingui } from "@lingui/react/macro";
import { useTodo } from "@/contexts/TodoContext";
import { createPortal } from "react-dom";

const DROPDOWN_WIDTH = 180;
const DROPDOWN_MARGIN = 8;
const OFFSET_Y = 6; // 下拉与锚点的垂直间距

const CommentContent = forwardRef<CommentContentHandle, CommentContentProps>((props, ref) => {
    // 仅用 state 控制显隐/关键词/Range；位置用 DOM 写入避免渲染延迟
    const [dropdown, setDropdown] = useState<{ visible: boolean; keyword: string; range: Range | null }>({
        visible: false,
        keyword: "",
        range: null,
    });

    const dropdownRef = useRef<HTMLDivElement>(null); // 下拉根（Portal 到 props.portalContainer）
    const popoverRef = useRef<HTMLDivElement>(null);  // mention popover 根
    const localContainerRef = useRef<HTMLDivElement>(null); // 本地容器
    const boxRef = useRef<HTMLDivElement>(null);      // contentEditable 容器

    const params = useParams();
    const { t } = useLingui();
    const { setActiveOverlay } = useTodo();

    const containerEl = props.container?.current ?? localContainerRef.current ?? null;

    const [defaultPortalEl, setDefaultPortalEl] = useState<HTMLElement | null>(null);
    useEffect(() => { setDefaultPortalEl(document.body); }, []);
    const dropdownPortalTarget = props.portalContainer ?? defaultPortalEl;
    const popoverPortalTarget = props.popoverContainer ?? containerEl;

    const [contentValue, setContentValue] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });
    const { data: members } = useWorkspaceMembers(params.id || "", searchParams);

    const memberMap = useMemo(() => {
        const map: Record<string, WorkspaceMember> = {};
        (members || []).forEach((m) => (map[m.id] = m));
        return map;
    }, [members]);

    const [popover, setPopover] = useState<{
        visible: boolean;
        anchorEl?: HTMLElement | null;
        mention?: WorkspaceMember;
        left?: number;
        top?: number;
    }>({ visible: false });

    // 给父组件暴露方法
    useImperativeHandle(ref, () => ({
        getContent: () => {
            const { text, mentions } = extractCommentPayload(boxRef.current!);
            return { content: text, mentions };
        },
        inputRef: boxRef,
        focus: (toEnd: boolean = true) => {
            const el = boxRef.current;
            if (!el) return;
            el.focus();
            if (toEnd) {
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        },
        clear: () => {
            if (boxRef.current) {
                boxRef.current.innerHTML = "";
                setContentValue([]);
            }
        }
    }));

    // 默认内容 → 片段
    useEffect(() => {
        setContentValue(splitByMentions(props?.defaultValue?.content || "", props.defaultValue?.mentions || []));
    }, [props.defaultValue]);

    // 进入编辑态自动聚焦到末尾
    useEffect(() => {
        if (!props.editable) return;
        const id = requestAnimationFrame(() => {
            const el = boxRef.current;
            if (!el) return;
            el.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
        return () => cancelAnimationFrame(id);
    }, [props.editable]);

    // ================= 相对 portalContainer 的绝对定位（无拖拽）=================
    /** 将下拉定位到光标 range 的下方，坐标相对 portalContainer 的 padding box */
    const positionDropdownRelToPortal = (r: Range) => {
        if (!dropdownPortalTarget || !dropdownRef.current) return;

        // 1) 取锚点/光标矩形（视口坐标）
        const rects = r.getClientRects();
        const anchor = rects.item(rects.length - 1) ?? r.getBoundingClientRect();

        // 2) 取 portal 容器矩形（视口坐标）
        const portalRect = dropdownPortalTarget.getBoundingClientRect();

        // 3) 计算相对 portal 的坐标（不放 state，直接 DOM 写入）
        let left = anchor.left - portalRect.left;
        const maxLeft = (dropdownPortalTarget.clientWidth ?? 0) - DROPDOWN_WIDTH - DROPDOWN_MARGIN;
        left = Math.max(0, Math.min(left, Math.max(0, maxLeft)));

        const top = anchor.bottom - portalRect.top + OFFSET_Y;

        const el = dropdownRef.current!;
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
    };

    /** 结合当前 selection 更新 range + 位置 */
    const recalcNow = () => {
        if (!dropdown.range) return;
        const sel = document.getSelection();
        const r = dropdown.range.cloneRange();
        if (sel && sel.rangeCount) {
            const s = sel.getRangeAt(0);
            r.setEnd(s.endContainer, s.endOffset);
        }
        positionDropdownRelToPortal(r);
        // 保存最新 range（不触发重渲）
        setDropdown(d => ({ ...d, range: r }));
    };

    // 监听滚动/尺寸/选区变化：实时重算
    useEffect(() => {
        if (!dropdown.visible) return;
        const onScroll = () => recalcNow();
        const onResize = () => recalcNow();
        const onSel = () => recalcNow();

        // 监听 window（包含文档滚动），以及 portalContainer 自身滚动
        window.addEventListener("scroll", onScroll, { capture: true, passive: true });
        window.addEventListener("resize", onResize);
        document.addEventListener("selectionchange", onSel);

        if (dropdownPortalTarget) {
            dropdownPortalTarget.addEventListener("scroll", onScroll, { passive: true });
        }

        // 初次定位
        recalcNow();

        return () => {
            window.removeEventListener("scroll", onScroll, { capture: true } as any);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("selectionchange", onSel);
            if (dropdownPortalTarget) {
                dropdownPortalTarget.removeEventListener("scroll", onScroll as any);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdown.visible, dropdownPortalTarget]);

    // ================= 交互 =================
    const closeDropdown = () => {
        setDropdown(d => ({ ...d, visible: false, keyword: "", range: null }));
        setActiveOverlay?.(false);
    };

    // 点击外部关闭 dropdown/popover（不负责提交）
    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement;
            const inDropdown = !!target.closest?.('[data-mention-dropdown="true"]');
            const inPopover = !!popoverRef.current?.contains(target);

            if (!inDropdown && dropdown.visible) closeDropdown();
            if (!inPopover && popover.visible) setPopover(p => (p.visible ? { ...p, visible: false } : p));
            if (!inDropdown && !inPopover) setActiveOverlay?.(false);
        };
        document.addEventListener("pointerdown", handlePointerDown, { capture: true });
        return () => document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
    }, [dropdown.visible, popover.visible, setActiveOverlay]);

    // Popover 定位（在本地 container 上）
    useLayoutEffect(() => {
        const container = containerEl;
        if (!popover.visible || !popover.anchorEl || !container) return;
        const pop = popoverRef.current;
        if (!pop) return;

        const anchorRect = popover.anchorEl.getBoundingClientRect();
        const size = { w: pop.offsetWidth, h: pop.offsetHeight };
        const { left, top } = calcInContainer(anchorRect, container, size, 6);
        setPopover(p => ({ ...p, left, top: top + 16 }));
    }, [popover.visible, popover.anchorEl, containerEl]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.target as HTMLElement;
        if (el.classList.contains("mention")) {
            setPopover({ visible: true, anchorEl: el, mention: memberMap[el.dataset.uid || ""], left: popover.left, top: popover.top });
            setActiveOverlay?.(true);
        } else {
            setPopover({ visible: false });
        }
    };

    const handleMentionClick = (e: React.MouseEvent<HTMLSpanElement>, m: any) => {
        setPopover({ visible: true, anchorEl: e.currentTarget, mention: m.member });
        setActiveOverlay?.(true);
    };

    // 插入 mention
    const insertMention = (m: WorkspaceMember) => {
        if (!dropdown.range) return;
        const range = dropdown.range;
        range.deleteContents();

        const span = document.createElement("span");
        span.className = "mention";
        span.dataset.uid = m.id;
        span.textContent = `@${m.workspace_nickname || m.user_nickname || m.email}`;
        span.contentEditable = "false";

        range.insertNode(span);
        range.setStartAfter(span);
        range.setEndAfter(span);

        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(range); }
        document.execCommand("insertText", false, " ");

        closeDropdown();
    };

    // 输入触发（@ 检测 + 关键字更新 + 位置即时刷新）
    const handleInput = () => {
        const sel = document.getSelection();
        if (!sel) return;
        const node = sel.anchorNode;
        if (!node) return;

        const charBefore = sel.anchorOffset > 0 && node.textContent ? node.textContent[sel.anchorOffset - 1] : null;

        // ① 首次输入 '@'：打开下拉，并立即定位（相对 portalContainer）
        if (!dropdown.visible && charBefore === "@") {
            const range = sel.getRangeAt(0).cloneRange();
            range.setStart(node, sel.anchorOffset - 1);

            setDropdown({ visible: true, keyword: "", range });
            setActiveOverlay?.(true);

            // 立刻定位一次（避免任何延迟）
            positionDropdownRelToPortal(range);
            return;
        }

        // ② 已打开：更新 keyword/range，并即时定位
        if (dropdown.visible && dropdown.range) {
            const kwRange = dropdown.range.cloneRange();
            kwRange.setEnd(sel.anchorNode!, sel.anchorOffset);

            const raw = kwRange.toString();
            if (!raw) { closeDropdown(); return; }

            const kw = raw.replace(/^@/, "");
            if (/[\s@]/.test(kw)) {
                closeDropdown();
            } else {
                setDropdown(d => ({ ...d, keyword: kw, range: kwRange }));
                setSearchParams(d => ({ ...d, keywords: kw }));
                positionDropdownRelToPortal(kwRange); // 直接写 top/left
            }
        }
    };

    const handleKeyDownWrapper = (e: React.KeyboardEvent<HTMLDivElement>) => {
        props.onInputKeyDown?.(e);
    }


    // 阻断 pointerdown：避免父组件“点外提交”误伤
    useEffect(() => {
        const stop = (e: PointerEvent) => e.preventDefault();

        const drop = dropdownRef.current;
        if (drop) drop.addEventListener("pointerdown", stop, { capture: true });

        const pop = popoverRef.current;
        if (pop) pop.addEventListener("pointerdown", stop, { capture: true });

        return () => {
            if (drop) drop.removeEventListener("pointerdown", stop as any, { capture: true } as any);
            if (pop) pop.removeEventListener("pointerdown", stop as any, { capture: true } as any);
        };
    }, [dropdown.visible, popover.visible]);

    return (
        <>
            <div ref={localContainerRef} className={`relative ${dropdown.visible ? "z-[1000]" : ""}`} style={{ position: "relative" }}>
                <div
                    ref={boxRef}
                    contentEditable={props.editable ?? false}
                    tabIndex={0}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDownWrapper}
                    onBlur={props.onBlur}
                    onClick={handleClick}
                    style={{ outline: "none", whiteSpace: "pre-wrap", ...(props.inputStyle || {}) }}
                >
                    {contentValue.map((p, idx) =>
                        p.type === "text" ? (
                            <span key={`t-${idx}`}>{p.text}</span>
                        ) : (
                            <span
                                key={`m-${idx}`}
                                className="mention inline px-0.5 rounded cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                                data-uid={p.data.member_id}
                                data-label={p.label}
                                contentEditable={false}
                                onClick={(event) => handleMentionClick(event, p.data)}
                            >
                                {p.label}
                            </span>
                        )
                    )}
                </div>

                {/* 下拉：Portal 到父传的 portalContainer；position: absolute 相对它定位 */}
                {dropdown.visible && dropdownPortalTarget &&
                    createPortal(
                        <Card
                            data-mention-dropdown="true"
                            ref={dropdownRef}
                            className="absolute z-[100000] shadow-lg pointer-events-auto"
                            style={{
                                // top/left 由 JS 实时写入
                                width: DROPDOWN_WIDTH,
                                maxHeight: 220,
                            }}
                        >
                            <CardBody className="p-0">
                                <Listbox aria-label="Listbox menu with sections" variant="flat">
                                    <ListboxSection title={t`Members`}>
                                        {(members || []).map((member) => (
                                            <ListboxItem
                                                key={member.id}
                                                className="data-[focus-visible=true]:bg-default/40 data-[focus-visible=true]:dark:bg-default/40"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    insertMention(member);
                                                }}
                                            >
                                                <div className="flex gap-2 items-center">
                                                    <Avatar className="w-5 h-5" src={member.avatar} />
                                                    <span className="text-xs text-gray-500 dark:text-white">
                                                        {member.workspace_nickname || member.user_nickname || member.email}
                                                    </span>
                                                </div>
                                            </ListboxItem>
                                        ))}
                                    </ListboxSection>
                                </Listbox>
                            </CardBody>
                        </Card>,
                        dropdownPortalTarget
                    )}

                {/* Popover（默认挂在本地 container；也可通过 props.popoverContainer 外挂） */}
                {popover.visible && popover.mention && popoverPortalTarget &&
                    createPortal(
                        <div ref={popoverRef} className="absolute z-30" style={{ left: popover.left, top: popover.top }}>
                            <MemberCard member={popover.mention} />
                        </div>,
                        popoverPortalTarget
                    )}

                <style>{`
          .mention{
            background:#eff6ff;
            color:#1d4ed8;
            padding:0 2px;
            border-radius:3px;
            cursor:pointer;
            user-select:none;
          }
          .mention:hover{background:#dbeafe;}
          [contenteditable="true"]:empty:before{
            content:attr(placeholder);
            color:#9ca3af;
          }
        `}</style>
            </div>
        </>
    );
});

export default CommentContent;
