import { Cell } from 'ton-core';
import { FiftSemantics } from './fift.ohm-bundle'
export type Opcode =
    | { kind: 'simple', name: 'NOP' }
    | { kind: 'simple', name: 'SWAP' }
    | { kind: 'simple', name: 'DUP' }
    | { kind: 'simple', name: 'OVER' }
    | { kind: 'simple', name: 'DROP' }
    | { kind: 'simple', name: 'NIP' }
    | { kind: 'simple', name: 'ROT' }
    | { kind: 'simple', name: '-ROT' }
    | { kind: 'simple', name: '2SWAP' }
    | { kind: 'simple', name: '2DROP' }
    | { kind: 'simple', name: '2DUP' }
    | { kind: 'simple', name: '2OVER' }
    | { kind: 'simple', name: 'PICK' }
    | { kind: 'simple', name: 'ROLLX' }
    | { kind: 'simple', name: '-ROLLX' }
    | { kind: 'simple', name: 'BLKSWX' }
    | { kind: 'simple', name: 'REVX' }
    | { kind: 'simple', name: 'DROPX' }
    | { kind: 'simple', name: 'TUCK' }
    | { kind: 'simple', name: 'XCHGX' }
    | { kind: 'simple', name: 'DEPTH' }
    | { kind: 'simple', name: 'CHKDEPTH' }
    | { kind: 'simple', name: 'ONLYTOPX' }
    | { kind: 'simple', name: 'ONLYX' }
    | { kind: 'simple', name: 'ZERO' }
    | { kind: 'simple', name: 'ONE' }
    | { kind: 'simple', name: 'TWO' }
    | { kind: 'simple', name: 'TEN' }
    | { kind: 'simple', name: 'TRUE' }
    | { kind: 'int', name: 'PUSHINT', arg: bigint }
    | { kind: 'int', name: 'PUSHINTX', arg: bigint }
    | { kind: 'int', name: 'PUSHPOW2', arg: bigint }
    | { kind: 'simple', name: 'PUSHNAN' }
    | { kind: 'int', name: 'PUSHPOW2DEC', arg: bigint }
    | { kind: 'int', name: 'PUSHNEGPOW2', arg: bigint }
    | { kind: 'ref', name: 'PUSHREF', arg: Cell }
    | { kind: 'ref', name: 'PUSHREFSLICE', arg: Cell }
    | { kind: 'ref', name: 'PUSHREFCONT', arg: Cell }
    | { kind: 'ref', name: 'PUSHSLICE', arg: Cell }
    | { kind: 'simple', name: 'ADD' }
    | { kind: 'simple', name: 'SUB' }
    | { kind: 'simple', name: 'SUBR' }
    | { kind: 'simple', name: 'NEGATE' }
    | { kind: 'simple', name: 'INC' }
    | { kind: 'simple', name: 'DEC' }
    | { kind: 'int', name: 'ADDCONST', arg: bigint }
    | { kind: 'int', name: 'SUBCONST', arg: bigint }
    | { kind: 'int', name: 'MULCONST', arg: bigint }
    | { kind: 'simple', name: 'MUL' }
    | { kind: 'simple', name: 'DIV' }
    | { kind: 'simple', name: 'DIVR' }
    | { kind: 'simple', name: 'DIVC' }
    | { kind: 'simple', name: 'MOD' }
    | { kind: 'simple', name: 'DIVMOD' }
    | { kind: 'simple', name: 'DIVMODR' }
    | { kind: 'simple', name: 'DIVMODC' }
    | { kind: 'simple', name: 'RSHIFTR' }
    | { kind: 'simple', name: 'RSHIFTC' }
    | { kind: 'simple', name: 'MULDIV' }
    | { kind: 'simple', name: 'MULDIVR' }
    | { kind: 'simple', name: 'MULMOD' }
    | { kind: 'simple', name: 'MULDIVMOD' }
    | { kind: 'simple', name: 'MULDIVMODR' }
    | { kind: 'simple', name: 'MULDIVMODC' }
    | { kind: 'simple', name: 'MULRSHIFT' }
    | { kind: 'simple', name: 'MULRSHIFTR' }
    | { kind: 'simple', name: 'MULRSHIFTC' }
    | { kind: 'simple', name: 'LSHIFTDIV' }
    | { kind: 'simple', name: 'LSHIFTDIVR' }
    | { kind: 'simple', name: 'LSHIFTDIVC' }
    | { kind: 'simple', name: 'LSHIFT' }
    | { kind: 'simple', name: 'RSHIFT' }
    | { kind: 'simple', name: 'POW2' }
    | { kind: 'simple', name: 'AND' }
    | { kind: 'simple', name: 'OR' }
    | { kind: 'simple', name: 'XOR' }
    | { kind: 'simple', name: 'NOT' }
    ;

