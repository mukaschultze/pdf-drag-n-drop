import { FlatTreeControl } from "@angular/cdk/tree";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree";
import { Element } from "../elements/band";
import { PdfBuilder } from "../services/pdf-builder.service";

const EXPAND_HOLD_MS = 300;

interface NodeContext {
    item: Element;
    level: number;
    expandable: boolean;
}

@Component({
    selector: "pdf-tree",
    templateUrl: "pdf-tree.component.html",
    styleUrls: ["pdf-tree.component.scss"],
})
export class PdfTreeComponent {

    public treeControl: FlatTreeControl<Element>;
    public dataSource: MatTreeFlatDataSource<Element, Element>;

    public dragContext?: {
        dragNode: Element,
        overNode?: Element,
        holdTime?: number,
        area?: "above" | "below" | "center",
    };

    private contextMap = new Map<Element, NodeContext>();
    private treeFlattener: MatTreeFlattener<Element, Element>;

    @ViewChild("emptyItem", { static: true })
    private emptyItem: ElementRef;

    constructor(
        private database: PdfBuilder,
    ) {
        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<Element>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        database.dataChange.subscribe((data) => {
            this.dataSource.data = [];
            this.dataSource.data = data;
        });
    }

    public getLevel = (node: Element) => this.contextMap.get(node).level;

    public isExpandable = (node: Element) => this.contextMap.get(node).expandable;

    public getChildren = (node: Element) => node.elements;

    public hasChild = (_: number, node: Element) => this.contextMap.get(node).expandable;

    // Transformer to convert nested node to flat node. Record the nodes in maps for later use.
    public transformer = (node: Element, level: number) => {

        const context = {
            level,
            expandable: node.elements && node.elements.length > 0,
        } as NodeContext;

        this.contextMap.set(node, context);

        return node;
    }

    public addNewItem(node: Element) {
        const parentNode = node;
        // this.database.insertItem(parentNode, "");
        this.treeControl.expand(node);
    }

    public handleDragStart(event: DragEventInit, dragNode: Element) {
        // Required by Firefox (https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
        event.dataTransfer.setData("foo", "bar");
        event.dataTransfer.setDragImage(this.emptyItem.nativeElement, 0, 0);

        this.dragContext = { dragNode };
        this.treeControl.collapse(dragNode);
    }

    public handleDragOver(event: DragEvent, node: Element) {
        event.preventDefault();

        if (node === this.dragContext.overNode) {
            if (this.dragContext.dragNode !== node && !this.treeControl.isExpanded(node)) {
                if ((new Date().getTime() - this.dragContext.holdTime) > EXPAND_HOLD_MS) {
                    this.treeControl.expand(node);
                }
            }
        } else {
            this.dragContext.overNode = node;
            this.dragContext.holdTime = new Date().getTime();
        }

        const target = event.target as HTMLElement;
        const percentageY = event.offsetY / target.clientHeight;

        if (percentageY < 0.25) {
            this.dragContext.area = "above";
        } else if (percentageY > 0.75) {
            this.dragContext.area = "below";
        } else {
            this.dragContext.area = "center";
        }
    }

    public handleDrop(event: DragEvent, node: Element) {
        event.preventDefault();

        if (node !== this.dragContext.dragNode) {
            let moved: Element;

            switch (this.dragContext.area) {
                case "above":
                case "below":
                    moved = this.database.moveItemSibling(this.dragContext.dragNode, node, this.dragContext.area as any);
                    break;
                case "center":
                    moved = this.database.moveItem(this.dragContext.dragNode, node);
                    break;
            }

            if (moved) {
                this.treeControl.expandDescendants(moved);
            } else {
                console.warn(`Failed to move item ${node.key}`);
            }
        }

        this.dragContext = undefined;
    }

    public handleDragEnd(event: DragEvent) {
        this.dragContext = undefined;
    }
}
