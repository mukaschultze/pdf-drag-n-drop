import { FlatTreeControl } from "@angular/cdk/tree";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree";
import { FlatNode, Node, PdfBuilder } from "../services/pdf-builder.service";

@Component({
    selector: "pdf-tree",
    templateUrl: "pdf-tree.component.html",
    styleUrls: ["pdf-tree.component.scss"],
})
export class PdfTreeComponent {

    public treeControl: FlatTreeControl<FlatNode>;
    public dataSource: MatTreeFlatDataSource<Node, FlatNode>;

    public dragNodeExpandOverNode: FlatNode;
    public dragNodeExpandOverArea: "above" | "below" | "center";

    private flatNodeMap = new Map<FlatNode, Node>();
    private nestedNodeMap = new Map<Node, FlatNode>();
    private treeFlattener: MatTreeFlattener<Node, FlatNode>;

    private dragNode: FlatNode;
    private dragNodeExpandOverWaitTimeMs = 300;
    private dragNodeExpandOverTime: number;

    @ViewChild("emptyItem", { static: true })
    private emptyItem: ElementRef;

    constructor(
        private database: PdfBuilder,
    ) {
        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<FlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        database.dataChange.subscribe((data) => {
            this.dataSource.data = [];
            this.dataSource.data = data;
        });
    }

    public getLevel = (node: FlatNode) => node.level;

    public isExpandable = (node: FlatNode) => node.expandable;

    public getChildren = (node: Node): Node[] => node.elements;

    public hasChild = (_: number, nodeData: FlatNode) => nodeData.expandable;

    // Transformer to convert nested node to flat node. Record the nodes in maps for later use.
    public transformer = (node: Node, level: number) => {
        const existingNode = this.nestedNodeMap.get(node);
        const flatNode = existingNode && existingNode.item === node.item
            ? existingNode
            : {} as FlatNode;
        flatNode.item = node.item;
        flatNode.level = level;
        flatNode.expandable = (node.elements && node.elements.length > 0);
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    }

    public addNewItem(node: FlatNode) {
        const parentNode = this.flatNodeMap.get(node);
        // this.database.insertItem(parentNode, "");
        this.treeControl.expand(node);
    }

    public handleDragStart(event: DragEventInit, node: FlatNode) {
        // Required by Firefox (https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
        event.dataTransfer.setData("foo", "bar");
        event.dataTransfer.setDragImage(this.emptyItem.nativeElement, 0, 0);
        this.dragNode = node;
        this.treeControl.collapse(node);
    }

    public handleDragOver(event: DragEvent, node: FlatNode) {
        event.preventDefault();

        // Handle node expand
        if (node === this.dragNodeExpandOverNode) {
            if (this.dragNode !== node && !this.treeControl.isExpanded(node)) {
                if ((new Date().getTime() - this.dragNodeExpandOverTime) > this.dragNodeExpandOverWaitTimeMs) {
                    this.treeControl.expand(node);
                }
            }
        } else {
            this.dragNodeExpandOverNode = node;
            this.dragNodeExpandOverTime = new Date().getTime();
        }

        // Handle drag area
        const percentageX = event.offsetX / (event.target as HTMLElement).clientWidth;
        const percentageY = event.offsetY / (event.target as HTMLElement).clientHeight;

        if (percentageY < 0.25) {
            this.dragNodeExpandOverArea = "above";
        } else if (percentageY > 0.75) {
            this.dragNodeExpandOverArea = "below";
        } else {
            this.dragNodeExpandOverArea = "center";
        }
    }

    public handleDrop(event: DragEvent, node: FlatNode) {
        event.preventDefault();
        if (node !== this.dragNode) {
            let newItem: Node;

            switch (this.dragNodeExpandOverArea) {
                case "above":
                    newItem = this.database.copyPasteItemAbove(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
                    break;
                case "below":
                    newItem = this.database.copyPasteItemBelow(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
                    break;
                case "center":
                    newItem = this.database.copyPasteItem(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
                    break;
                default:
                    console.error(`Invalid dragNodeExpandOverArea ${this.dragNodeExpandOverArea}`);
                    break;
            }

            if (newItem) {
                this.database.deleteItem(this.flatNodeMap.get(this.dragNode));
                this.treeControl.expandDescendants(this.nestedNodeMap.get(newItem));
            }
        }
        this.dragNode = null;
        this.dragNodeExpandOverNode = null;
        this.dragNodeExpandOverTime = 0;
    }

    public handleDragEnd(event: DragEvent) {
        this.dragNode = null;
        this.dragNodeExpandOverNode = null;
        this.dragNodeExpandOverTime = 0;
    }
}
