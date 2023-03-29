import fiftGrammar from './fift.ohm-bundle';

export function parse(src: string) {
    let matchResult = fiftGrammar.match(src);
    if (matchResult.failed()) {
        throw new Error(matchResult.message);
    }
}