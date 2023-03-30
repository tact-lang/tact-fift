import fs from 'fs';
import path from 'path';
import { parse } from './fift';

describe('fift', () => {
    let root = path.resolve(__dirname, '..', '..', 'func');
    let recs = fs.readdirSync(root);
    for (let r of recs) {
        if (r.endsWith('.fc.fift')) {
            it('should parse ' + r, () => {
                let c  = fs.readFileSync(path.resolve(root, r), 'utf8');
                expect(parse(c)).toMatchSnapshot();
            });
        }
    }
});