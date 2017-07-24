/* tslint:disable */
/**
 * This file defines browser safe typings for the "node-uuid" npm package without requiring 
 * classes from Node (e.g., Buffer).  There are a number of typings available for this.  However,
 * most assume node-uuid is running on a node server.
 *
 * See https://www.npmjs.com/package/node-uuid for more details about node-uuid.
 */
declare namespace uuid {
    export interface uuidV1Options {
        node?: Array<number>
        clockseq?: number
        msecs: number | Date
        nsecs: number
    }

    export interface uuidV4Options {
        random?: Array<number>
        rng: () => Array<number>
    }

    function noConflict(): void;
    function parse(id: string, buffer?: Array<number>, offset?: number): Array<number>;
    function unparse(buffer?: Array<number>, offset?: number): string;

    function v1(options?: uuidV1Options, buffer?: Array<number>, offset?: number): Array<number>;
    function v4(options?: uuidV4Options): string;
    function v4(options?: uuidV4Options, buffer?: Array<number>, offset?: number): Array<number>;
}
declare module "node-uuid" {
    export = uuid;
}
