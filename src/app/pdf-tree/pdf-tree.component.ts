import { NestedTreeControl } from "@angular/cdk/tree";
import { Component, OnDestroy, OnInit, Type } from "@angular/core";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { Subscription } from "rxjs";
import { PdfElement } from "../elements/pdf-element";
import { PdfGeneratorService } from "../services/pdf-generator.service";

@Component({
    selector: "pdf-tree",
    templateUrl: "pdf-tree.component.html",
    styleUrls: ["pdf-tree.component.scss"],
})
export class PdfTreeComponent implements OnInit, OnDestroy {

    public treeControl = new NestedTreeControl<PdfElement>((node) => node.children);
    public dataSource = new MatTreeNestedDataSource<PdfElement>();

    private subscriptions = new Subscription();

    constructor(
        private pdfService: PdfGeneratorService,
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

    public hasChild = (_: number, node: PdfElement) => !!node.children && node.children.length > 0;

    public onItemDrop(node: PdfElement, { dragData: draggedType }: { dragData: Type<PdfElement> }) {
        this.pdfService.addChildNode(node, new draggedType());
    }

    public isDropAllowed = (node: PdfElement) => {
        return (element: Type<PdfElement>) => !!node
            .allowedChildElements()
            .find((ac) => ac === element);
    }
}
