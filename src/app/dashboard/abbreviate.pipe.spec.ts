import { AbbreviatePipe } from './abbreviate.pipe';

describe('AbbreviatePipe', () => {
    it('simple use cases', () => {
        const pipe = new AbbreviatePipe();
        expect(pipe).toBeTruthy();

        expect(pipe.transform(1100, 1)).toEqual('1.1k');
        expect(pipe.transform(1100)).toEqual('1k');
        expect(pipe.transform(10, 1)).toEqual('10');
        expect(pipe.transform(101, 1)).toEqual('101');
        expect(pipe.transform(101)).toEqual('101');
        expect(pipe.transform(1001, 1)).toEqual('1.0k');
        expect(pipe.transform(1000000)).toEqual('1M');
        expect(pipe.transform(Number.NaN)).toEqual(null);
    });
});
