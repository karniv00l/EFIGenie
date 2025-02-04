class VariableRegistry {
    constructor(prop) {
        Object.assign(this, prop);
        this.CreateIfNotFound = true;
    }
    Clear() {
        Object.entries(this).forEach(e => {
            var [elementname, element] = e;
            if(elementname === `CreateIfNotFound`)
                return;
            delete this[elementname];
        });
    }
    GenerateVariableId() {
        this.VariableIncrement ??= 0;
        return ++this.VariableIncrement;
    }
    GetVariableByReference(variableReference) {
        if(typeof variableReference === `string`) {
            if(variableReference.indexOf(`.`) !== -1) {
                const listName = variableReference.substring(0, variableReference.indexOf(`.`));
                var variableName = variableReference.substring(variableReference.indexOf(`.`) + 1);
                if(Array.isArray(this[listName])) {
                    var variable = this[listName].find(a => a.Name === variableName);
                    if(variableName.indexOf(`(`) !== -1) {
                        var measurementName = variableName.substring(variableName.lastIndexOf(`(`) + 1);
                        measurementName = measurementName.substring(0, measurementName.length - 1);
                        variableName = variableName.substring(0, variableName.lastIndexOf(`(`));
                        variable ??= this[listName].find(a => a.Name === variableName && a.Measurement === measurementName)
                        variable ??= this[listName].find(a => a.Name === variableName)
                    }
                    if(variable) {
                        if(typeof variable.Id === `string`)
                            return this.GetVariableByReference(variable.Id);
                        return variable;
                    }
                }
            }
            if(typeof this[variableReference] === `string`)
                return this.GetVariableByReference(this[variableReference]);
            if(this[variableReference] !== undefined)
                return this[variableReference];
        }
        if(typeof variableReference === `number`)
            return variableReference;
        return undefined;
    }
    GetVariableId(variableReference) {
        var variable = this.GetVariableByReference(variableReference);
        if(variable === undefined && this.CreateIfNotFound)
            return this[variableReference] = this.GenerateVariableId();
        if(typeof variable === `object`)
            return variable.Id;
        return variable;
    }
    RegisterVariable(variableReference, Type, Id) {
        if(variableReference.indexOf(`.`) !== -1) {
            const listName = variableReference.substring(0, variableReference.indexOf(`.`));
            var variableName = variableReference.substring(variableReference.indexOf(`.`) + 1);
            var measurement;
            if(variableName.indexOf(`(`) !== -1) {
                var measurement = variableName.substring(variableName.lastIndexOf(`(`) + 1);
                measurement = measurement.substring(0, measurement.length - 1);
                variableName = variableName.substring(0, variableName.lastIndexOf(`(`));
            }
            this[listName] ??= [];
            this[listName].push({
                Name: variableName,
                Measurement: measurement,
                Type,
                Id: Id == undefined? this.GenerateVariableId() : Id
            });
        } else {
            this[variableReference] = Id == undefined? this.GenerateVariableId() : Id
        }
    }
    GetVariableReferenceList() {
        var variableReferences = {};
        for (var property in this) {
            if (this[property] === undefined)
                continue;
    
            if(property === `VariableIncrement` || property === `CreateIfNotFound`)
                continue;
            if(property.toLowerCase().indexOf(`temp`) === 0)
                continue;
    
            if (Array.isArray(this[property])) {
                variableReferences[property] ??= [];
                var arr = this[property];
    
                for (var i = 0; i < arr.length; i++) {
                    variableReferences[property].push({ Name: arr[i].Name, Measurement: arr[i].Measurement, Id: this.GetVariableId(arr[i].Id)})
                }
            } else {
                variableReferences[property] = this.GetVariableId(this[property]);
            }
        }
        return variableReferences;
    }
}

VariableRegister = new VariableRegistry();

var AFRConfigs = [];
AFRConfigs.push(Calculation_Static);
AFRConfigs.push(Calculation_LookupTable);
AFRConfigs.push(Calculation_2AxisTable);
var InjectorEnableConfigs = [];
InjectorEnableConfigs.push(Calculation_Static);
InjectorEnableConfigs.push(Calculation_LookupTable);
InjectorEnableConfigs.push(Calculation_2AxisTable);
var InjectorPulseWidthConfigs = [];
InjectorPulseWidthConfigs.push(Calculation_Static);
// InjectorPulseWidthConfigs.push(Calculation_LookupTable);
// InjectorPulseWidthConfigs.push(Calculation_2AxisTable);
var IgnitionAdvanceConfigs = [];
IgnitionAdvanceConfigs.push(Calculation_Static);
IgnitionAdvanceConfigs.push(Calculation_LookupTable);
IgnitionAdvanceConfigs.push(Calculation_2AxisTable);
var IgnitionEnableConfigs = [];
IgnitionEnableConfigs.push(Calculation_Static);
IgnitionEnableConfigs.push(Calculation_LookupTable);
IgnitionEnableConfigs.push(Calculation_2AxisTable);
var IgnitionDwellConfigs = [];
IgnitionDwellConfigs.push(Calculation_Static);
IgnitionDwellConfigs.push(Calculation_LookupTable);
IgnitionDwellConfigs.push(Calculation_2AxisTable);
var CylinderAirmassConfigs = [];
CylinderAirmassConfigs.push(Calculation_Static);
var CylinderAirTemperatureConfigs = [];
CylinderAirTemperatureConfigs.push(Calculation_Static);
var ManifoldAbsolutePressureConfigs = [];
ManifoldAbsolutePressureConfigs.push(Calculation_Static);
var VolumetricEfficiencyConfigs = [];
VolumetricEfficiencyConfigs.push(Calculation_Static);
VolumetricEfficiencyConfigs.push(Calculation_LookupTable);
VolumetricEfficiencyConfigs.push(Calculation_2AxisTable);

