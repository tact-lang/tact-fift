import { beginCell, Builder, Cell } from "ton-core";

export class ContinuationBuilder {
    builders: Builder[];

    constructor(src: Builder) {
        this.builders = [src];
    }

    get availableBits() {
        return this.builders[this.builders.length - 1].availableBits;
    }

    get availableRefs() {
        return this.builders[this.builders.length - 1].availableRefs - 1;
    }

    advance() {
        let b = beginCell();
        this.builders.push(b);
    }

    store(bytes: Buffer, refs?: Cell[]) {
        let b = this.builders[this.builders.length - 1];
        if (b.availableBits < bytes.length * 8 || (refs && (b.availableRefs - 1) < refs.length)) {
            this.advance();
            b = this.builders[this.builders.length - 1]
        }
        b.storeBuffer(bytes);
        if (refs) {
            for (let r of refs) {
                b.storeRef(r);
            }
        }
    }

    complete() {
        let builder = this.builders[0];
        for (let i = 1; i < this.builders.length; i++) {
            let b = this.builders[i];
            builder.storeRef(b.endCell());
        }
        return builder.endCell();
    }
}