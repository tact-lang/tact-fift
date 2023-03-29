import fs from 'fs';
import path from 'path';
import { opcodes } from "../src/grammar/opcodes";
import { normalizeName } from '../src/utils/normalizeName';

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

// Create resolvers