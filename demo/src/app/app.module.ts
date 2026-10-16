import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MoreComponent} from './components/more/more.component';
import {AccordionModule} from "primeng/accordion";
import {ButtonModule} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {IotixVpModule} from "iotixng";
import {ApiModule} from "./generated/api.module";
import {FormsModule} from "@angular/forms";
import {ToastModule} from "primeng/toast";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {apiBaseUrl} from "./util/api-base-url";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({ declarations: [
        AppComponent,
        MoreComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        AccordionModule,
        ButtonModule,
        DialogModule,
        DropdownModule,
        IotixVpModule,
        ApiModule.forRoot({ rootUrl: apiBaseUrl }),
        FormsModule,
        ToastModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {
}
