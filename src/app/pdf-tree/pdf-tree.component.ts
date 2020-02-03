import { SelectionModel } from "@angular/cdk/collections";
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
    /** Map from flat node to nested node. This helps us finding the nested node to be modified */
    public flatNodeMap = new Map<FlatNode, Node>();

    /** Map from nested node to flattened node. This helps us to keep the same object for selection */
    public nestedNodeMap = new Map<Node, FlatNode>();

    /** A selected parent node to be inserted */
    public selectedParent: FlatNode | null = null;

    /** The new item's name */
    public newItemName = "";

    public treeControl: FlatTreeControl<FlatNode>;

    public treeFlattener: MatTreeFlattener<Node, FlatNode>;

    public dataSource: MatTreeFlatDataSource<Node, FlatNode>;

    /** The selection for checklist */
    public checklistSelection = new SelectionModel<FlatNode>(true /* multiple */);

    /* Drag and drop */
    public dragNode: any;
    public dragNodeExpandOverWaitTimeMs = 300;
    public dragNodeExpandOverNode: any;
    public dragNodeExpandOverTime: number;
    public dragNodeExpandOverArea: string;

    @ViewChild("emptyItem", { static: true })
    public emptyItem: ElementRef;

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

    /**
     * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
     */
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

    /** Whether all the descendants of the node are selected */
    public descendantsAllSelected(node: FlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        return descendants.every((child) => this.checklistSelection.isSelected(child));
    }

    /** Whether part of the descendants are selected */
    public descendantsPartiallySelected(node: FlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some((child) => this.checklistSelection.isSelected(child));
        return result && !this.descendantsAllSelected(node);
    }

    /** Toggle the to-do item selection. Select/deselect all the descendants node */
    public todoItemSelectionToggle(node: FlatNode): void {
        this.checklistSelection.toggle(node);
        const descendants = this.treeControl.getDescendants(node);
        this.checklistSelection.isSelected(node)
            ? this.checklistSelection.select(...descendants)
            : this.checklistSelection.deselect(...descendants);
    }

    /** Select the category so we can insert the new item. */
    public addNewItem(node: FlatNode) {
        const parentNode = this.flatNodeMap.get(node);
        // this.database.insertItem(parentNode, "");
        this.treeControl.expand(node);
    }

    public handleDragStart(event, node) {
        // Required by Firefox (https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
        event.dataTransfer.setData("foo", "bar");
        event.dataTransfer.setDragImage(this.emptyItem.nativeElement, 0, 0);
        this.dragNode = node;
        this.treeControl.collapse(node);
    }

    public handleDragOver(event, node) {
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
        const percentageX = event.offsetX / event.target.clientWidth;
        const percentageY = event.offsetY / event.target.clientHeight;
        if (percentageY < 0.25) {
            this.dragNodeExpandOverArea = "above";
        } else if (percentageY > 0.75) {
            this.dragNodeExpandOverArea = "below";
        } else {
            this.dragNodeExpandOverArea = "center";
        }
    }

    public handleDrop(event, node) {
        event.preventDefault();
        if (node !== this.dragNode) {
            let newItem: Node;
            if (this.dragNodeExpandOverArea === "above") {
                newItem = this.database.copyPasteItemAbove(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
            } else if (this.dragNodeExpandOverArea === "below") {
                newItem = this.database.copyPasteItemBelow(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
            } else {
                newItem = this.database.copyPasteItem(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
            }
            this.database.deleteItem(this.flatNodeMap.get(this.dragNode));
            this.treeControl.expandDescendants(this.nestedNodeMap.get(newItem));
        }
        this.dragNode = null;
        this.dragNodeExpandOverNode = null;
        this.dragNodeExpandOverTime = 0;
    }

    public handleDragEnd(event) {
        this.dragNode = null;
        this.dragNodeExpandOverNode = null;
        this.dragNodeExpandOverTime = 0;
    }
}
