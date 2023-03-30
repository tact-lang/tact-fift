import { beginCell, Builder } from "ton-core";

export class ContinuationBuilder {
    builders: Builder[];

    constructor(src: Builder) {
        this.builders = [src];
    }

    store(bytes: Buffer) {
        let b = this.builders[this.builders.length - 1];
        if (b.availableBits < bytes.length * 8) {
            b = beginCell();
            this.builders.push(b);
        }
        b.storeBuffer(bytes);
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