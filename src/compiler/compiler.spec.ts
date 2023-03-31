import fs from 'fs';
import path from 'path';
import { Cell } from 'ton-core';
import { parse } from '../grammar/fift';
import { compile } from './compiler';

describe('compiler', () => {
    let root = path.resolve(__dirname, '..', '..', 'func');
    let recs = fs.readdirSync(root);
    for (let r of recs) {
        if (r.endsWith('.fc.fift')) {
            it('should parse ' + r, () => {
                let golden = Cell.fromBoc(fs.readFileSync(path.resolve(root, r.slice(0, r.length - 'fift'.length) + 'boc')))[0];
                let c = fs.readFileSync(path.resolve(root, r), 'utf8');
                let parsed = parse(c);
                let compiled = compile(parsed);
                expect(compiled.toString()).toBe(golden.toString());
            });
        }
    }
});