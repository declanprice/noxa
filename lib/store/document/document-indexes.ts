export type IndexOptions = {
    fields: string[];
    unique?: boolean;
};

export enum IndexType {
    Computed,
    Contains,
    FullTextSearch,
}

export type DocumentIndex = {
    type: IndexType;
    options: IndexOptions;
};

export const computedIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.Computed,
        options,
    };
};

export const containsIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.FullTextSearch,
        options,
    };
};

export const fullTextSearchIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.FullTextSearch,
        options,
    };
};
