import {SliceableText} from "../Interface/SliceableText";
import {TreeNode} from "../../Public/Base/TreeNode";
import {Sliceable} from "../Interface/Sliceable";
import {fromEvent, Observable} from "rxjs";
import {EventEmitter} from "events";
import {Destroyable} from "../../Public/Interface/Destroyable";

/**
 * 文本切片
 */
export class TextSlice extends TreeNode implements SliceableText, Destroyable {
    afterDestruct$: Observable<TextSlice> = null;
    private eventEmitter = new EventEmitter();

    constructor(public parent: Sliceable & TreeNode,
                protected startIndexInParent: number,
                protected endIndexInParent: number,
                children: Array<TextSlice> = []) {
        super(parent, children);
        this.afterDestruct$ = fromEvent(this.eventEmitter, 'afterDestruct');
    }

    get globalStartIndex() {
        if (this.parent instanceof TextSlice) {
            return this.parent.globalStartIndex + this.startIndexInParent;
        } else {
            return this.startIndexInParent;
        }
    }

    get length(): number {
        return this.endIndexInParent - this.startIndexInParent;
    }

    toString(): string {
        return this.parent.slice(this.startIndexInParent, this.endIndexInParent);
    }

    get globalEndIndex() {
        return this.globalStartIndex + this.length;
    }

    slice(startIndex: number, endIndex: number): string {
        return this.parent.slice(startIndex + this.startIndexInParent, endIndex + this.startIndexInParent);
    }

    toGlobalIndex(localIndex: number) {
        if (localIndex > this.length) {
            throw RangeError(`Cannot convert ${localIndex} to globalIndex! Out of bound!`);
        }
        return localIndex + this.globalStartIndex;
    }

    swallow(other: TextSlice) {
        if (other.startIndexInParent < this.endIndexInParent) {
            throw RangeError("Can not swallow a TextSlice not next to this!");
        }
        this.endIndexInParent = other.endIndexInParent;
        for (let child of other.children) {
            (child as TextSlice).startIndexInParent += other.startIndexInParent - this.startIndexInParent;
            (child as TextSlice).endIndexInParent += other.startIndexInParent - this.startIndexInParent;
            child.parent = this;
        }
        this.children = this.children.concat(other.children);
        other.destructor();
    }

    swallowArray(others: Array<TextSlice>) {
        for (let other of others) {
            this.swallow(other);
        }
    }

    destructor() {
        this.eventEmitter.emit('afterDestruct');
    }
}