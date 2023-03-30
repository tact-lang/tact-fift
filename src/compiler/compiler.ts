import { beginCell, Builder, Cell, Dictionary, DictionaryValue } from "ton-core";
import { FunctionDeclaration, FunctionImplementation, Instruction, Program } from "../grammar/fift";
import { opcodes } from "./opcodes";

export function compile(source: Program): Cell {

    // Create function dictionary
    let dict = Dictionary.empty<number, Cell>(Dictionary.Keys.Int(19), createCodeCell());

    // Compile functions
    let functionImplementation = source.definitions.filter(d => d.kind === 'function_implementation') as FunctionImplementation[];
    let implMap = new Map<string, FunctionImplementation>();
    for (let f of functionImplementation) {
        if (implMap.has(f.name)) {
            throw Error(`Duplicate function implementation: ${f.name}`);
        }
        implMap.set(f.name, f);
    }
    let functionDeclarations = source.definitions.filter(d => d.kind === 'function_declaration') as FunctionDeclaration[];
    let functionCount = 0;
    for (let def of functionDeclarations) {

        // Resolve id
        let resolvedId: number;
        if (def.id !== null) {
            resolvedId = def.id;
        } else if (def.name === 'main' || def.name === 'recv_internal') {
            resolvedId = 0;
        } else if (def.name === 'recv_external') {
            resolvedId = -1;
        } else if (def.name === 'run_ticktock') {
            resolvedId = -2;
        } else if (def.name === 'split_prepare') {
            resolvedId = -3;
        } else if (def.name === 'split_install') {
            resolvedId = -4;
        } else {
            resolvedId = functionCount++;
        }

        // Compile function
        let impl = implMap.get(def.name);
        if (!impl) {
            throw Error(`Function implementation not found: ${def.name}`);
        }
        let builder = beginCell();
        builder.storeUint(0, PADDING_ZERO_BITS);
        compileBody(builder, impl.instructions);
        dict.set(resolvedId, builder.endCell());
    }

    // Serialize dict
    let dictBuilder = beginCell();
    dict.storeDirect(dictBuilder);
    let dictCell = dictBuilder.endCell();

    // Common header
    let builder = beginCell();
    builder.storeUint(0xFF00, 16); // SETCP0
    builder.storeUint(0xF4A413, 24); // 19 DICTPUSHCONST
    builder.storeUint(0xF4BC, 16); // DICTIGETJMPZ
    builder.storeUint(0xf2c80B, 24); // 11 THROWARG
    builder.storeRef(dictCell);
    return builder.endCell()
}

function compileBody(builder: Builder, instructions: Instruction[]) {
    for (let inst of instructions) {

        // Store simple opcode
        if (inst.kind === 'simple') {
            let v = opcodes.opcodeMap.get(inst.name);
            if (!v || v.kind !== 'single') {
                throw Error(`Unknown opcode: ${inst.name}`);
            }
            let bytes = Buffer.from(v.code, 'hex');
            builder.storeBuffer(bytes);
            continue;
        }

        // Store opcode with int argument
    }
}

// Adding artificial padding to the begining of the cell before trying
// to serialize it. This is needed because the leaf of the dict could be in the same 
// cell
const PADDING_ZERO_BITS = 32;

function createCodeCell(): DictionaryValue<Cell> {
    return {
        serialize: (src, builder) => {
            let withoutPadding = src.beginParse().skip(PADDING_ZERO_BITS)
            builder.storeSlice(withoutPadding);
        },
        parse: (src) => {
            throw Error("Not implemented");
        }
    };
}