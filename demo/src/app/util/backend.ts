import {Injectable} from "@angular/core";
import {firstValueFrom} from "rxjs";
import {IoTiXVPLanguage} from "iotixng";
import {Group} from "../generated/models/group";
import {Program} from "../generated/models/program";
import {Version} from "../generated/models";
import {GroupService} from "../generated/services/group.service";
import {ProgramService} from "../generated/services/program.service";
import {apiBaseUrl} from "./api-base-url";
import snapshot from "../data/backendSnapshot.json";

const data = snapshot as unknown as {
    groups: Group[],
    groupsById: Record<string, Group>,
    programsOfGroup: Record<string, Program[]>,
    metaLanguages: Record<string, IoTiXVPLanguage>
};

// With a backend base URL (API_BASE_URL at build time) the demo loads device
// groups from that backend and offers Evaluate; without it the demo is a static
// site that reads the same data from a bundled snapshot and has no Evaluate.
// See example-backend in the iotix repository for the API.
@Injectable({providedIn: "root"})
export class DemoBackend {
    readonly evaluateAvailable = !!apiBaseUrl;

    constructor(private groupService: GroupService, private programService: ProgramService) {
    }

    getAllGroups(): Promise<Group[]> {
        return apiBaseUrl
            ? firstValueFrom(this.groupService.getAllGroups({includeDevices: false}))
            : Promise.resolve(data.groups);
    }

    getGroup(id: number): Promise<Group> {
        return apiBaseUrl
            ? firstValueFrom(this.groupService.getGroup({id, includeDevices: false}))
            : Promise.resolve(data.groupsById[id]);
    }

    getProgramOfGroup(id: number): Promise<Program[]> {
        return apiBaseUrl
            ? firstValueFrom(this.programService.getProgramOfGroup({id}))
            : Promise.resolve(data.programsOfGroup[id] ?? []);
    }

    getMetaLanguage(version: Version): Promise<IoTiXVPLanguage> {
        return apiBaseUrl
            ? firstValueFrom(this.programService.getMetaLanguage({version}))
            : Promise.resolve(data.metaLanguages[version]);
    }

    runProgram(program: object): Promise<{ name: string, params: string[] }[]> {
        return firstValueFrom(this.programService.v1RunProgram({body: program}));
    }
}

export {apiBaseUrl};
