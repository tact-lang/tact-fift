import { BitBuilder, BitString, Cell } from "ton-core";
import { fits } from "../utils/fits";
import { ContinuationBuilder } from "./builder";

export type DefinedOpcode = {
    kind: 'single',
    code: string,
    name: string,
    aliases: string[],
} | {
    kind: 'int',
    name: string,
    aliases: string[],
    serializer: ((src: ContinuationBuilder, arg: bigint) => void) | null,
} | {
    kind: 'ref',
    name: string,
    aliases: string[],
    serializer: ((src: ContinuationBuilder, arg: Cell) => void) | null,
}

export class Opcodes {

    opcodes: DefinedOpcode[] = [];
    opcodeMap: Map<string, DefinedOpcode> = new Map();

    def(code: string, name: string) {
        const res: DefinedOpcode = {
            kind: 'single',
            code,
            name,
            aliases: []
        };
        this.opcodes.push(res);

        let b = {
            also(name2: string) {
                res.aliases.push(name2);
                return b;
            }
        }
        return b;
    }

    defInt(name: string) {
        const res: DefinedOpcode = {
            kind: 'int',
            name,
            aliases: [],
            serializer: null
        };
        this.opcodes.push(res);
        let b = {
            also(name2: string) {
                res.aliases.push(name2);
                return b;
            },
            serializer(f: (src: ContinuationBuilder, arg: bigint) => void) {
                res.serializer = f;
                return b;
            }
        }
        return b;
    }

    defRef(name: string) {
        const res: DefinedOpcode = {
            kind: 'ref',
            name,
            aliases: [],
            serializer: null
        };
        this.opcodes.push(res);
        let b = {
            also(name2: string) {
                res.aliases.push(name2);
                return b;
            },
            serializer(f: (src: ContinuationBuilder, arg: Cell) => void) {
                res.serializer = f;
                return b;
            }
        }
        return b;
    }

    prepare() {
        for (const op of this.opcodes) {
            this.opcodeMap.set(op.name, op);
        }
    }
}

//
// Serializers
//

