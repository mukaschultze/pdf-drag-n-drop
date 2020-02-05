import { DragDropModule } from "@angular/cdk/drag-drop";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTreeModule } from "@angular/material/tree";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { PdfJsViewerModule } from "ng2-pdfjs-viewer";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PdfTreeComponent } from "./pdf-tree/pdf-tree.component";

@NgModule({
    declarations: [
        AppComponent,
        PdfTreeComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,

        DragDropModule,

        PdfJsViewerModule,

        MatListModule,
        MatCheckboxModule,
        MatButtonModule,
        MatToolbarModule,
        MatExpansionModule,
        MatInputModule,
        MatTreeModule,
        MatIconModule,
        MatGridListModule,

        BrowserAnimationsModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
