import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {createVariablesFromDevice} from '../../util/createVariablesFromDevice';
import {
    createCapabilitiesFromDeviceAndCapabilityTemplate
} from '../../util/createCapabilitiesFromDeviceAndCapabilityTemplate';
import {serializedToReadableCapabilityAndVariablesReplacer} from '../../util/capabilityAndVariablesReplacers';
import {
    IoTiXVPLanguage, IoTiXVPStatementLanguage,
    IoTiXVPVariable,
    IoTiXVPStatement
} from "iotixng";
import {Group} from "../../generated/models/group";
import {Program} from "../../generated/models/program";
import {Version} from '../../generated/models';
import {DemoBackend} from "../../util/backend";

@Component({
    selector: 'app-more',
    templateUrl: './more.component.html',
    styleUrls: ['./more.component.css'],
    standalone: false
})
export class MoreComponent implements OnInit {
    visible = false;

    selectedGroup?: Group;
    groups: Group[] = [];
    groupsError = '';
    groupById: Group | null = null;
    groupsByIdError = '';

    programs: Program[] = [];
    capabilities: (IoTiXVPStatementLanguage & {
        capabilityId: string
    })[] = [];
    variables: IoTiXVPVariable[] = [];

    activeProgramIndex?: number;

    metaLanguage?: IoTiXVPLanguage;
    currentMetaLanguageVersion?: Version;

    @Output() onProgramChange = new EventEmitter<any>();
    @Output() onMetaLanguageChange = new EventEmitter<IoTiXVPLanguage>();
    @Output() onCapabilitiesChange = new EventEmitter<any>();
    @Output() onVariablesChange = new EventEmitter<IoTiXVPVariable[]>();

    constructor(public backend: DemoBackend) {}

    ngOnInit(): void {
        this.fetchGroups();
    }

    showDialog(event: Event): void {
        event.preventDefault();
        this.visible = true;
    }

    hideDialog(event: Event): void {
        event.preventDefault();
        this.visible = false;
    }

    fetchGroups(): void {
        this.backend.getAllGroups().then(groupsFromApi => {
            this.groups = groupsFromApi;
        }).catch(error => {
            this.groupsError = error.message;
        });
    }

    onGroupSelected(): void {
        if (!this.selectedGroup) return;

        this.backend.getGroup(this.selectedGroup.id).then(groupFromApi => {
            this.groupById = groupFromApi;

            const newVariables = groupFromApi.devices.flatMap(createVariablesFromDevice);
            const newCapabilities = groupFromApi.devices.flatMap(createCapabilitiesFromDeviceAndCapabilityTemplate);

            this.variables = newVariables;
            this.capabilities = newCapabilities;

            this.onVariablesChange.emit(newVariables);
            this.onCapabilitiesChange.emit(newCapabilities);

            this.fetchPrograms();
        }).catch(error => {
            this.groupsByIdError = error.message;
        });
    }

    fetchPrograms(): void {
        if (!this.selectedGroup) return;

        this.backend.getProgramOfGroup(this.selectedGroup.id).then(programsFromApi => {
            this.programs = programsFromApi.map(program => ({
                ...program,
                data: serializedToReadableCapabilityAndVariablesReplacer(program.data, this.capabilities, this.variables)
            }));
            this.setActiveProgram(0);
        }).catch(error => {
            this.groupsByIdError = error.message;
        });
    }

    setActiveProgram(index: number): void {
        const selected = this.programs[index];
        this.activeProgramIndex = index;

        if (!selected || selected.version === this.currentMetaLanguageVersion) return;

        this.currentMetaLanguageVersion = selected.version;
        this.backend.getMetaLanguage(selected.version).then(metaLang => {
            this.metaLanguage = metaLang;
        }).catch(error => {
            this.groupsByIdError = error.message;
        });
    }

    updateProgramAndMetaLanguage(): void {
        if (this.activeProgramIndex === undefined || !this.metaLanguage) return;

        const updatedMetaLang = { ...this.metaLanguage };
        updatedMetaLang.variables = this.variables;

        this.capabilities.forEach(c => {
            updatedMetaLang.statements[c.name] = c;
        });

        this.onMetaLanguageChange.emit(updatedMetaLang);
        this.onProgramChange.emit(this.programs[this.activeProgramIndex].data);
    }
}