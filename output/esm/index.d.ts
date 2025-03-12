#!/usr/bin/env node
interface HighlightConfig {
    enableColors?: boolean;
    colors?: Record<string, string>;
}
declare class PrismaHighlighter {
    private config;
    private static DEFAULT_COLORS;
    private static PRISMA_TYPES;
    constructor(config?: HighlightConfig);
    private colorize;
    highlight(schema: string): string;
}

export { type HighlightConfig, PrismaHighlighter };
