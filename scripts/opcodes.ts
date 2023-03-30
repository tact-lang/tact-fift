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
        rules.push(`"${op.name}"` + ' -- op_' + normalizeName(op.name));
        for (let alias of op.aliases) {
            rules.push(`"${alias}"` + ' -- op_' + normalizeName(alias));
        }
    }
    if (op.kind === 'int') {
        rules.push(`integerLiteral "${op.name}"` + ' -- op_' + normalizeName(op.name));
        for (let alias of op.aliases) {
            rules.push(`integerLiteral "${alias}"` + ' -- op_' + normalizeName(alias));
        }
    }
    if (op.kind === 'ref') {
        rules.push(`cellLiteral "${op.name}"` + ' -- op_' + normalizeName(op.name));
        for (let alias of op.aliases) {
            rules.push(`cellLiteral "${alias}"` + ' -- op_' + normalizeName(alias));
        }
    }
}

// Insert rules
const padding = 11;
let prepared = rules.join(`\n${' '.repeat(padding)}| `);
let grammar = baseGrammar.replace('Opcode = ""', 'Opcode = ' + prepared);
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
                for (let alias of op.aliases) {
                    writer.append(`Opcode_op_${normalizeName(alias)}(arg0) {`);
                    writer.inIndent(() => {
                        writer.append(`return { kind: 'simple', name: '${op.name}' };`);
                    });
                    writer.append(`},`);
                }
            }

            if (op.kind === 'int') {
                writer.append(`Opcode_op_${normalizeName(op.name)}(arg0, arg1) {`);
                writer.inIndent(() => {
                    writer.append(`return { kind: 'int', name: '${op.name}', arg: BigInt(arg0.sourceString) };`);
                });
                writer.append(`},`);
                for (let alias of op.aliases) {
                    writer.append(`Opcode_op_${normalizeName(alias)}(arg0, arg1) {`);
                    writer.inIndent(() => {
                        writer.append(`return { kind: 'int', name: '${op.name}', arg: BigInt(arg0.sourceString) };`);
                    });
                    writer.append(`},`);
                }
            }
        }
    });
    writer.append(`});`);
});
writer.append('}');

fs.writeFileSync(path.resolve(__dirname, '..', 'src', 'grammar', 'fift.opcodes.ts'), writer.end());