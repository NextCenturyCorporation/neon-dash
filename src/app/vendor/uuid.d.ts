interface uuidV1Options {
    node?: Array<number>
    clockseq?: number
    msecs: number | Date
    nsecs: number
}

interface uuidV4Options {
    random?: Array<number>
    rng: () => Array<number>
}

interface uuid {
    v1(options?: uuidV1Options): string
    v1(options?: uuidV1Options, buffer?: Array<number>, offset?: number): Array<number>
    v4(options?: uuidV4Options): string
    v4(options?: uuidV4Options, buffer?: Array<number>, offset?: number): Array<number>
    parse(id: string, buffer?: Array<number>, offset?: number): Array<number>
    unparse(buffer?: Array<number>, offset?: number): string
    noConflict(): void
}

declare const uuid: uuid

declare module "uuid" {
    export = uuid
}
