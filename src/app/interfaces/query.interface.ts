

export interface PrismaFindManyArgs {
    where ?: Record<string, unknown>;
    include ?: Record<string, unknown>;
    select ?: Record<string, boolean | Record<string, unknown> >
    orderBy ?: Record<string, unknown> | Record<string, unknown>[];
    skip ?: number;
    take ?: number;
    cursor ?: Record<string, unknown>;
    distinct ?: string[] | string;
    [key: string] : unknown;
}

export interface PrismaCountArgs {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, boolean | Record<string, unknown>>
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    skip?: number;
    take?: number;
    cursor?: Record<string, unknown>;
    distinct?: string[] | string;
    [key: string]: unknown;
}