EngineFactoryIDs = {
    Offset : 40000,
    CylinderAirMass_SD: 1,
    InjectorPrime: 2,
    Position: 3,
    PositionPrediction: 4,
    EngineParameters: 5,
    ScheduleIgnition: 6,
    ScheduleInjection: 7,
    InjectorDeadTime: 8
}

function GetType(value) {
    if(value == undefined)
        return `VOID`;
    if(typeof value === `boolean`)
        return `BOOL`
    if(value % 1 !== 0)
        return `FLOAT`;

    if(value < 0) {
        if(value < 128 && value > -129)
            return `INT8`;
        if(value < 32768 && value > -32759)
            return `INT16`;
        if(value < 2147483648 && value > -2147483649)
            return `INT32`;
        if(value < 9223372036854775807 && value > -9223372036854775808)
            return `INT64`;

        throw `number too big`;
    }

    if(value < 128)
        return `INT8`;
    if(value < 256)
        return `UINT8`;
    if(value < 32768)
        return `INT16`;
    if(value < 65536)
        return `UINT16`;
    if(value < 2147483648)
        return `INT32`;
    if(value < 4294967295)
        return `UINT32`;
    if(value < 9223372036854775807)
        return `INT64`;
    if(value < 18446744073709551615)
        return `UINT64`;
    throw `number too big`;
}

function GetTypeId(type) {
    switch(type) {
        case `VOID`: return 0;
        case `UINT8`: return 1;
        case `UINT16`: return 2;
        case `UINT32`: return 3;
        case `UINT64`: return 4;
        case `INT8`: return 5;
        case `INT16`: return 6;
        case `INT32`: return 7;
        case `INT64`: return 8;
        case `FLOAT`: return 9;
        case `DOUBLE`: return 10;
        case `BOOL`: return 11;
    }
}

PackedTypeAlignment = [
    { type: `INT8`, align: 1 }, 
    { type: `INT16`, align: 1 },
    { type: `INT32`, align: 1 },
    { type: `INT64`, align: 1 },
    { type: `BOOL`, align: 1 }, 
    { type: `UINT8`, align: 1 },
    { type: `UINT16`, align: 1 },
    { type: `UINT32`, align: 1 },
    { type: `UINT64`, align: 1 },
    { type: `FLOAT`, align: 1 },
    { type: `DOUBLE`, align: 1 },
]

STM32TypeAlignment = [
    { type: `INT8`, align: 1 }, 
    { type: `INT16`, align: 2 },
    { type: `INT32`, align: 4 },
    { type: `INT64`, align: 8 },
    { type: `BOOL`, align: 1 }, 
    { type: `UINT8`, align: 1 },
    { type: `UINT16`, align: 2 },
    { type: `UINT32`, align: 4 },
    { type: `UINT64`, align: 8 },
    { type: `FLOAT`, align: 4 },
    { type: `DOUBLE`, align: 8 },
]

x86TypeAlignment = [
    { type: `INT8`, align: 1 }, 
    { type: `INT16`, align: 2 },
    { type: `INT32`, align: 4 },
    { type: `INT64`, align: 8 },
    { type: `BOOL`, align: 1 }, 
    { type: `UINT8`, align: 1 },
    { type: `UINT16`, align: 2 },
    { type: `UINT32`, align: 4 },
    { type: `UINT64`, align: 8 },
    { type: `FLOAT`, align: 4 },
    { type: `DOUBLE`, align: 8 },
]

function Packagize(obj, val) {
    if(val.outputVariables || val.intputVariables) {
        obj.type = `Package`;
        obj.outputVariables = val.outputVariables;
        obj.inputVariables = val.inputVariables;
    }
    return { value: [ obj ] };
}

function Operation_Math(mathFactoryId) {
    if(this.a !== undefined) {
        this.inputVariables ??= [0,0];
        this.inputVariables[0] = this.a;
        delete this.a;
    }
    if(this.b !== undefined) {
        this.inputVariables ??= [0,0];
        this.inputVariables[1] = this.b;
        delete this.b;
    }
    if(this.result !== undefined) {
        this.outputVariables ??= [0];
        this.outputVariables[0] = this.result;
        delete this.result;
    }
    if(this.outputVariables || this.intputVariables){
        this.inputVariables ??= [0,0];
        this.outputVariables ??= [0];
    }

    return Packagize({ value: [ { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + mathFactoryId } ]}, this);
}

