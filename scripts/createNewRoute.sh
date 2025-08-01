#!/bin/bash

project_name="$1"
route_base_dir="$2/${project_name}Router"
router_files=(
    "$route_base_dir/dto.go"
    "$route_base_dir/router.go"
    "$route_base_dir/handler.go"
)

if [ -z "$2" ] || [ ! -d "$2" ]; then
    echo "Directory not exists"
    exit 1
fi

createInitFile(){
    file_path="$1"
    content="$2"
    if [ ! -f "$file_path" ]; then
        echo "Creating file: $file_path"
        touch "$file_path"
    else
        echo "File already exists: $file_path"
        return 0;
    fi

    echo "$content" > "$file_path"
}

createRouteBaseDir(){
    if [ ! -d "$route_base_dir" ]; then
        echo "Creating directory: $route_base_dir"
        mkdir -p "$route_base_dir"
    else
        echo "Directory already exists: $route_base_dir"
        return 0;
    fi
}

init(){
    createRouteBaseDir
    common_content="package ${project_name}Router"
    

    for file in "${router_files[@]}"; do
        createInitFile "$file" "$common_content"
    done
}

init