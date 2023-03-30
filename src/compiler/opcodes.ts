export type DefinedOpcode = {
    kind: 'single',
    code: string,
    name: string,
    aliases: string[],
} | {
    kind: 'int',
    name: string,
    aliases: string[],
} | {
    kind: 'ref',
    name: string,
    aliases: string[],
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
        return {
            also(name2: string) {
                res.aliases.push(name2);
            }
        }
    }

    defInt(name: string) {
        const res: DefinedOpcode = {
            kind: 'int',
            name,
            aliases: []
        };
        this.opcodes.push(res);
        return {
            also(name2: string) {
                res.aliases.push(name2);
            }
        }
    }

    defRef(name: string) {
        const res: DefinedOpcode = {
            kind: 'ref',
            name,
            aliases: []
        };
        this.opcodes.push(res);
        return {
            also(name2: string) {
                res.aliases.push(name2);
            }
        }
    }

    prepare() {
        for (const op of this.opcodes) {
            this.opcodeMap.set(op.name, op);
        }
    }
}

//
// Opcode Table
//

const o = new Opcodes();
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
o.defInt('PUSHINT').also('INT');
o.defInt('PUSHINTX').also('INTX');
o.defInt('PUSHPOW2');
o.def('83FF', 'PUSHNAN');
o.defInt('PUSHPOW2DEC');
o.defInt('PUSHNEGPOW2');
o.defRef('PUSHREF');
o.defRef('PUSHREFSLICE');
o.defRef('PUSHREFCONT');
o.defRef('PUSHSLICE').also('SLICE');

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
// o.defInt('RSHIFTR#');
// o.defInt('RSHIFTC#');
// o.defInt('MODPOW2#');
// o.defInt('MODPOW2R#');
// o.defInt('MODPOW2C#');
o.def('A984', 'MULDIV');
o.def('A985', 'MULDIVR');
o.def('A988', 'MULMOD');
o.def('A98C', 'MULDIVMOD');
o.def('A98D', 'MULDIVMODR');
o.def('A98E', 'MULDIVMODC');
o.def('A9A4', 'MULRSHIFT');
o.def('A9A5', 'MULRSHIFTR');
o.def('A9A6', 'MULRSHIFTC');
// o.defInt('MULRSHIFT#');
// o.defInt('MULRSHIFTR#');
// o.defInt('MULRSHIFTC#');
o.def('A9C4', 'LSHIFTDIV');
o.def('A9C5', 'LSHIFTDIVR');
o.def('A9C6', 'LSHIFTDIVC');
// o.defInt('LSHIFT#DIV');
// o.defInt('LSHIFT#DIVR');
// o.defInt('LSHIFT#DIVC');
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