types = [
    { type: `INT8`, toArrayBuffer() { return new Int8Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `INT16`, toArrayBuffer() { return new Int16Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `INT32`, toArrayBuffer() { return new Int32Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `INT64`, toArrayBuffer() { return new BigInt64Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `BOOL`, toArrayBuffer() { return new Uint8Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `UINT8`, toArrayBuffer() { return new Uint8Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `UINT16`, toArrayBuffer() { return new Uint16Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `UINT32`, toArrayBuffer() { return new Uint32Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `UINT64`, toArrayBuffer() { return new BigUint64Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `FLOAT`, toArrayBuffer() { return new Float32Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `DOUBLE`, toArrayBuffer() { return new Float64Array(Array.isArray(this.value)? this.value : [this.value]).buffer; }},
    { type: `CompressedObject`, toArrayBuffer() { return base64ToArrayBuffer(lzjs.compressToBase64(stringifyObject(this.value))); }},
    { type: `VariableId`, toObj() { return { value: [{ type: `UINT32`, value: VariableRegister.GetVariableId(this.value) }]}; }},
    { type: `Package`, toObj() {
        this.value.unshift({ type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Package }); //Package
        
        const thisValue = this;
        this.outputVariables?.forEach(function(outputVariable) {
            thisValue.value.push({ type: `VariableId`, value: outputVariable ?? 0 })
        });

        delete this.outputVariables;

        this.inputVariables?.forEach(function(inputVariable) {
            thisValue.value.push({ type: `VariableId`, value: inputVariable ?? 0 })
        });

        delete this.inputVariables;

        return this;
    }},
    { type: `Operation_StaticVariable`, toObj() {
        if(this.result !== undefined){
            this.outputVariables = [this.result];
            delete this.result;
        }

        var type = GetType(this.value);
        var typeID = GetTypeId(type);
        return Packagize({ value: [ 
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Static},
            { type: `UINT8`, value: typeID }, //typeid
            { type: type, value: this.value } //val
        ]}, this);
    }},
    { type: `Operation_Add`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.Add) }},
    { type: `Operation_Subtract`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.Subtract); }},
    { type: `Operation_Multiply`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.Multiply); }},
    { type: `Operation_Divide`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.Divide); }},
    { type: `Operation_And`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.And); }},
    { type: `Operation_Or`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.Or); }},
    { type: `Operation_GreaterThan`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.GreaterThan); }},
    { type: `Operation_LessThan`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.LessThan); }},
    { type: `Operation_Equal`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.Equal); }},
    { type: `Operation_GreaterThanOrEqual`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.GreaterThanOrEqual); }},
    { type: `Operation_LessThanOrEqual`, toObj() { return Operation_Math.call(this, OperationArchitectureFactoryIDs.LessThanOrEqual); }}
]

for(var index in STM32TypeAlignment) {
    var type = types.find(x => x.type == x86TypeAlignment[index].type);
    if(type){
        type.align = x86TypeAlignment[index].align
    }
}

class ConfigTop extends UITemplate {
    static Template = getFileContents(`ConfigGui/Top.html`);

    constructor(prop){
        super();
        this.Inputs = new ConfigInputs();
        this.Engine = new ConfigEngine();
        this.Fuel = new ConfigFuel();
        this.Ignition = new ConfigIgnition();
        this.Setup(prop);
    }

    get SaveValue() {
        return super.SaveValue;
    }

    set SaveValue(saveValue) {
        super.SaveValue = saveValue;
        this.RegisterVariables();
    }

    Detach() {
        super.Detach();
        DetachPasteOptions();

        $(document).off(`click.${this.GUID}`);
    }

