import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatTreeModule } from "@angular/material/tree";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgDragDropModule } from "ng-drag-drop";
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

        NgDragDropModule.forRoot(),

        MatListModule,
        MatButtonModule,
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
