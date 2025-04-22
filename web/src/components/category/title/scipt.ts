
import { useEffect, useRef, useState, createRef } from "react";
import { NoteCategory } from "@/pages/workspace/type";

export interface CategoryTitleRef {
    enter: () => void;
    exit: () => void;
}

