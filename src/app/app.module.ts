import { DragDropModule } from "@angular/cdk/drag-drop";
import { HttpClientModule } from "@angular/common/http";
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
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTreeModule } from "@angular/material/tree";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { PdfJsViewerModule } from "ng2-pdfjs-viewer";
import { environment } from "../environments/environment";
import { AppComponent } from "./app.component";
import { AppEffects } from "./app.effects";
import { DevDirective } from "./dev-mode.directive";
import { PdfTreeComponent } from "./pdf-tree/pdf-tree.component";
import { metaReducers, reducers } from "./reducers";
import { SafePipe } from "./safe.pipe";

@NgModule({
  declarations: [
    AppComponent,
    PdfTreeComponent,
    SafePipe,
    DevDirective,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    DragDropModule,

    PdfJsViewerModule,
    PdfViewerModule,

    MatListModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatInputModule,
    MatTreeModule,
    MatIconModule,
    MatGridListModule,

    !environment.production ?
      StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }) :
      [],

    EffectsModule.forRoot([AppEffects]),

    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
      },
    }),

  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
