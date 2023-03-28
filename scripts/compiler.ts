import { compileContract } from 'ton-compiler';
import fs from 'fs';

(async () => {

    for (let p of [{ path: __dirname + "/../func/" }]) {
        let recs = fs.readdirSync(p.path);
        for (let r of recs) {
            if (!r.endsWith('.fc')) {
                continue;
            }
            console.log('Processing ' + p.path + r);
            let res = await compileContract({ files: [p.path + r] })
            fs.writeFileSync(p.path + r + ".fift", res.fift!);
            // fs.writeFileSync(p.path + r + ".cell", res.output!);
        }
    }
})();