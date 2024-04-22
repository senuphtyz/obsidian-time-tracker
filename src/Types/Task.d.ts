/**
 * Task definition.
 */
export interface Task {
    symbol: string;
    link: Link;
    section: Link;
    text: string;
    tags: string[];
    line: number;
    lineCount: number;
    list: number;
    outlinks: [];
    path: string;
    children: [];
    task: boolean;
    annotated: boolean;
    position: {
        start: FilePosition;
        end: FilePosition;
    };
    subtasks: Task[];
    real: boolean;
    header: Link;
    completion: string;
    status: string;
    checked: boolean;
    completed: boolean;
    fullyCompleted: boolean;
}

/**
 * Link definition
 */
export interface Link {
    path: string;
    subpath: string;
    type: string;
}

/**
 * FilePosition definition
 */
export interface FilePosition {
    line: number;
    col: number;
    offset: number;
}