const serializers = {
    '8u+1': (code: string) => {
        return (src: ContinuationBuilder, arg: bigint) => {
            let bits = new BitBuilder();
            bits.writeBuffer(Buffer.from(code, 'hex'));
            bits.writeUint(arg - 1n, 8);
            src.store(bits.build().subbuffer(0, bits.length)!);
        }
    },
    'pushint': (src: ContinuationBuilder, arg: bigint) => {
        let bits = new BitBuilder();
        if (-5n <= arg && arg <= 10n) {
            bits.writeUint(0x7, 4);
            bits.writeUint(Number(arg) & 0xf, 4);
        } else if (-128n <= arg && arg <= 127n) {
            bits.writeUint(0x80, 8);
            bits.writeInt(arg, 8);
        } else if (-32768n <= arg && arg <= 32767n) {
            bits.writeUint(0x81, 8);
            bits.writeInt(arg, 16);
        } else {
            let found = false;
            for (let l = 0; l < 30; l++) {
                let n = 19 + l * 8;
                let vBits = 1n << (BigInt(n) - 1n);
                if (-vBits <= arg && arg < vBits) {
                    bits.writeUint(0x82, 8);
                    bits.writeUint(l, 5);
                    bits.writeInt(arg, n);
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new Error(`Cannot encode integer ${arg}`);
            }
        }
        src.store(bits.build().subbuffer(0, bits.length)!);
    },
    'ref': (code: string) => {
        return (src: ContinuationBuilder, arg: Cell) => {
            src.store(Buffer.from(code, 'hex'), [arg]);
        }
    }
}

//
// Opcode Table
//

const o = new Opcodes();

// Stack operations
o.def('00', 'NOP');
o.def('01', 'SWAP');
o.def('20', 'DUP');
o.def('21', 'OVER');
o.def('30', 'DROP');
o.def('31', 'NIP');
o.def('58', 'ROT');
o.def('59', '-ROT').also('ROTREV');
o.def('5A', '2SWAP').also('SWAP2');
o.def('5B', '2DROP').also('DROP2');
o.def('5C', '2DUP').also('DUP2');
o.def('5D', '2OVER').also('OVER2');
o.def('60', 'PICK').also('PUSHX');
o.def('61', 'ROLLX');
o.def('62', '-ROLLX').also('ROLLREVX');
o.def('63', 'BLKSWX');
o.def('64', 'REVX');
o.def('65', 'DROPX');
o.def('66', 'TUCK');
o.def('67', 'XCHGX');
o.def('68', 'DEPTH');
o.def('69', 'CHKDEPTH');
o.def('6A', 'ONLYTOPX');
o.def('6B', 'ONLYX');

// Constants
o.def('70', 'ZERO').also('FALSE');
o.def('71', 'ONE');
o.def('72', 'TWO');
o.def('7A', 'TEN');
o.def('7F', 'TRUE');
o.defInt('PUSHINT')
    .also('INT')
    .serializer(serializers.pushint);
o.defInt('PUSHINTX')
    .also('INTX')
    .serializer((src, arg) => {

        // 8 bit
        if (fits(arg, 8)) {
            serializers.pushint(src, arg);
            return;
        }

        // Split number to a power of two + rest
        function pow2decomp(s: bigint) {
            let count = 0;
            while (s % 2n == 0n) {
                count++;
                s /= 2n;
            }
            return [count, s] as const;
        }
        let [pows, v] = pow2decomp(arg);

        // This is a pure power of two
        if (v === 1n) {
            serializers["8u+1"]('83')(src, BigInt(pows)); // PUSHPOW2
            return;
        }

        if (v === -1n) {
            serializers["8u+1"]('85')(src, BigInt(pows)); // PUSHNEGPOW2
            return;
        }

        // This variable has enought number of zeros in the begining
        if (pows > 20) {
            serializers.pushint(src, BigInt(v)); // Push the rest
            serializers["8u+1"]('AA')(src, BigInt(pows)); // LSHIFT# shift left
            return;
        }

        // Check if power of two is a power of two minus one
        [pows, v] = pow2decomp(arg + 1n);
        if (v === 1n) {
            serializers["8u+1"]('84')(src, BigInt(pows)); // PUSHPOW2DEC
            return;
        }

        // Fallback
        serializers.pushint(src, arg);
    });
o.defInt('PUSHPOW2').serializer(serializers["8u+1"]('83'));
o.def('83FF', 'PUSHNAN');
o.defInt('PUSHPOW2DEC').serializer(serializers["8u+1"]('84'));
o.defInt('PUSHNEGPOW2').serializer(serializers["8u+1"]('85'));
o.defRef('PUSHREF').serializer(serializers.ref('88'));
o.defRef('PUSHREFSLICE').serializer(serializers.ref('89'));
o.defRef('PUSHREFCONT').serializer(serializers.ref('8A'));
o.defRef('PUSHSLICE')
    .also('SLICE')
    .serializer((src, arg) => {

        // Push as ref
        if (arg.refs.length > src.availableRefs || (arg.bits.length + 17) > src.availableBits) {
            serializers.ref('89')(src, arg); // PUSHREFSLICE
            return;
        }

        // If bitstring
        if (arg.refs.length === 0) {
            let bits = new BitBuilder();
            bits.writeUint(0x8B, 8); // PUSHSLICE
            let l = Math.ceil((arg.bits.length - 4) / 8);
            let n = l * 8 + 4;
            bits.writeUint(l, 4);
            bits.writeBits(arg.bits);
            let i = arg.bits.length;
            if (i < n) {
                bits.writeBit(true);
                i++;
            }
            while (i < n) {
                bits.writeBit(false);
                i++
            }
            src.store(bits.build().subbuffer(0, bits.length)!);
            return;
        }

        throw Error('Not implemented');
    });

// Arithmetic
o.def('A0', 'ADD');
o.def('A1', 'SUB');
o.def('A2', 'SUBR');
o.def('A3', 'NEGATE');
o.def('A4', 'INC');
o.def('A5', 'DEC');
o.defInt('ADDCONST').also('ADDINT');
o.defInt('SUBCONST').also('SUBINT');
o.defInt('MULCONST').also('MULINT');
o.def('A8', 'MUL');
o.def('A904', 'DIV');
o.def('A905', 'DIVR');
o.def('A906', 'DIVC');
o.def('A908', 'MOD');
o.def('A90C', 'DIVMOD');
o.def('A90D', 'DIVMODR');
o.def('A90E', 'DIVMODC');
o.def('A925', 'RSHIFTR');
o.def('A926', 'RSHIFTC');
o.defInt('RSHIFTR#').serializer(serializers["8u+1"]('A935'));
o.defInt('RSHIFTC#').serializer(serializers["8u+1"]('A936'));
o.defInt('MODPOW2#').serializer(serializers["8u+1"]('A938'));
o.defInt('MODPOW2R#').serializer(serializers["8u+1"]('A939'));
o.defInt('MODPOW2C#').serializer(serializers["8u+1"]('A93A'));
o.def('A984', 'MULDIV');
o.def('A985', 'MULDIVR');
o.def('A988', 'MULMOD');
o.def('A98C', 'MULDIVMOD');
o.def('A98D', 'MULDIVMODR');
o.def('A98E', 'MULDIVMODC');
o.def('A9A4', 'MULRSHIFT');
o.def('A9A5', 'MULRSHIFTR');
o.def('A9A6', 'MULRSHIFTC');
o.defInt('MULRSHIFT#').serializer(serializers["8u+1"]('A9B4'));
o.defInt('MULRSHIFTR#').serializer(serializers["8u+1"]('A9B5'));
o.defInt('MULRSHIFTC#').serializer(serializers["8u+1"]('A9B6'));
o.def('A9C4', 'LSHIFTDIV');
o.def('A9C5', 'LSHIFTDIVR');
o.def('A9C6', 'LSHIFTDIVC');
o.defInt('LSHIFT#DIV').serializer(serializers["8u+1"]('A9D4'));
o.defInt('LSHIFT#DIVR').serializer(serializers["8u+1"]('A9D5'));
o.defInt('LSHIFT#DIVC').serializer(serializers["8u+1"]('A9D6'));
o.defInt('LSHIFT#').serializer(serializers["8u+1"]('AA'));
o.defInt('RSHIFT#').serializer(serializers["8u+1"]('AB'));
o.def('AC', 'LSHIFT');
o.def('AD', 'RSHIFT');
o.def('AE', 'POW2');
o.def('B0', 'AND');
o.def('B1', 'OR');
o.def('B2', 'XOR');
o.def('B3', 'NOT');
// x{ B4 } @Defop(8u + 1) FITS
// x{ B400 } @Defop CHKBOOL
// x{ B5 } @Defop(8u + 1) UFITS
// x{ B500 } @Defop CHKBIT
// x{ B600 } @Defop FITSX
// x{ B601 } @Defop UFITSX
// x{ B602 } @Defop BITSIZE
// x{ B603 } @Defop UBITSIZE
// x{ B608 } @Defop MIN
// x{ B609 } @Defop MAX
// x{ B60A } dup @Defop MINMAX @Defop INTSORT2
// x{ B60B } @Defop ABS
// x{ B7 } @Defop QUIET
// x{ B7A0 } @Defop QADD
// x{ B7A1 } @Defop QSUB
// x{ B7A2 } @Defop QSUBR
// x{ B7A3 } @Defop QNEGATE
// x{ B7A4 } @Defop QINC
// x{ B7A5 } @Defop QDEC
// x{ B7A8 } @Defop QMUL
// x{ B7A904 } @Defop QDIV
// x{ B7A905 } @Defop QDIVR
// x{ B7A906 } @Defop QDIVC
// x{ B7A908 } @Defop QMOD
// x{ B7A90C } @Defop QDIVMOD
// x{ B7A90D } @Defop QDIVMODR
// x{ B7A90E } @Defop QDIVMODC
// x{ B7A985 } @Defop QMULDIVR
// x{ B7A98C } @Defop QMULDIVMOD
// x{ B7AC } @Defop QLSHIFT
// x{ B7AD } @Defop QRSHIFT
// x{ B7AE } @Defop QPOW2
// x{ B7B0 } @Defop QAND
// x{ B7B1 } @Defop QOR
// x{ B7B2 } @Defop QXOR
// x{ B7B3 } @Defop QNOT
// x{ B7B4 } @Defop(8u + 1) QFITS
// x{ B7B5 } @Defop(8u + 1) QUFITS
// x{ B7B600 } @Defop QFITSX
// x{ B7B601 } @Defop QUFITSX

o.prepare();
export const opcodes = o;