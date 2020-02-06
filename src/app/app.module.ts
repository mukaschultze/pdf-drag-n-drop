import { DragDropModule } from "@angular/cdk/drag-drop";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
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
import { PdfViewerModule } from "ng2-pdf-viewer";
import { PdfJsViewerModule } from "ng2-pdfjs-viewer";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PdfTreeComponent } from "./pdf-tree/pdf-tree.component";
import { SafePipe } from "./safe.pipe";

@NgModule({
    declarations: [
        AppComponent,
        PdfTreeComponent,
        SafePipe,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,

        DragDropModule,

        PdfJsViewerModule,
        PdfViewerModule,

        MatListModule,
        MatCheckboxModule,
        MatButtonModule,
        MatToolbarModule,
        MatButtonToggleModule,
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
