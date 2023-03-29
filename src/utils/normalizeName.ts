export function normalizeName(src: string) {
    if (src.startsWith('-')) {
        src = 'MINUS_' + src.slice(1);
    }
    return src;
}