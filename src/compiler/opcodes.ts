import { BitBuilder, Cell } from "ton-core";
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

export const serializers = {
    '4u': (code: string) => {
        return (src: ContinuationBuilder, arg: bigint) => {
            let buf = Buffer.from(code + '0', 'hex');
            buf[buf.length - 1] = Number(arg);
            src.store(buf);
        }
    },
    '8u+1': (code: string) => {
        return (src: ContinuationBuilder, arg: bigint) => {
            let bits = new BitBuilder();
            bits.writeBuffer(Buffer.from(code, 'hex'));
            bits.writeUint(arg - 1n, 8);
            src.store(bits.build().subbuffer(0, bits.length)!);
        }
    },
    '8i,alt': (code: string) => {
        return (src: ContinuationBuilder, arg: bigint) => {
            let bits = new BitBuilder();
            bits.writeBuffer(Buffer.from(code, 'hex'));
            bits.writeInt(arg, 8);
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
    'pushslice': (src: ContinuationBuilder, arg: Cell) => {
        // Push as ref
        if (arg.refs.length > src.availableRefs || (arg.bits.length + 17) > src.availableBits) {
            serializers.ref('89')(src, arg); // PUSHREFSLICE
            return;
        }

        // PUSHSLICE(0x8B)
        if (arg.refs.length === 0 && arg.bits.length <= 123) {
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

        // PUSHSLICE(0x8C)
        if (arg.refs.length > 1 && arg.bits.length <= 123) { // What to do for 4 refs?
            let bits = new BitBuilder();
            bits.writeUint(0x8C, 8); // PUSHSLICE
            bits.writeUint(arg.refs.length - 1, 2);
            let l = Math.ceil((arg.bits.length - 1) / 8);
            let n = l * 8 + 1;
            bits.writeUint(l, 5);
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
            src.store(bits.build().subbuffer(0, bits.length)!, arg.refs);
            return;
        }

        // PUSHSLICE(0x8D)
        let bits = new BitBuilder();
        bits.writeUint(0x8D, 8); // PUSHSLICE
        bits.writeUint(arg.refs.length, 3);
        let l = Math.ceil((arg.bits.length - 6) / 8);
        let n = l * 8 + 6;
        bits.writeUint(l, 7);
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
        src.store(bits.build().subbuffer(0, bits.length)!, arg.refs);
    },
    'pushcont': (src: ContinuationBuilder, arg: Cell) => {
        if (arg.bits.length % 8 !== 0) {
            throw new Error(`Continuation length must be a multiple of 8`);
        }

        // If not enough space, push as ref
        if (arg.refs.length > src.availableRefs || (arg.bits.length + 16) > src.availableBits) {
            serializers.ref('8A')(src, arg); // PUSHREFCONT
            return;
        }

        // PUSHCONT(0x9)
        if (arg.refs.length === 0 && arg.bits.length <= 120) {
            let bits = new BitBuilder();
            bits.writeUint(0x9, 4);
            bits.writeUint(arg.bits.length / 8, 4);
            bits.writeBits(arg.bits);
            src.store(bits.build().subbuffer(0, bits.length)!, arg.refs);
            return;
        }

        // PUSHCONT(0x8F_)
        let bits = new BitBuilder();
        bits.writeUint(0x47, 7); // 8F_
        bits.writeUint(arg.refs.length, 2);
        bits.writeUint(arg.bits.length / 8, 7);
        bits.writeBits(arg.bits);
        src.store(bits.build().subbuffer(0, bits.length)!, arg.refs);
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

// null primitives
o.def('6D', 'NULL').also('PUSHNULL');
o.def('6E', 'ISNULL');

// tuple operations
o.defInt('TUPLE').serializer(serializers['4u']('6F0'));
o.def('6F00', 'NIL');
o.def('6F01', 'SINGLE');
o.def('6F02', 'PAIR').also('CONS');
o.def('6F03', 'TRIPLE');
o.defInt('INDEX').serializer(serializers['4u']('6F1'));
o.def('6F10', 'FIRST').also('CAR');
o.def('6F11', 'SECOND').also('CDR');
o.def('6F12', 'THIRD');
o.defInt('UNTUPLE').serializer(serializers['4u']('6F2'));
o.def('6F21', 'UNSINGLE');
o.def('6F22', 'UNPAIR').also('UNCONS');
o.def('6F23', 'UNTRIPLE');
o.defInt('UNPACKFIRST').serializer(serializers['4u']('6F3'));
o.def('6F30', 'CHKTUPLE');
o.defInt('EXPLODE').serializer(serializers['4u']('6F4'));
o.defInt('SETINDEX').serializer(serializers['4u']('6F5'));
o.def('6F50', 'SETFIRST');
o.def('6F51', 'SETSECOND');
o.def('6F52', 'SETTHIRD');
o.defInt('INDEXQ').serializer(serializers['4u']('6F6'));
o.def('6F60', 'FIRSTQ').also('CARQ');
o.def('6F61', 'SECONDQ').also('CDRQ');
o.def('6F62', 'THIRDQ');
o.defInt('SETINDEXQ').serializer(serializers['4u']('6F7'));
o.def('6F70', 'SETFIRSTQ');
o.def('6F71', 'SETSECONDQ');
o.def('6F72', 'SETTHIRDQ');
o.def('6F80', 'TUPLEVAR');
o.def('6F81', 'INDEXVAR');
o.def('6F82', 'UNTUPLEVAR');
o.def('6F83', 'UNPACKFIRSTVAR');
o.def('6F84', 'EXPLODEVAR');
o.def('6F85', 'SETINDEXVAR');
o.def('6F86', 'INDEXVARQ');
o.def('6F87', 'SETINDEXVARQ');
o.def('6F88', 'TLEN');
o.def('6F89', 'QTLEN');
o.def('6F8A', 'ISTUPLE');
o.def('6F8B', 'LAST');
o.def('6F8C', 'TPUSH').also('COMMA');
o.def('6F8D', 'TPOP');
o.def('6FA0', 'NULLSWAPIF');
o.def('6FA1', 'NULLSWAPIFNOT');
o.def('6FA2', 'NULLROTRIF');
o.def('6FA3', 'NULLROTRIFNOT');
o.def('6FA4', 'NULLSWAPIF2');
o.def('6FA5', 'NULLSWAPIFNOT2');
o.def('6FA6', 'NULLROTRIF2');
o.def('6FA7', 'NULLROTRIFNOT2');
// { <b x{6FB} s, rot 2 u, swap 2 u, @addopb } : INDEX2
o.def('6FB4', 'CADR');
o.def('6FB5', 'CDDR');
// { <b x{6FE_} s, 3 roll 2 u, rot 2 u, swap 2 u, @addopb } : INDEX3
o.def('6FD4', 'CADDR');
o.def('6FD5', 'CDDDR');

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
o.defRef('PUSHSLICE').also('SLICE').serializer(serializers.pushslice);
o.defRef('PUSHCONT').also('CONT').serializer(serializers.pushcont);

// Arithmetic
o.def('A0', 'ADD');
o.def('A1', 'SUB');
o.def('A2', 'SUBR');
o.def('A3', 'NEGATE');
o.def('A4', 'INC');
o.def('A5', 'DEC');
o.defInt('ADDCONST').also('ADDINT').serializer(serializers["8i,alt"]('A6'));
o.defInt('SUBCONST').also('SUBINT').serializer((src, arg) => serializers["8i,alt"]('A6')(src, -arg));
o.defInt('MULCONST').also('MULINT').serializer(serializers["8i,alt"]('A7'));
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