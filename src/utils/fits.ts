export function fits(value: bigint, bits: number): boolean {
    let mask = (1n << BigInt(bits)) - 1n;
    return (value & mask) === value;
}