import fiftGrammar from './fift.ohm-bundle';
import { Opcode, registerOpcodes } from './fift.opcodes';

export type Program = {
    definitions: ProgramItem[]
};

type ProgramItem = FunctionDeclaration | FunctionImplementation;

export type FunctionDeclaration = {
    kind: 'function_declaration',
    name: string,
    id: number | null
};

export type FunctionImplementation = {
    kind: 'function_implementation',
    type: 'generic' | 'inline' | 'ref'
    name: string,
    instructions: Instruction[]
}

export type Instruction = Opcode;

//
// Semantics
//

const semantics = fiftGrammar.createSemantics();

semantics.addOperation('resolve_program', {
    Program(arg0, arg1, arg2) {
        return {
            definitions: arg1.children.map((v) => v.resolve_program_item())
        };
    },
});

semantics.addOperation<ProgramItem>('resolve_program_item', {
    FunctionDeclaration_simple(arg0, arg1) {
        return {
            kind: 'function_declaration',
            name: arg1.sourceString,
            id: null
        };
    },
    FunctionDeclaration_exported(arg0, arg1, arg2) {
        return {
            kind: 'function_declaration',
            name: arg2.sourceString,
            id: parseInt(arg0.sourceString)
        };
    },
    FunctionImplementation_generic(arg0, arg1, arg2, arg3, arg4) {
        return {
            kind: 'function_implementation',
            type: 'generic',
            name: arg0.sourceString,
            instructions: arg3.children.map((v) => v.resolve_instruction())
        }
    },
});

semantics.addOperation<Instruction>('resolve_instruction', {
    Instruction_opcode(arg0) {
        return arg0.resolve_opcode();
    },
})

registerOpcodes(semantics);

//
// Parsing
//

export function parse(src: string) {
    let matchResult = fiftGrammar.match(src);
    if (matchResult.failed()) {
        throw new Error(matchResult.message);
    }
    return semantics(matchResult).resolve_program() as Program;
}