    Attach() {
        super.Attach();
        AttachPasteOptions();

        var thisClass = this;
        $(document).on(`click.${this.GUID}`, `#${this.GUID}-sidebar-open`, function(){
            var sidebarSelector = $(`#${thisClass.GUID}-sidebar`);
            var containerSelector = $(`#${thisClass.GUID}-container`);
            var width = sidebarSelector.width();
            var moveamount = 0.005 * width / 0.1;
            var left = containerSelector.position().left;
            sidebarSelector.show();
            sidebarSelector.css(`left`, `${left-width}px`);
            var intervalId = setInterval(function() {
                if (left >= width) {
                    clearInterval(intervalId);
                } else {
                    left += moveamount;
                    containerSelector.css(`left`, `${left}px`);
                    containerSelector.css(`margin-right`, `${left}px`);
                    sidebarSelector.css(`left`, `${left-width}px`);
                    sidebarSelector.css(`opacity`, left / width);
                }
            }, 5);
            $(`#${thisClass.GUID}-sidebar-open`).hide();
        });

        $(document).on(`click.${this.GUID}`, `#${this.GUID}-sidebar-close`, function(){
            var sidebarSelector = $(`#${thisClass.GUID}-sidebar`);
            var containerSelector = $(`#${thisClass.GUID}-container`);
            var width = sidebarSelector.width();
            var moveamount = 0.005 * width / 0.1;
            var left = containerSelector.position().left;
            sidebarSelector.css(`left`, `${left-width}px`);
            var intervalId = setInterval(function() {
                if (left <= 0) {
                    clearInterval(intervalId);
                    sidebarSelector.hide();
                } else {
                    left -= moveamount;
                    containerSelector.css(`left`, `${left}px`);
                    containerSelector.css(`margin-right`, `${left}px`);
                    sidebarSelector.css(`left`, `${left-width}px`);
                    sidebarSelector.css(`opacity`, left / width);
                }
            }, 5);
            $(`#${thisClass.GUID}-sidebar-open`).show();
        });

        $(document).on(`click.${this.GUID}`, `#${this.GUID}-inputstab, #${this.GUID}-inputstablist`, function(e){
            if($(e.target).hasClass(`expand`)) {
                if( $(`#${thisClass.GUID}-inputstablist`).is(`:visible`)) {
                    $(e.target).html(`►&nbsp;`);
                    $(`#${thisClass.GUID}-inputstablist`).hide();
                } else {
                    $(e.target).html(`▼&nbsp;`);
                    $(`#${thisClass.GUID}-inputstablist`).show();
                }
            } else {
                $(`.${thisClass.GUID}-content`).hide();
                $(`#${thisClass.GUID}-inputs`).show();
                $(`#${thisClass.GUID}-inputstab .w3-right`).show();
                $(`#${thisClass.GUID}-sidebar .w3-bar-item`).removeClass(`active`);
                $(`#${thisClass.GUID}-inputstab`).addClass(`active`);
                $(`#${thisClass.GUID}-title`).html(`Inputs`);
            }
        });

        $(document).on(`click.${this.GUID}`, `#${this.GUID}-enginetab`, function(){
            $(`.${thisClass.GUID}-content`).hide();
            $(`#${thisClass.GUID}-engine`).show();
            $(`#${thisClass.GUID}-inputstab .w3-right`).hide();
            $(`#${thisClass.GUID}-sidebar .w3-bar-item`).removeClass(`active`);
            $(`#${thisClass.GUID}-enginetab`).addClass(`active`);
            $(`#${thisClass.GUID}-title`).html(`Engine`);
        });

        $(document).on(`click.${this.GUID}`, `#${this.GUID}-fueltab`, function(){
            $(`.${thisClass.GUID}-content`).hide();
            $(`#${thisClass.GUID}-fuel`).show();
            $(`#${thisClass.GUID}-inputstab .w3-right`).hide();
            $(`#${thisClass.GUID}-sidebar .w3-bar-item`).removeClass(`active`);
            $(`#${thisClass.GUID}-fueltab`).addClass(`active`);
            $(`#${thisClass.GUID}-title`).html(`Fuel`);
        });

        $(document).on(`click.${this.GUID}`, `#${this.GUID}-ignitiontab`, function(){
            $(`.${thisClass.GUID}-content`).hide();
            $(`#${thisClass.GUID}-ignition`).show();
            $(`#${thisClass.GUID}-inputstab .w3-right`).hide();
            $(`#${thisClass.GUID}-sidebar .w3-bar-item`).removeClass(`active`);
            $(`#${thisClass.GUID}-ignitiontab`).addClass(`active`);
            $(`#${thisClass.GUID}-title`).html(`Ignition`);
        });
    }

    GetHtml() {
        var template = super.GetHtml();

        template = template.replace(/[%]inputstablist[%]/g, this.Inputs.GetInputsHtml());

        template = template.replace(/[%]inputsstyle[%]/g, ``);
        template = template.replace(/[%]fuelstyle[%]/g, ` style="display: none;"`);
        template = template.replace(/[%]enginestyle[%]/g, ` style="display: none;"`);
        template = template.replace(/[%]ignitionstyle[%]/g, ` style="display: none;"`);

        return template;
    }

    RegisterVariables() {
        VariableRegister.Clear();
        this.Inputs.RegisterVariables();
        this.Engine.RegisterVariables();
        this.Fuel.RegisterVariables();
        this.Ignition.RegisterVariables();
    }

    GetArrayBuffer() {
        this.RegisterVariables();
        return (new ArrayBuffer()).build({ types: types, value: [{obj: this.GetObjOperation()}]});
    }

    GetObjOperation() {
        return { value: [
            { type: `UINT32`, value: 0}, //signal last operation

            //inputs
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
            { type: `UINT16`, value: 2 }, // number of operations
            { obj: this.Inputs.GetObjOperation()}, 
            { obj: this.Engine.GetObjOperation()}, 

            //preSync
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
            { type: `UINT16`, value: 0 }, // number of operations

            //sync condition
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
            { type: `UINT16`, value: 2 }, // number of operations
            { type: `Operation_StaticVariable`, value: false, result: `temp` }, //store result in temp variable
            
            { 
                type: `Operation_Or`,
                result: 0, //return result
                a: `EngineSyncedId`,
                b: `temp`
            },

            //main loop execute
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
            { type: `UINT16`, value: 2 }, // number of operations
            { obj: this.Fuel.GetObjOperation()}, 
            { obj: this.Ignition.GetObjOperation()}, 
            { toArrayBuffer() {
                var objectArray = base64ToArrayBuffer(lzjs.compressToBase64(stringifyObject(VariableRegister.GetVariableReferenceList())));
                return (new Uint32Array([objectArray.byteLength]).buffer).concatArray(objectArray);
            }}
        ]};
    }
}

class ConfigFuel extends UITemplate {
    static Template =   getFileContents(`ConfigGui/Fuel.html`);