export function registerOpcodes(semantics: FiftSemantics) {
    semantics.addOperation<Opcode>('resolve_opcode', {
        Opcode_op_NOP(arg0) {
            return { kind: 'simple', name: 'NOP' };
        },
        Opcode_op_SWAP(arg0) {
            return { kind: 'simple', name: 'SWAP' };
        },
        Opcode_op_DUP(arg0) {
            return { kind: 'simple', name: 'DUP' };
        },
        Opcode_op_OVER(arg0) {
            return { kind: 'simple', name: 'OVER' };
        },
        Opcode_op_DROP(arg0) {
            return { kind: 'simple', name: 'DROP' };
        },
        Opcode_op_NIP(arg0) {
            return { kind: 'simple', name: 'NIP' };
        },
        Opcode_op_ROT(arg0) {
            return { kind: 'simple', name: 'ROT' };
        },
        Opcode_op_MINUS_ROT(arg0) {
            return { kind: 'simple', name: '-ROT' };
        },
        Opcode_op_ROTREV(arg0) {
            return { kind: 'simple', name: '-ROT' };
        },
        Opcode_op_2SWAP(arg0) {
            return { kind: 'simple', name: '2SWAP' };
        },
        Opcode_op_SWAP2(arg0) {
            return { kind: 'simple', name: '2SWAP' };
        },
        Opcode_op_2DROP(arg0) {
            return { kind: 'simple', name: '2DROP' };
        },
        Opcode_op_DROP2(arg0) {
            return { kind: 'simple', name: '2DROP' };
        },
        Opcode_op_2DUP(arg0) {
            return { kind: 'simple', name: '2DUP' };
        },
        Opcode_op_DUP2(arg0) {
            return { kind: 'simple', name: '2DUP' };
        },
        Opcode_op_2OVER(arg0) {
            return { kind: 'simple', name: '2OVER' };
        },
        Opcode_op_OVER2(arg0) {
            return { kind: 'simple', name: '2OVER' };
        },
        Opcode_op_PICK(arg0) {
            return { kind: 'simple', name: 'PICK' };
        },
        Opcode_op_PUSHX(arg0) {
            return { kind: 'simple', name: 'PICK' };
        },
        Opcode_op_ROLLX(arg0) {
            return { kind: 'simple', name: 'ROLLX' };
        },
        Opcode_op_MINUS_ROLLX(arg0) {
            return { kind: 'simple', name: '-ROLLX' };
        },
        Opcode_op_ROLLREVX(arg0) {
            return { kind: 'simple', name: '-ROLLX' };
        },
        Opcode_op_BLKSWX(arg0) {
            return { kind: 'simple', name: 'BLKSWX' };
        },
        Opcode_op_REVX(arg0) {
            return { kind: 'simple', name: 'REVX' };
        },
        Opcode_op_DROPX(arg0) {
            return { kind: 'simple', name: 'DROPX' };
        },
        Opcode_op_TUCK(arg0) {
            return { kind: 'simple', name: 'TUCK' };
        },
        Opcode_op_XCHGX(arg0) {
            return { kind: 'simple', name: 'XCHGX' };
        },
        Opcode_op_DEPTH(arg0) {
            return { kind: 'simple', name: 'DEPTH' };
        },
        Opcode_op_CHKDEPTH(arg0) {
            return { kind: 'simple', name: 'CHKDEPTH' };
        },
        Opcode_op_ONLYTOPX(arg0) {
            return { kind: 'simple', name: 'ONLYTOPX' };
        },
        Opcode_op_ONLYX(arg0) {
            return { kind: 'simple', name: 'ONLYX' };
        },
        Opcode_op_ZERO(arg0) {
            return { kind: 'simple', name: 'ZERO' };
        },
        Opcode_op_FALSE(arg0) {
            return { kind: 'simple', name: 'ZERO' };
        },
        Opcode_op_ONE(arg0) {
            return { kind: 'simple', name: 'ONE' };
        },
        Opcode_op_TWO(arg0) {
            return { kind: 'simple', name: 'TWO' };
        },
        Opcode_op_TEN(arg0) {
            return { kind: 'simple', name: 'TEN' };
        },
        Opcode_op_TRUE(arg0) {
            return { kind: 'simple', name: 'TRUE' };
        },
        Opcode_op_PUSHINT(arg0, arg1) {
            return { kind: 'int', name: 'PUSHINT', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_INT(arg0, arg1) {
            return { kind: 'int', name: 'PUSHINT', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_PUSHINTX(arg0, arg1) {
            return { kind: 'int', name: 'PUSHINTX', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_INTX(arg0, arg1) {
            return { kind: 'int', name: 'PUSHINTX', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_PUSHPOW2(arg0, arg1) {
            return { kind: 'int', name: 'PUSHPOW2', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_PUSHNAN(arg0) {
            return { kind: 'simple', name: 'PUSHNAN' };
        },
        Opcode_op_PUSHPOW2DEC(arg0, arg1) {
            return { kind: 'int', name: 'PUSHPOW2DEC', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_PUSHNEGPOW2(arg0, arg1) {
            return { kind: 'int', name: 'PUSHNEGPOW2', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_ADD(arg0) {
            return { kind: 'simple', name: 'ADD' };
        },
        Opcode_op_SUB(arg0) {
            return { kind: 'simple', name: 'SUB' };
        },
        Opcode_op_SUBR(arg0) {
            return { kind: 'simple', name: 'SUBR' };
        },
        Opcode_op_NEGATE(arg0) {
            return { kind: 'simple', name: 'NEGATE' };
        },
        Opcode_op_INC(arg0) {
            return { kind: 'simple', name: 'INC' };
        },
        Opcode_op_DEC(arg0) {
            return { kind: 'simple', name: 'DEC' };
        },
        Opcode_op_ADDCONST(arg0, arg1) {
            return { kind: 'int', name: 'ADDCONST', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_ADDINT(arg0, arg1) {
            return { kind: 'int', name: 'ADDCONST', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_SUBCONST(arg0, arg1) {
            return { kind: 'int', name: 'SUBCONST', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_SUBINT(arg0, arg1) {
            return { kind: 'int', name: 'SUBCONST', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_MULCONST(arg0, arg1) {
            return { kind: 'int', name: 'MULCONST', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_MULINT(arg0, arg1) {
            return { kind: 'int', name: 'MULCONST', arg: BigInt(arg0.sourceString) };
        },
        Opcode_op_MUL(arg0) {
            return { kind: 'simple', name: 'MUL' };
        },
        Opcode_op_DIV(arg0) {
            return { kind: 'simple', name: 'DIV' };
        },
        Opcode_op_DIVR(arg0) {
            return { kind: 'simple', name: 'DIVR' };
        },
        Opcode_op_DIVC(arg0) {
            return { kind: 'simple', name: 'DIVC' };
        },
        Opcode_op_MOD(arg0) {
            return { kind: 'simple', name: 'MOD' };
        },
        Opcode_op_DIVMOD(arg0) {
            return { kind: 'simple', name: 'DIVMOD' };
        },
        Opcode_op_DIVMODR(arg0) {
            return { kind: 'simple', name: 'DIVMODR' };
        },
        Opcode_op_DIVMODC(arg0) {
            return { kind: 'simple', name: 'DIVMODC' };
        },
        Opcode_op_RSHIFTR(arg0) {
            return { kind: 'simple', name: 'RSHIFTR' };
        },
        Opcode_op_RSHIFTC(arg0) {
            return { kind: 'simple', name: 'RSHIFTC' };
        },
        Opcode_op_MULDIV(arg0) {
            return { kind: 'simple', name: 'MULDIV' };
        },
        Opcode_op_MULDIVR(arg0) {
            return { kind: 'simple', name: 'MULDIVR' };
        },
        Opcode_op_MULMOD(arg0) {
            return { kind: 'simple', name: 'MULMOD' };
        },
        Opcode_op_MULDIVMOD(arg0) {
            return { kind: 'simple', name: 'MULDIVMOD' };
        },
        Opcode_op_MULDIVMODR(arg0) {
            return { kind: 'simple', name: 'MULDIVMODR' };
        },
        Opcode_op_MULDIVMODC(arg0) {
            return { kind: 'simple', name: 'MULDIVMODC' };
        },
        Opcode_op_MULRSHIFT(arg0) {
            return { kind: 'simple', name: 'MULRSHIFT' };
        },
        Opcode_op_MULRSHIFTR(arg0) {
            return { kind: 'simple', name: 'MULRSHIFTR' };
        },
        Opcode_op_MULRSHIFTC(arg0) {
            return { kind: 'simple', name: 'MULRSHIFTC' };
        },
        Opcode_op_LSHIFTDIV(arg0) {
            return { kind: 'simple', name: 'LSHIFTDIV' };
        },
        Opcode_op_LSHIFTDIVR(arg0) {
            return { kind: 'simple', name: 'LSHIFTDIVR' };
        },
        Opcode_op_LSHIFTDIVC(arg0) {
            return { kind: 'simple', name: 'LSHIFTDIVC' };
        },
        Opcode_op_LSHIFT(arg0) {
            return { kind: 'simple', name: 'LSHIFT' };
        },
        Opcode_op_RSHIFT(arg0) {
            return { kind: 'simple', name: 'RSHIFT' };
        },
        Opcode_op_POW2(arg0) {
            return { kind: 'simple', name: 'POW2' };
        },
        Opcode_op_AND(arg0) {
            return { kind: 'simple', name: 'AND' };
        },
        Opcode_op_OR(arg0) {
            return { kind: 'simple', name: 'OR' };
        },
        Opcode_op_XOR(arg0) {
            return { kind: 'simple', name: 'XOR' };
        },
        Opcode_op_NOT(arg0) {
            return { kind: 'simple', name: 'NOT' };
        },
    });
}