import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { defaultProgram } from './util/defaultProgram';
import { defaultMetaLanguage } from './util/defaultMetaLanguage';
import {
    readableToSerializedCapabilityAndVariablesReplacer,
    serializedToReadableCapabilityAndVariablesReplacer
} from './util/capabilityAndVariablesReplacers';
import {
    IoTiXVPProgram,
    IoTiXVPStatementLanguage,
    IoTiXVPVariable
} from "iotixng";
import { DemoBackend } from './util/backend';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [MessageService],
    standalone: false
})
export class AppComponent {
    program: IoTiXVPProgram = defaultProgram;
    metaLanguage = defaultMetaLanguage;
    capabilities: (IoTiXVPStatementLanguage & { capabilityId: string })[] = [];
    variables: IoTiXVPVariable[] = [];
    evaluateButtonEnabled = false;

    constructor(private messageService: MessageService, public backend: DemoBackend) {

    }

    onProgramChange(program: IoTiXVPProgram) {
        this.program = program;
        this.evaluateButtonEnabled = true;
    }

    onMetaLanguageChange(meta: any) {
        this.metaLanguage = meta;
    }

    onCapabilitiesChange(capabilities: any) {
        this.capabilities = capabilities;
    }

    onVariablesChange(variables: any) {
        this.variables = variables;
    }

    onProgramTrigger() {
        const evaluableProgram = readableToSerializedCapabilityAndVariablesReplacer(
            this.program, this.capabilities, this.variables
        );

        this.backend.runProgram(evaluableProgram).then(value => {
            const commands = serializedToReadableCapabilityAndVariablesReplacer(
                value as any, this.capabilities, this.variables
            );

            if (!commands.length) {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Triggered capabilities',
                    detail: 'The program triggered no capabilities.'
                });
            }

            for (const command of commands) {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Triggered capabilities',
                    detail: `Triggered capability ${command.name} with parameters ${JSON.stringify(command.params)}`
                });
            }
        }).catch(error => this.messageService.add({
            severity: 'error',
            summary: 'Evaluation failed',
            detail: error.error?.message ?? error.message
        }));
    }
}
