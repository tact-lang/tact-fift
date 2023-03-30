export function normalizeName(src: string) {
    if (src.startsWith('-')) {
        src = 'MINUS_' + src.slice(1);
    }
    if (src.endsWith('#')) {
        src = src.slice(0, -1) + '_HASH';
    }
    if (src.indexOf('#') >= 0) {
        src = src.replace(/#/g, '_HASH_');
    }
    return src;
}