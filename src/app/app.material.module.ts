import {NgModule} from '@angular/core';
import {
    MdButtonModule, MdButtonToggleModule,
    MdCardModule, MdCheckboxModule, MdDialogModule, MdGridListModule, MdIconModule, MdInputModule,
    MdListModule, MdMenuModule, MdProgressBarModule, MdProgressSpinnerModule, MdRadioModule, MdRippleModule,
    MdSelectModule, MdSidenavModule, MdSliderModule, MdSlideToggleModule, MdSnackBarModule, MdTabsModule,
    MdToolbarModule, MdTooltipModule
} from '@angular/material';

const MD_MODULES = [
    MdButtonModule,
    MdButtonToggleModule,
    MdCardModule,
    MdCheckboxModule,
    MdDialogModule,
    MdGridListModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdMenuModule,
    MdProgressBarModule,
    MdProgressSpinnerModule,
    MdRadioModule,
    MdRippleModule,
    MdSelectModule,
    MdSidenavModule,
    MdSliderModule,
    MdSlideToggleModule,
    MdSnackBarModule,
    MdTabsModule,
    MdToolbarModule,
    MdTooltipModule,
];

@NgModule({
    declarations: [],
    imports: MD_MODULES,
    exports: MD_MODULES,
    providers: [],
    entryComponents: [],
    bootstrap: []
})
/**
 * This class just imports/exports all the material components we need
 */
export class AppMaterialModule {
}
