export { DocumentStore } from './document-store.service';

export {
    Document,
    DocumentField,
    DocumentId,
    DocumentFieldType,
} from './document/document.decorators';

export {
    uniqueIndex,
    computedIndex,
    externalIndex,
    foreignKeyIndex,
    fullTextSearchIndex,
} from './document/document-indexes';

export {
    eq,
    lt,
    gt,
    between,
    not,
    or,
    and,
    asc,
    desc,
    OR,
    AND,
    DocumentQueryBuilder,
} from './document/document-query-builder';
