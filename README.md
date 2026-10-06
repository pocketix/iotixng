# **iotixng**
A block- and form-based visual programming editor for smart home automation built for Angular [Try it out](https://pocketixng.iot.petr-john.cz/)!

## **Overview**
**iotixng** is part of the broader **IoTiX** project — a visual programming language (VPL) designed for automating IoT and smart home devices. It enables users to design automation flows through drag-and-drop blocks and configurable forms, making it approachable for non-programmers.

Originally developed in collaboration with [Logimic](https://www.logimic.com/cs/) for the project *Services for Water Management and Monitoring Systems in Retention Basins*, the editor continues under development by [Petr John](https://www.fit.vut.cz/person/ijohn/.en) and [Jiří Hynek](https://www.fit.vut.cz/person/hynek/.en) at [BUT FIT](https://www.fit.vut.cz/.en).
You can find more information about the project on the [Pocketix Organization on GitHub](https://github.com/pocketix).

## **Features**
✅ Visual programming language editor for smart home automation  
✅ Block-based and form-based UI for designing automation workflows  
✅ Drag-and-drop interface with condition/action configuration  
✅ Smart device integration and extensible architecture  
✅ Supports the v1 language version

## **Installation**
To get started with `iotixng`, you’ll need [Node.js](https://nodejs.org/en/) (v20.19+, v22.12+, or v24+ — required by Angular CLI 20) and [npm](https://www.npmjs.com/).

### Step 1: Clone the Repository

The `iotix-shared-tests` fixtures/scenarios used by the Cypress test suite are
a git submodule — clone with `--recurse-submodules`, or run
`git submodule update --init` afterwards if you already cloned without it.

```bash
git clone --recurse-submodules https://github.com/pocketix/iotixng.git  
cd iotixng
```

### Step 2: Install Dependencies
```bash
npm run install:all
```
### Step 3: Start the Development Server
```bash
npm run start:demo
```
This will start a local dev server. Open your browser to view the application.

## **Usage**
The app provides a visual editor for creating and managing automation rules. Users can:

- Drag and connect visual blocks to define automation logic
- Use form-based configuration to set parameters and actions
- Integrate supported smart home devices into workflows
- Save, test, and iterate on automation flows without writing code

### Writing parameters
The editor has no special statement for writing a device parameter. Declare a write as an ordinary `cmd` statement named `write`, with `structure` params `reference` and `value`:

```json
"write": {
  "name": "write",
  "component": "cmd",
  "label": "Write",
  "icon": "pi-pencil",
  "extensions": {
    "params": {
      "type": "structure",
      "defs": [
        { "name": "reference", "type": "string" },
        { "name": "value", "type": "string" }
      ]
    }
  }
}
```

The editor saves it as `{"name": "write", "params": ["<reference>", "<value>"]}`, which [iotix-node](https://github.com/pocketix/iotix-node) evaluates as a parameter write. The value is stored exactly as typed, as a string.

## **Related Projects**
- 🔗 [vpl-for-things](https://github.com/pocketix/vpl-for-things) — WIP version of new editor built in Lit compatible with IoTiX v2 language
- 🔗 [iotix-react](https://github.com/pocketix/iotix-react) — React version of the editor
- 🔗 [IoTiX Node Interpreter](https://github.com/pocketix/iotix-node) — Executes automation scripts created with IoTiX tools
- 🔗 [Pocketix Node Core](https://github.com/pocketix/pocketix-node-core) — A simple environment for basic IoT management

## **Contributing**
We welcome contributions! To get involved:

1) Fork the repo and create a new branch for your feature/fix
2) Follow our code style (checked via ESLint in `.eslintrc.json`)
3) Test your changes to ensure everything works smoothly
4) Submit a pull request with a clear summary of your work

## **License**
This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for full details.
