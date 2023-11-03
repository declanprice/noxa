export type IndexOptions = {
    fields: string[];
};

export enum IndexType {
    Unique,
    Computed,
    External,
    ForeignKey,
    FullTextSearch,
}

export type DocumentIndex = {
    type: IndexType;
    options: IndexOptions;
};

export const uniqueIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.Unique,
        options,
    };
};

export const computedIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.Computed,
        options,
    };
};

export const externalIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.External,
        options,
    };
};

export const foreignKeyIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.ForeignKey,
        options,
    };
};

export const fullTextSearchIndex = (options: IndexOptions): DocumentIndex => {
    return {
        type: IndexType.FullTextSearch,
        options,
    };
};
