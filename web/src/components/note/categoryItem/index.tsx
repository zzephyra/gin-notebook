import { Note } from "@/pages/workspace/type";

const CategoryListItem = ({ note }: { note: Note }) => {
    return (
        <div className="flex items-center">
            <div className="text-sm text-gray-700">
                {note.title}
            </div>
        </div>
    );
}

export default CategoryListItem;