import { NestedTreeControl } from "@angular/cdk/tree";
import { Component, OnDestroy, OnInit, Type } from "@angular/core";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { Subscription } from "rxjs";
import * as elements from "../elements/band";
import { NodesService } from "../services/nodes.service";
import { PdfGeneratorService } from "../services/pdf-generator.service";

@Component({
    selector: "pdf-tree",
    templateUrl: "pdf-tree.component.html",
    styleUrls: ["pdf-tree.component.scss"],
})
export class PdfTreeComponent implements OnInit, OnDestroy {

    public treeControl = new NestedTreeControl<elements.Element>((node) => (node as elements.InternalElement).elements || []);
    public dataSource = new MatTreeNestedDataSource<elements.Element>();

    private subscriptions = new Subscription();

    constructor(
        private pdfService: PdfGeneratorService,
        private nodes: NodesService,
    ) { }

    public ngOnInit() {
        this.subscriptions.add(
            this.pdfService.currentPdf.subscribe((pdf) => {
                // https://stackoverflow.com/questions/50976766/how-to-update-nested-mat-tree-dynamically
                // this.dataSource.data = [null];
                // this.dataSource.data = [pdf];
                this.dataSource.data = [pdf];
                this.treeControl.expand(pdf);
            }),
        );
    }

    public ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    public hasChild = (_: number, node: elements.InternalElement) => !!node.elements && node.elements.length > 0;

    public onItemDrop(node: elements.Element, { dragData: draggedType }: { dragData: Type<elements.Element> }) {
        this.pdfService.addChildNode(node, new draggedType());
    }

    public isDropAllowed = (node: elements.Element) => {
        return true;
    }

    public getNodeForElement(element: elements.Element) {
        return this.nodes.getNodeForKey(element.key);
    }

    public getProps(node: elements.Element) {

        const bannedKeys = [
            "key",
            "elements",
        ];

        return Object.entries(node)
            .filter(([key]) => !bannedKeys.find((banned) => banned === key))
            .map(([key, value]) => ({ key, value }));
    }

}