    constructor(prop) {
        super();
        this.AFRConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            AFRConfigs,
            Label:              `Air Fuel Ratio`,
            Measurement:        `Ratio`,
            ReferenceName:      `FuelParameters.Air Fuel Ratio`
        });
        this.InjectorEnableConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            InjectorEnableConfigs,
            Label:              `Injector Enable`,
            Measurement:        `Bool`,
            ReferenceName:      `FuelParameters.Injector Enable`
        });
        this.InjectorPulseWidthConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            InjectorPulseWidthConfigs,
            Label:              `Injector Pulse Width`,
            Measurement:        `Time`,
            ReferenceName:      `FuelParameters.Injector Pulse Width`,
            MeasurementUnitName:`ms`
        });
        this.InjectorEndPositionConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            GenericConfigs,
            Label:              `Injector End Position(BTDC)`,
            Measurement:        `Angle`,
            ReferenceName:      `FuelParameters.Injector End Position`
        });
        this.Outputs = [];
        for(var i = 0; i < 8; i++){
            this.Outputs[i] = new ConfigTDCOutput({
                Configs:        BooleanOutputConfigs,
                Label:          `Injector ${i+1}`,
                Measurement:    `No Measurement`
            });
        }
        this.Setup(prop);
    }

    get SaveValue() {
        var saveValue = super.SaveValue;
        saveValue.Outputs = [];
        for(var i = 0; i < this.Outputs.length; i++){
            saveValue.Outputs[i] = this.Outputs[i].SaveValue;
        };
        return saveValue;
    }

    set SaveValue(saveValue) {
        this.Detach();
        if(saveValue?.ConfigInjectorOutputs)
            saveValue.Outputs = saveValue.ConfigInjectorOutputs.Outputs;
        if(saveValue?.Outputs)
        {
            this.Outputs = [];
            for(var i = 0; i < saveValue.Outputs.length; i++){
                if(!this.Outputs[i])
                    this.Outputs[i] = new ConfigTDCOutput({
                        Configs:        BooleanOutputConfigs,
                        Label:          `Injector ${i+1}`,
                        Measurement:    `No Measurement`
                    });
                this.Outputs[i].SaveValue = saveValue.Outputs[i];
            }
        }

        super.SaveValue = saveValue;
    }

    RegisterVariables() {
        this.AFRConfigOrVariableSelection.RegisterVariables();
        VariableRegister.RegisterVariable(`FuelParameters.Cylinder Fuel Mass(Mass)`, `float`);
        this.InjectorEnableConfigOrVariableSelection.RegisterVariables();
        this.InjectorPulseWidthConfigOrVariableSelection.RegisterVariables();
        this.InjectorEndPositionConfigOrVariableSelection.RegisterVariables();
        for(var i = 0; i < this.Outputs.length; i++){
            this.Outputs[i].RegisterVariables();
        };
    }

    GetObjOperation() {
        var numberOfOperations = 1 + this.Outputs.length;
        if(!this.AFRConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.InjectorEnableConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.InjectorPulseWidthConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.InjectorEndPositionConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;

        var obj = { 
            types : [{ type: `Operation_EngineScheduleInjection`, toObj() {
                return { value: [ {
                    type: `Package`,
                    value: [ 
                        { type: `UINT32`, value: EngineFactoryIDs.Offset + EngineFactoryIDs.ScheduleInjection }, //factory id
                        { type: `FLOAT`, value: this.value.TDC.Value }, //tdc
                        { obj: this.value.GetObjOperation()},
                    ],
                    outputVariables: [ 
                        `temp`, //store in temp variable
                        `temp` //store in temp variable
                    ],
                    inputVariables: [
                        `EnginePositionId`,
                        `FuelParameters.Injector Enable`,
                        `FuelParameters.Injector Pulse Width`,
                        `FuelParameters.Injector End Position(BTDC)`
                    ]
                }]};
            }}],
            value: [
                { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
                { type: `UINT16`, value: numberOfOperations }, // number of operations

                { obj: this.AFRConfigOrVariableSelection.GetObjOperation()}, 

                { 
                    type: `Operation_Divide`,
                    result: `FuelParameters.Cylinder Fuel Mass`,
                    a: `EngineParameters.Cylinder Air Mass`,
                    b: `FuelParameters.Air Fuel Ratio`
                },

                { obj: this.InjectorEnableConfigOrVariableSelection.GetObjOperation()}, 
                { obj: this.InjectorPulseWidthConfigOrVariableSelection.GetObjOperation()}, 
                { obj: this.InjectorEndPositionConfigOrVariableSelection.GetObjOperation()}
            ]
        };

        for(var i = 0; i < this.Outputs.length; i++) {
            obj.value.push({ type: `Operation_EngineScheduleInjection`, value: this.Outputs[i] });
        }

        return obj;
    }
}

class ConfigIgnition extends UITemplate {
    static Template = getFileContents(`ConfigGui/Ignition.html`);

    constructor(prop) {
        super();
        this.IgnitionEnableConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            IgnitionEnableConfigs,
            Label:              `Ignition Enable`,
            Measurement:        `Bool`,
            ReferenceName:      `IgnitionParameters.Ignition Enable`
        });
        this.IgnitionAdvanceConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            IgnitionAdvanceConfigs,
            Label:              `Ignition Advance`,
            Measurement:        `Angle`,
            ReferenceName:      `IgnitionParameters.Ignition Advance`
        });
        this.IgnitionDwellConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            IgnitionDwellConfigs,
            Label:              `Ignition Dwell`,
            Measurement:        `Time`,
            ReferenceName:      `IgnitionParameters.Ignition Dwell`,
            MeasurementUnitName:`ms`
        });
        this.IgnitionDwellDeviationConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            IgnitionDwellConfigs,
            Label:              `Ignition Dwell Deviation`,
            Measurement:        `Time`,
            ReferenceName:      `IgnitionParameters.Ignition Dwell Deviation`,
            MeasurementUnitName:`ms`
        });
        this.Outputs = [];
        for(var i = 0; i < 8; i++){
            this.Outputs[i] = new ConfigTDCOutput({
                Configs:            BooleanOutputConfigs,
                Label:              `Ignition ${i+1}`,
                Measurement:        `No Measurement`
            });
        }
        this.Setup(prop);
    }

    get SaveValue() {
        var saveValue = super.SaveValue;
        saveValue.Outputs = [];
        for(var i = 0; i < this.Outputs.length; i++){
            saveValue.Outputs[i] = this.Outputs[i].SaveValue;
        };
        return saveValue;
    }

    set SaveValue(saveValue) {
        this.Detach();

        if(saveValue?.Outputs)
        {
            this.Outputs = [];
            for(var i = 0; i < saveValue.Outputs.length; i++){
                if(!this.Outputs[i])
                    this.Outputs[i] = new ConfigTDCOutput({
                        Configs:            BooleanOutputConfigs,
                        Label:              `Ignition ${i+1}`,
                        Measurement:        `No Measurement`
                    });
                this.Outputs[i].SaveValue = saveValue.Outputs[i];
            }
        }

        super.SaveValue = saveValue;
    }

    RegisterVariables() {
        this.IgnitionEnableConfigOrVariableSelection.RegisterVariables();
        this.IgnitionAdvanceConfigOrVariableSelection.RegisterVariables();
        this.IgnitionDwellConfigOrVariableSelection.RegisterVariables();
        this.IgnitionDwellDeviationConfigOrVariableSelection.RegisterVariables();

        for(var i = 0; i < this.Outputs.length; i++){
            this.Outputs[i].RegisterVariables();
        };
    }

    GetObjOperation() {
        var numberOfOperations = this.Outputs.length;
        if(!this.IgnitionEnableConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.IgnitionAdvanceConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.IgnitionDwellConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.IgnitionDwellDeviationConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;

        var obj  = { 
            types : [{ type: `Operation_EngineScheduleIgnition`, toObj() {
                return { value: [ {
                    type: `Package`,
                    value: [ 
                        { type: `UINT32`, value: EngineFactoryIDs.Offset + EngineFactoryIDs.ScheduleIgnition }, //factory id
                        { type: `FLOAT`, value: this.value.TDC.Value }, //tdc
                        { obj: this.value.GetObjOperation()},
                    ],
                    outputVariables: [ 
                        `temp`, //store in temp variable
                        `temp` //store in temp variable
                    ],
                    inputVariables: [
                        `EnginePositionId`,
                        `IgnitionParameters.Ignition Enable`,
                        `IgnitionParameters.Ignition Dwell`,
                        `IgnitionParameters.Ignition Advance`,
                        `IgnitionParameters.Ignition Dwell Deviation`
                    ]
                }]};
            }}],
            value: [
                { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
                { type: `UINT16`, value: numberOfOperations }, // number of operations

                { obj: this.IgnitionEnableConfigOrVariableSelection.GetObjOperation()}, 
                { obj: this.IgnitionAdvanceConfigOrVariableSelection.GetObjOperation()}, 
                { obj: this.IgnitionDwellConfigOrVariableSelection.GetObjOperation()}, 
                { obj: this.IgnitionDwellDeviationConfigOrVariableSelection.GetObjOperation()}, 
            ]
        };

        for(var i = 0; i < this.Outputs.length; i++) {
            obj.value.push({ type: `Operation_EngineScheduleIgnition`, value: this.Outputs[i] });
        }

        return obj;
    }
}

class ConfigEngine extends UITemplate {
    static Template = getFileContents(`ConfigGui/Engine.html`);

    constructor(prop) {
        super();
        this.CrankPositionConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            undefined,
            Label:              `Crank Position`,
            Measurement:        `Reluctor`,
            ReferenceName:      `EngineParameters.Crank Position`
        });
        this.CamPositionConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            undefined,
            Label:              `Cam Position`,
            Measurement:        `Reluctor`,
            ReferenceName:      `EngineParameters.Cam Position`
        });
        this.CylinderAirmassConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            CylinderAirmassConfigs,
            Label:              `Cylinder Air Mass`,
            Measurement:        `Mass`,
            ReferenceName:      `EngineParameters.Cylinder Air Mass`
        });
        this.CylinderAirTemperatureConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            CylinderAirTemperatureConfigs,
            Label:              `Cylinder Air Temperature`,
            Measurement:        `Temperature`,
            ReferenceName:      `EngineParameters.Cylinder Air Temperature`
        });
        this.ManifoldAbsolutePressureConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            ManifoldAbsolutePressureConfigs,
            Label:              `Manifold Absolute Pressure`,
            Measurement:        `Pressure`,
            ReferenceName:      `EngineParameters.Manifold Absolute Pressure`
        });
        this.VolumetricEfficiencyConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            VolumetricEfficiencyConfigs,
            Label:              `Volumetric Efficiency`,
            Measurement:        `Percentage`,
            ReferenceName:      `EngineParameters.Volumetric Efficiency`
        });
        this.Setup(prop);
    }

    CrankPriority = 1;//static set this for now

    RegisterVariables() {
        this.CrankPositionConfigOrVariableSelection.RegisterVariables();
        this.CamPositionConfigOrVariableSelection.RegisterVariables();

        VariableRegister.RegisterVariable(`EngineParameters.Engine Speed(AngularSpeed)`, `float`);

        var requirements = [];

        if(!this.CylinderAirmassConfigOrVariableSelection.Selection?.reference) {
            requirements = GetClassProperty(this.CylinderAirmassConfigOrVariableSelection.GetSubConfig(), `Requirements`);
        }

        this.ManifoldAbsolutePressureConfigOrVariableSelection.Hidden = requirements?.indexOf(`Manifold Absolute Pressure`) < 0;
        if(!this.ManifoldAbsolutePressureConfigOrVariableSelection.Hidden) 
            this.ManifoldAbsolutePressureConfigOrVariableSelection.RegisterVariables();
        
        this.CylinderAirTemperatureConfigOrVariableSelection.Hidden = requirements?.indexOf(`Cylinder Air Temperature`) < 0;
        if(!this.CylinderAirTemperatureConfigOrVariableSelection.Hidden) 
            this.CylinderAirTemperatureConfigOrVariableSelection.RegisterVariables();
        
        this.VolumetricEfficiencyConfigOrVariableSelection.Hidden = requirements?.indexOf(`Volumetric Efficiency`) < 0;
        if(!this.VolumetricEfficiencyConfigOrVariableSelection.Hidden) 
            this.VolumetricEfficiencyConfigOrVariableSelection.RegisterVariables();

        this.CylinderAirmassConfigOrVariableSelection.RegisterVariables();
    }

    GetObjOperation() {
        var mapRequired = false;
        var catRequired = false;
        var veRequired  = false;
        if(!this.CylinderAirmassConfigOrVariableSelection.Selection?.reference) {
            var requirements = GetClassProperty(this.CylinderAirmassConfigOrVariableSelection.GetSubConfig(), `Requirements`);
            mapRequired = requirements && requirements.indexOf(`Manifold Absolute Pressure`) > -1;
            catRequired = requirements && requirements.indexOf(`Cylinder Air Temperature`) > -1
            veRequired = requirements && requirements.indexOf(`Volumetric Efficiency`) > -1;
        }

        var numberOfOperations = 2;
        if(!this.CrankPositionConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.CamPositionConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(mapRequired && !this.ManifoldAbsolutePressureConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(catRequired && !this.CylinderAirTemperatureConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(veRequired && !this.VolumetricEfficiencyConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;
        if(!this.CylinderAirmassConfigOrVariableSelection.IsVariable())
            ++numberOfOperations;



        var obj = { value: [
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
            { type: `UINT16`, value: numberOfOperations }, // number of operations

            { obj: this.CrankPositionConfigOrVariableSelection.GetObjOperation() },

            { obj: this.CamPositionConfigOrVariableSelection.GetObjOperation() },

            //CalculateEnginePosition
            { 
                type: `Package`,
                value: [ 
                    { type: `UINT32`, value: EngineFactoryIDs.Offset + EngineFactoryIDs.Position + ( this.CrankPriority? 0 : 1) },  //factory id
                 ],
                outputVariables: [ `EnginePositionId` ],
                inputVariables: [
                    `EngineParameters.Crank Position`,
                    `EngineParameters.Cam Position`
                ]
            },

            //EngineParameters
            { 
                type: `Package`,
                value: [ 
                    { type: `UINT32`, value: EngineFactoryIDs.Offset + EngineFactoryIDs.EngineParameters },  //factory id
                 ],
                outputVariables: [ 
                    `EngineParameters.Engine Speed`,
                    `EngineSequentialId`,
                    `EngineSyncedId`
                ],
                inputVariables: [ `EnginePositionId`  ]
            },
        ]};

        
        if(mapRequired) {
            obj.value.push({ obj: this.ManifoldAbsolutePressureConfigOrVariableSelection.GetObjOperation() });
        }

        if(catRequired) {
            obj.value.push({ obj: this.CylinderAirTemperatureConfigOrVariableSelection.GetObjOperation() });
        }
        
        if(veRequired) {
            obj.value.push({ obj: this.VolumetricEfficiencyConfigOrVariableSelection.GetObjOperation() });
        }
        
        obj.value.push({ obj: this.CylinderAirmassConfigOrVariableSelection.GetObjOperation() });

        return obj;
    }
}

class ConfigTDCOutput extends CalculationOrVariableSelection {
    static Template = CalculationOrVariableSelection.Template.replace(`for="$Selection.GUID$">$Label$:`, `for="$TDC.GUID$"><div style="display: inline-block;" class="pinselectname">$Label$</div>:&nbsp;&nbsp;&nbsp;TDC:$TDC$°`)

    constructor(prop) {
        super();
        this.TDC = new UINumber({
            Value:  0,
            Step:   1,
            Min:    0,
            Max:    720
        })
        this.Setup(prop);
    }
}

class CylinderAirmass_SpeedDensity extends UITemplate {
    static Name = `Speed Density`;
    static Measurement = `Mass`;
    static Output = `float`;
    static Requirements = [`Cylinder Air Temperature`, `Manifold Absolute Pressure`, `Volumetric Efficiency`];
    static Template = `<div><label for="$CylinderVolume.GUID$">Cylinder Volume:</label>$CylinderVolume$</div>`;

    constructor(prop) {
        super();
        this.CylinderVolume = new UINumberWithMeasurement({
            Value:              0.66594,
            Step:               0.001,
            Min:                0.001,
            Measurement:        `Volume`,
            MeasurementUnitName:`mL`
        });
        this.Setup(prop);
    }

    GetObjOperation(outputVariableId) {
        return { value: [{ 
            type: `Package`,
            value: [ 
                { type: `UINT32`, value: EngineFactoryIDs.Offset + EngineFactoryIDs.CylinderAirMass_SD },  //factory id
                { type: `FLOAT`, value: this.CylinderVolume.Value }, //Cylinder Volume
            ],
            outputVariables: [ outputVariableId ?? 0 ], //Return
            inputVariables: [ 
                `EngineParameters.Cylinder Air Temperature`,
                `EngineParameters.Manifold Absolute Pressure`,
                `EngineParameters.Volumetric Efficiency`
            ]
        }]};
    }
}
CylinderAirmassConfigs.push(CylinderAirmass_SpeedDensity);

class InjectorPulseWidth_DeadTime extends UITemplate {
    static Name = `Dead Time`;
    static Output = `float`;
    static Measurement = `Time`;
    static Template =   `<div>$FlowRateConfigOrVariableSelection$</div>` +
                        `<div>$DeadTimeConfigOrVariableSelection$</div>` +
                        `<div><label for="$MinInjectorFuelMass.GUID$">Min Injector Fuel Mass:</label>$MinInjectorFuelMass$</div>`;

    constructor(prop) {
        super();
        this.FlowRateConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            GenericConfigs,
            Label:              `Injector Flow Rate`,
            Measurement:        `MassFlow`,
            ReferenceName:      `FuelParameters.Injector Flow Rate`
        });
        this.DeadTimeConfigOrVariableSelection = new CalculationOrVariableSelection({
            Configs:            GenericConfigs,
            Label:              `Injector Dead Time`,
            Measurement:        `Time`,
            ReferenceName:      `FuelParameters.Injector Dead Time`,
            MeasurementUnitName:`ms`
        });
        this.MinInjectorFuelMass = new UINumberWithMeasurement({
            Value:              0.005,
            Step:               0.001,
            Measurement:        `Mass`,
            MeasurementUnitName:`g`
        });
        this.Setup(prop);
    }

    RegisterVariables() {
        this.DeadTimeConfigOrVariableSelection.RegisterVariables();
        this.FlowRateConfigOrVariableSelection.RegisterVariables();
    }

    GetObjOperation(outputVariableId) {
        var numberOfOperations = 3;
        if(!this.FlowRateConfigOrVariableSelection.IsVariable())
            numberOfOperations++;
        if(!this.DeadTimeConfigOrVariableSelection.IsVariable())
            numberOfOperations++;

        return { value: [
            { type: `UINT32`, value: OperationArchitectureFactoryIDs.Offset + OperationArchitectureFactoryIDs.Group }, // Group
            { type: `UINT16`, value: numberOfOperations }, // number of operations

            { obj: this.FlowRateConfigOrVariableSelection.GetObjOperation()},
            { obj: this.DeadTimeConfigOrVariableSelection.GetObjOperation()},
            
            //Store a value of 2 into the temporary variable which will be used for SquirtsPerCycle (2 squirts per cycle default)
            { type: `Operation_StaticVariable`, value: 2, result: `temp` },//static value of 2
            
            //Subtract 1 to temporary variable if Engine is running sequentially. This will be used for SquirtsPerCycle (1 squirts per cycle when sequential)
            { 
                type: `Operation_Subtract`,
                result: `temp`, //Return
                a: `temp`,
                b: `EngineSequentialId`
            },

            { 
                type: `Package`,
                value: [ 
                    { type: `UINT32`, value: EngineFactoryIDs.Offset + EngineFactoryIDs.InjectorDeadTime },
                    { type: `FLOAT`, value: this.MinInjectorFuelMass.Value }
                 ],
                outputVariables: [ outputVariableId ?? 0 ], //Return
                inputVariables: [ 
                    `temp`,
                    `FuelParameters.Cylinder Fuel Mass`,
                    `FuelParameters.Injector Flow Rate`,
                    `FuelParameters.Injector Dead Time`
                 ]
            }
        ]};
    }
}
InjectorPulseWidthConfigs.push(InjectorPulseWidth_DeadTime);
