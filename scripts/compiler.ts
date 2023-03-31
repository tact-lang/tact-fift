import { compileContract } from 'ton-compiler';
import { decompileAll } from '@tact-lang/opcode';
import fs from 'fs';
import { Cell } from 'ton-core';

(async () => {

    for (let p of [{ path: __dirname + "/../func/" }]) {
        let recs = fs.readdirSync(p.path);
        for (let r of recs) {
            if (!r.endsWith('.fc')) {
                continue;
            }
            console.log('Processing ' + p.path + r);
            let res = await compileContract({ files: [p.path + r] })
            if (!res.ok) {
                console.log('Error: ' + res.log);
                continue;
            }
            let decompiled = decompileAll({ src: res.output! });
            fs.writeFileSync(p.path + r + ".fift", res.fift!);
            fs.writeFileSync(p.path + r + ".rev.fift", decompiled);
            fs.writeFileSync(p.path + r + ".boc", res.output!);
            fs.writeFileSync(p.path + r + ".cell", Cell.fromBoc(res.output)[0].toString());
        }
    }
})();