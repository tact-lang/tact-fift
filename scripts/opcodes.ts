import fs from 'fs';
import path from 'path';
import { opcodes } from "../src/compiler/opcodes";
import { normalizeName } from '../src/utils/normalizeName';
import { Writer } from '../src/utils/Writer';

const baseGrammar = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'grammar', 'fift.base.ohm'), 'utf8');

// Create rules
let rules: string[] = [];
for (let op of opcodes.opcodes) {
    if (op.kind === 'single') {
        rules.push(`op_${normalizeName(op.name)}` + ' -- op_' + normalizeName(op.name));
    }
    if (op.kind === 'int') {
        rules.push(`integerLiteral op_${normalizeName(op.name)}` + ' -- op_' + normalizeName(op.name));
    }
    if (op.kind === 'ref') {
        rules.push(`cellLiteral op_${normalizeName(op.name)}` + ' -- op_' + normalizeName(op.name));
    }
}

let opcodesDefs: string[] = [];
for (let op of opcodes.opcodes) {
    let def = [op.name, ...op.aliases].map((v) => `"${v}"`).join(' | ');
    opcodesDefs.push(`op_${normalizeName(op.name)} = (${def}) ~idPart`);
}

// Insert rules
const padding = 11;
let prepared = 'Opcode = ' + rules.join(`\n${' '.repeat(padding)}| `) + '\n\n' + opcodesDefs.map((v) => ' '.repeat(4) + v).join('\n');
let grammar = baseGrammar.replace('Opcode = ""', prepared);
fs.writeFileSync(path.resolve(__dirname, '..', 'src', 'grammar', 'fift.ohm'), grammar);

// Create types
let writer = new Writer();
writer.append(`import { Cell } from 'ton-core';`);
writer.append(`import { FiftSemantics } from './fift.ohm-bundle'`);
writer.append('export type Opcode =');
writer.inIndent(() => {
    for (let op of opcodes.opcodes) {
        if (op.kind === 'single') {
            writer.append(`| { kind: 'simple', name: '${op.name}' }`);
        }
        if (op.kind === 'int') {
            writer.append(`| { kind: 'int', name: '${op.name}', arg: bigint }`);
        }
        if (op.kind === 'ref') {
            writer.append(`| { kind: 'ref', name: '${op.name}', arg: Cell }`);
        }
    }
    writer.append(';');
});

// Create resolvers
writer.append();
writer.append('export function registerOpcodes(semantics: FiftSemantics) {');
writer.inIndent(() => {
    writer.append(`semantics.addOperation<Opcode>('resolve_opcode', {`);
    writer.inIndent(() => {
        for (let op of opcodes.opcodes) {
            if (op.kind === 'single') {
                writer.append(`Opcode_op_${normalizeName(op.name)}(arg0) {`);
                writer.inIndent(() => {
                    writer.append(`return { kind: 'simple', name: '${op.name}' };`);
                });
                writer.append(`},`);
            }

            if (op.kind === 'int') {
                writer.append(`Opcode_op_${normalizeName(op.name)}(arg0, arg1) {`);
                writer.inIndent(() => {
                    writer.append(`return { kind: 'int', name: '${op.name}', arg: BigInt(arg0.sourceString) };`);
                });
                writer.append(`},`);
            }

            if (op.kind === 'ref') {
                writer.append(`Opcode_op_${normalizeName(op.name)}(arg0, arg1) {`);
                writer.inIndent(() => {
                    writer.append(`return { kind: 'ref', name: '${op.name}', arg: arg0.resolve_cell() };`);
                });
                writer.append(`},`);
            }
        }
    });
    writer.append(`});`);
});
writer.append('}');

fs.writeFileSync(path.resolve(__dirname, '..', 'src', 'grammar', 'fift.opcodes.ts'), writer.end());