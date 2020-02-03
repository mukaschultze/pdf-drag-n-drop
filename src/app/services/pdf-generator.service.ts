import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import { Element, RootPDF } from "../elements/band";

export interface Node {
    elements: Node[];
    item: Element;
}

export interface FlatNode {
    item: Element;
    level: number;
    expandable: boolean;
}

@Injectable({ providedIn: "root" })
export class PdfBuilder {

    public dataChange = new BehaviorSubject<Node[]>([]);

    public outputTemplate = this.dataChange.pipe(
        debounceTime(5),
        map((arr) => arr.map((n) => this.node2Element(n))),
        map((arr) => ({ key: "root", elements: arr } as RootPDF)),
    );

    get data(): Node[] { return this.dataChange.value; }

    public setCurrentPdf(pdf: Element) {
        const data = this.element2Node(pdf);
        this.dataChange.next(data.elements);
    }

    public element2Node(item: Element): Node {
        return {
            item,
            elements: (item.elements || []).map((c) => this.element2Node(c)),
        };
    }

    public node2Element(node: Node): Element {
        if (!node) {
            return undefined;
        }

        if (node.item.key === "content") {
            console.log(node);
        }

        return {
            ...node.item,
            elements: (node.elements || []).map((c) => this.node2Element(c)),
        };
    }

    /** Add an item to to-do list */
    public insertItem(parent: Node, item: Element): Node {
        if (!parent.elements) {
            parent.elements = [];
        }
        const newItem = this.element2Node(item);
        parent.elements.push(newItem);
        this.dataChange.next(this.data);
        return newItem;
    }

    public insertItemAbove(node: Node, item: Element): Node {
        const parentNode = this.getParentFromNodes(node);
        const newItem = this.element2Node(item);
        if (parentNode != null) {
            parentNode.elements.splice(parentNode.elements.indexOf(node), 0, newItem);
        } else {
            this.data.splice(this.data.indexOf(node), 0, newItem);
        }
        this.dataChange.next(this.data);
        return newItem;
    }

    public insertItemBelow(node: Node, item: Element): Node {
        const parentNode = this.getParentFromNodes(node);
        const newItem = this.element2Node(item);
        if (parentNode != null) {
            parentNode.elements.splice(parentNode.elements.indexOf(node) + 1, 0, newItem);
        } else {
            this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
        }
        this.dataChange.next(this.data);
        return newItem;
    }

    public getParentFromNodes(node: Node): Node {
        for (const currentRoot of this.data) {
            const parent = this.getParent(currentRoot, node);
            if (parent != null) {
                return parent;
            }
        }
        return null;
    }

    public getParent(currentRoot: Node, node: Node): Node {
        if (currentRoot.elements && currentRoot.elements.length > 0) {
            for (const child of currentRoot.elements) {
                if (child === node) {
                    return currentRoot;
                } else if (child.elements && child.elements.length > 0) {
                    const parent = this.getParent(child, node);
                    if (parent != null) {
                        return parent;
                    }
                }
            }
        }
        return null;
    }

    public updateItem(node: Node, item: Element) {
        node.item = item;
        this.dataChange.next(this.data);
    }

    public deleteItem(node: Node) {
        this.deleteNode(this.data, node);
        this.dataChange.next(this.data);
    }

    public copyPasteItem(from: Node, to: Node): Node {
        const newItem = this.insertItem(to, from.item);
        if (from.elements) {
            from.elements.forEach((child) => {
                this.copyPasteItem(child, newItem);
            });
        }
        return newItem;
    }

    public copyPasteItemAbove(from: Node, to: Node): Node {
        const newItem = this.insertItemAbove(to, from.item);
        if (from.elements) {
            from.elements.forEach((child) => {
                this.copyPasteItem(child, newItem);
            });
        }
        return newItem;
    }

    public copyPasteItemBelow(from: Node, to: Node): Node {
        const newItem = this.insertItemBelow(to, from.item);
        if (from.elements) {
            from.elements.forEach((child) => {
                this.copyPasteItem(child, newItem);
            });
        }
        return newItem;
    }

    public deleteNode(nodes: Node[], nodeToDelete: Node) {
        const index = nodes.indexOf(nodeToDelete, 0);
        if (index > -1) {
            nodes.splice(index, 1);
        } else {
            nodes.forEach((node) => {
                if (node.elements && node.elements.length > 0) {
                    this.deleteNode(node.elements, nodeToDelete);
                }
            });
        }
    }
}
