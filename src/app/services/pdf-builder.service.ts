import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { debounceTime, map, shareReplay } from "rxjs/operators";
import { Element, RootPDF } from "../elements/band";

@Injectable({ providedIn: "root" })
export class PdfBuilder {

    public get data(): Element[] { return this.dataChange.value; }

    public readonly dataChange = new BehaviorSubject<Element[]>([]);

    public readonly outputTemplate = this.dataChange.pipe(
        debounceTime(5),
        map((arr) => ({ key: "root", elements: arr } as RootPDF)),
        shareReplay(1),
    );

    public setCurrentPdf(pdf: Element) {
        this.dataChange.next(pdf.elements);
    }

    public insertItem(parent: Element, inserting: Element): Element {
        if (!parent.elements) {
            parent.elements = [];
        }
        parent.elements.push(inserting);
        this.dataChange.next(this.data);
        return inserting;
    }

    public insertItemAsSibling(sibling: Element, inserting: Element, where: "above" | "below"): Element {
        const parent = this.getParent(sibling);

        if (parent == null) {
            console.warn(`Sibling does not have a parent, cannot insert ${where}`);
            return null;
        }

        const siblingIndex = parent.elements.indexOf(sibling);
        const insertIndex = siblingIndex + (where === "below" ? 1 : 0);
        parent.elements.splice(insertIndex, 0, inserting);
        this.dataChange.next(this.data);
        return inserting;
    }

    public getParent(searching: Element, root?: Element): Element {

        if (!root) {
            root = { key: "root", elements: this.data };
        }

        if (!root.elements || root.elements.length === 0) {
            return undefined;
        }

        return root.elements.find((child) => child === searching) ?
            root :
            root.elements
                .map((child) => this.getParent(searching, child))
                .find((parent) => !!parent);

    }

    public deleteItem(deleting: Element, nodes?: Element[]): boolean {

        if (!nodes) {
            nodes = this.data;
        }

        const index = nodes.indexOf(deleting);

        if (index !== -1) {
            nodes.splice(index, 1);
            this.dataChange.next(this.data);
            return true;
        } else {
            return nodes
                .map((node) => node.elements && node.elements.length > 0 ?
                    this.deleteItem(deleting, node.elements) :
                    false)
                .some((result) => !!result);
        }

    }

    public moveItem(moving: Element, newParent: Element): Element {
        return this.deleteItem(moving) ?
            this.insertItem(newParent, moving) :
            null;
    }

    public moveItemSibling(moving: Element, newSibling: Element, where: "above" | "below"): Element {
        return this.deleteItem(moving) ?
            this.insertItemAsSibling(newSibling, moving, where) :
            null;
    }

}
