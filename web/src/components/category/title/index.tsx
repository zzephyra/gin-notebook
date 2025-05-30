import { UpdateCategory } from "@/features/api/note";
import { responseCode } from "@/features/constant/response";
import { store } from "@/store";
import { UpdateCategoryByID } from "@/store/features/workspace";
import { Input } from "@heroui/react";
import { useEffect, useState, forwardRef, useRef } from "react";
import { CategoryTitleRef } from "@/components/category/title/scipt";

const CategoryTitle = forwardRef<CategoryTitleRef, {
    title: string,
    workspaceID: string,
    categoryID: string,
}>(({ title, workspaceID, categoryID }) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsEditing(true);
    }

    useEffect(() => {
        if (isEditing) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isEditing]);

    async function handleChangeCategoryName() {
        let newCategoryName = inputRef.current?.value;
        setIsEditing(false);
        if (!newCategoryName) return;

        let res = await UpdateCategory(workspaceID, categoryID, { category_name: newCategoryName });
        if (res.code == responseCode.SUCCESS) {
            store.dispatch(UpdateCategoryByID({ id: categoryID, data: { category_name: newCategoryName } }));
        }
    }


    return (
        <div onDoubleClick={handleDoubleClick} className="h-6">
            {isEditing ? (
                <Input
                    ref={inputRef}
                    defaultValue={title}
                    onBlur={handleChangeCategoryName}
                    classNames={{ inputWrapper: "h-6 min-h-0" }}
                />
            ) : (
                <span className="flex rounded-xl px-3 hover:text-accent-foreground hover:bg-accent items-center gap-1 h-full">
                    {title}
                </span>
            )}
        </div>
    );
});

export default CategoryTitle;
