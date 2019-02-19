class Config {
    constructor(obj, configNameSpace, parent) {
        if(obj && obj.ConfigName) {
            Object.assign(this, configNameSpace[obj.ConfigName]);
        } else {
            Object.assign(this, configNameSpace["Main"]);
        }
        if(obj)
            Object.assign(this, obj);

        this.Parent = parent;
        this.ConfigNameSpace = configNameSpace;

        for(var variableRowIndex in this.Variables) {
            var variableRow = this.Variables[variableRowIndex];
            var variableRowKey = Object.keys(variableRow)[0];
            var variableRowObj = this[variableRowKey];

            if(!variableRowObj)
                variableRowObj = variableRow[variableRowKey];

            if(variableRowObj.XResolution) {
                this[variableRowKey] = new ConfigNumberTable(variableRowObj, this);
            } else if(variableRowObj.Type) {
                if(variableRowObj.Type)
                {
                    switch(variableRowObj.Type) {
                        case "uint8":
                        case "uint16":
                        case "uint32":
                        case "uint64":
                        case "int8":
                        case "int16":
                        case "int32":
                        case "int64":
                        case "float":
                            this[variableRowKey] = new ConfigNumber(variableRowObj, this);
                            break;
                        case "formula":
                            this[variableRowKey] = new ConfigFormula(variableRowObj, this);
                            break;
                        case "bool":
                            this[variableRowKey] = new ConfigBoolean(variableRowObj, this);
                            break;
                    }
                }
            } else if (variableRowObj.ConfigName || variableRowObj.Variables) {
                if(!variableRowObj.Array) {
                    this[variableRowKey] = new Config(variableRowObj, this.ConfigNameSpace, this);
                } else {
                    this[variableRowKey] = new ConfigArray(variableRowObj, this.ConfigNameSpace, this);
                }
            } else if (variableRowObj.Selections) {
                this[variableRowKey] = new ConfigSelection(variableRowObj, this.ConfigNameSpace, this);
            }
        }
    }
    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();
        for(var variableRowIndex in this.Variables) {
            var variableRow = this.Variables[variableRowIndex];
            var variableRowKey = Object.keys(variableRow)[0];
            var variableRowObj = this[variableRowKey];

            if(this.Size) {// we are in a statically mapped area
                var offset = variableRowObj.Offset;
                if(!offset)
                    throw "Config No offset specified";

                var subArrayBuffer = variableRowObj.GetArrayBuffer();

                if(variableRowObj instanceof configBoolean) {
                    var bit = variableRowObj.Bit;
                    if(!bit)
                        bit = 0; //if there is not bit specified assume it is to be put at the first position. usualy when the bit takes the entire byte space

                    subArrayBuffer[0] = subArrayBuffer[0] | (arrayBuffer.slice(offset)[0] & ~(0x01 << bit))                   
                }

                arrayBuffer = arrayBuffer.slice(0, Math.floor(offset)).concatArray(subArrayBuffer).concatArray(arrayBuffer.slice(Math.floor(offset) + subArrayBuffer.byteLength));
            } else {
                arrayBuffer = arrayBuffer.concatArray(variableRowObj.GetArrayBuffer());
            }
        }
        return arrayBuffer;
    }
    SetArrayBuffer(arrayBuffer) {
        var size = 0;

        if(this.Size) {// we are in a statically mapped area
            size = this.Size;
        }

        for(var variableRowIndex in this.Variables) {
            var variableRow = this.Variables[variableRowIndex];
            var variableRowKey = Object.keys(variableRow)[0];
            var variableRowObj = this[variableRowKey];

            if(this.Size) {// we are in a statically mapped area
                var offset = variableRowObj.Offset;
                if(!offset)
                    throw "Config No offset specified";
                
                variableRowObj.SetArrayBuffer(arrayBuffer.slice(offset));
            } else {
                size += variableRowObj.SetArrayBuffer(arrayBuffer.slice(size));
            }
        }

        return size;
    }
    GetConfig() {
        var returnVariables = []
        for(var variableRowIndex in this.Variables) {
            var variableRow = this.Variables[variableRowIndex];
            var variableRowKey = Object.keys(variableRow)[0];
            var variableRowObj = this[variableRowKey];

            if(!variableRowObj)
                throw "Config not initialized";
                
            var variableRowValue = variableRowObj.GetConfig();

            var returnVariableRow = {};
            returnVariableRow[variableRowKey] = variableRowValue;
            
            returnVariables.push(returnVariableRow);
        }
        this.Variables = returnVariables;
        
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "ConfigNameSpace" || key === "Parent")
                return undefined;         
            for(var variableRowIndex in this.Variables) {
                var variableRow = this.Variables[variableRowIndex];

                if(key === Object.keys(variableRow)[0]) {
                    return undefined;
                }
            }
            if(key != "" && value.GetConfig) 
                return value.GetConfig();  
            
            return value;
        }));
    }
}

class ConfigSelection {
    constructor(obj, configNameSpace, parent) {
        if(obj)
            Object.assign(this, obj);
        this.Parent = parent;

        this.ConfigNameSpace = configNameSpace;

        if(!this.Index) {
            this.Index = 0;
        }

        if(!this.Value) {
            this.Value = new Config(this.Selections[this.Index], this.ConfigNameSpace, this);
        }
    }
    GetArrayBuffer() {
        return this.Value.GetArrayBuffer();
    }
    SetArrayBuffer(arrayBuffer) {
        var thisClass = this;
        if( !(this.Value.Variables[0].Type === "uint8" && new Uint8Array(arrayBuffer.slice(0, 1))[0] === this.Value.Variables[0].Value) &&
            !(this.Value.Variables[0].Type === "uint16" && new Uint16Array(arrayBuffer.slice(0, 16))[0] === this.Value.Variables[0].Value)) {

            $.each(this.Selections, function(selectionIndex, selectionValueObj) {
                var selectionValue = new Config(selectionValueObj, thisClass.ConfigNameSpace, this.Parent);

                if( (selectionValue.Variables[0].Type === "uint8" && new Uint8Array(arrayBuffer.slice(0, 1))[0] === selectionValue.Variables[0].Value) ||
                    (selectionValue.Variables[0].Type === "uint16" && new Uint16Array(arrayBuffer.slice(0, 16))[0] === selectionValue.Variables[0].Value)) {
                    thisClass.Index = selectionIndex;
                    thisClass.Value = selectionValue;
                }
            });
        }

        return this.Value.SetArrayBuffer(arrayBuffer);
    }
    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "ConfigNameSpace" || key === "Parent")    
                return undefined;     
            if(key != "" && value.GetConfig) 
                return value.GetConfig();      
            return value;
        }));
    }
}

class ConfigNumber {
    constructor(obj, parent) {
        if(obj)
            Object.assign(this, obj);
        this.Parent = parent;
        switch(this.Type) {
            case "uint8":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 255;
                break;
            case "uint16":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 65535;
                break;
            case "uint32":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 4294967295;
                break;
            case "uint64":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 18446744073709551615;
                break;
            case "int8":
                if(!this.Min)
                    this.Min = -128;
                if(!this.Max)
                    this.Max = 127;
                break;
            case "int16":
                if(!this.Min)
                    this.Min = -32768;
                if(!this.Max)
                    this.Max = 32767;
                break;
            case "int32":
                if(!this.Min)
                    this.Min = -2147483648;
                if(!this.Max)
                    this.Max = 2147483647;
                break;
            case "int64":
                if(!this.Min)
                    this.Min = -9223372036854775808;
                if(!this.Max)
                    this.Max = 9223372036854775807;
                break;
            case "float":
                if(!this.Min)
                    this.Min = -340282300000000000000000000000000000000;
                if(!this.Max)
                    this.Max = 340282300000000000000000000000000000000;
                break;
        }
        if(!this.Value)
            if(this.Min > 0)
                this.Value = this.Min;
            else
                this.Value = 0;
    }
    GetArrayBuffer() {
        switch(this.Type) {
            case "uint8":
                return new Uint8Array([this.Value]).buffer;
            case "uint16":
                return new Uint16Array([this.Value]).buffer;
            case "uint32":
                return new Uint32Array([this.Value]).buffer;
            case "int8":
                return new Int8Array([this.Value]).buffer;
            case "int16":
                return new Int16Array([this.Value]).buffer;
            case "int32":
                return new Int32Array([this.Value]).buffer;
            case "float":
                return new Float32Array([this.Value]).buffer;
        }
    }
    SetArrayBuffer(arrayBuffer) {
        switch(this.Type) {
            case "uint8":
                this.Value = new Uint8Array(arrayBuffer.slice(0,1))[0];
                return 1;
            case "uint16":
                this.Value = new Uint16Array(arrayBuffer.slice(0,2))[0];
                return 2;
            case "uint32":
                this.Value = new Uint32Array(arrayBuffer.slice(0,4))[0];
                return 4;
            case "uint64":
                this.Value = new Uint64Array(arrayBuffer.slice(0,8))[0];
                return 8;
            case "int8":
                this.Value = new Int8Array(arrayBuffer.slice(0,1))[0];
                return 1;
            case "int16":
                this.Value = new Int16Array(arrayBuffer.slice(0,2))[0];
                return 2;
            case "int32":
                this.Value = new Int32Array(arrayBuffer.slice(0,4))[0];
                return 4;
            case "int64":
                this.Value = new Int64Array(arrayBuffer.slice(0,8))[0];
                return 8;
            case "float":
                this.Value = new Float32Array(arrayBuffer.slice(0,4))[0];
                return 4;
        }
    }
    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "ConfigNameSpace" || key === "Parent")    
                return undefined; 
        }));
    }
}

class ConfigBoolean {
    constructor(obj, parent) {
        if(obj)
            Object.assign(this, obj);
        this.Parent = parent;
        if(!this.Value)
            this.Value = false;
    }
    GetArrayBuffer() {
        var value = this.Value;

        if(this.Bit) {
            var bit = this.Bit;
            if(!bit)
                bit = 0; //if there is not bit specified assume it is to be at the first position. usualy when the bit takes the entire byte space
            
            value = (value << bit) & (0x01 << bit);
        }

        return new Uint8Array([value]).buffer;
    }
    SetArrayBuffer(arrayBuffer) {
        if(this.Bit) {
            var bit = this.Bit;
            if(!bit)
                bit = 0; //if there is not bit specified assume it is to be at the first position. usualy when the bit takes the entire byte space

            var byte = arrayBuffer.slice(offset)[0];
            this.Value = (byte >> bit) & 0x01;
        } else {
            this.Value = (new Uint8Array(arrayBuffer.slice(0,1))[0] === 1);
        }

        return 1;
    }
    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "ConfigNameSpace" || key === "Parent")    
                return undefined; 
        }));
    }
}

class ConfigNumberTable {
    constructor(obj, parent) {
        if(obj)
            Object.assign(this, obj);
        this.Parent = parent;
        if(!this.XResolution)
            this.XResolution = 1;
        if(!this.YResolution)
            this.YResolution = 1; 
        switch(this.Type) {
            case "uint8":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 255;
                break;
            case "uint16":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 65535;
                break;
            case "uint32":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 4294967295;
                break;
            case "uint64":
                if(!this.Min)
                    this.Min = 0;
                if(!this.Max)
                    this.Max = 18446744073709551615;
                break;
            case "int8":
                if(!this.Min)
                    this.Min = -128;
                if(!this.Max)
                    this.Max = 127;
                break;
            case "int16":
                if(!this.Min)
                    this.Min = -32768;
                if(!this.Max)
                    this.Max = 32767;
                break;
            case "int32":
                if(!this.Min)
                    this.Min = -2147483648;
                if(!this.Max)
                    this.Max = 2147483647;
                break;
            case "int64":
                if(!this.Min)
                    this.Min = -9223372036854775808;
                if(!this.Max)
                    this.Max = 9223372036854775807;
                break;
            case "float":
                if(!this.Min)
                    this.Min = -340282300000000000000000000000000000000;
                if(!this.Max)
                    this.Max = 340282300000000000000000000000000000000;
                break;
        }
        if(!this.Value) {
            var val = 0
            if(this.Min > 0)
                val = this.Min;
            this.Value = new Array(this.GetTableArrayLength());
            var thisClass = this;
            $.each(this.Value, function(index, value) {
                thisClass.Value[index] = val;
            });
        }
    }
    GetTableArrayLength() {
        return GetReferenceByNumberOrReference(this.Parent, this.XResolution, 1).Value * GetReferenceByNumberOrReference(this.Parent, this.YResolution, 1).Value;
    }
    GetArrayBuffer() {
        switch(this.Type) {
            case "bool":
            case "uint8":
                return Uint8Array.from(this.Value).buffer;
            case "uint16":
                return Uint16Array.from(this.Value).buffer;
            case "uint32":
                return Uint32Array.from(this.Value).buffer;
            case "uint64":
                return Uint64Array.from(this.Value).buffer;
            case "int8":
                return Int8Array.from(this.Value).buffer;
            case "int16":
                return Int16Array.from(this.Value).buffer;
            case "int32":
                return Int32Array.from(this.Value).buffer;
            case "int64":
                return Int64Array.from(this.Value).buffer;
            case "float":
                return Float32Array.from(this.Value).buffer;
        }

        throw "ConfigNumberTable Type Invalid";
    }
    SetArrayBuffer(arrayBuffer) {
        var arrayLen = this.GetTableArrayLength();

        switch(this.Type) {
            case "bool":
            case "uint8":
                this.Value = Array.from(new Uint8Array(arrayBuffer.slice(0, arrayLen)));
                return arrayLen;
            case "uint16":
                this.Value = Array.from(new Uint16Array(arrayBuffer.slice(0, 2 * arrayLen)));
                return 2 * arrayLen;
            case "uint32":
                this.Value = Array.from(new Uint32Array(arrayBuffer.slice(0, 4 * arrayLen)));
                return 4 * arrayLen;
            case "uint64":
                this.Value = Array.from(new Uint64Array(arrayBuffer.slice(0, 4 * arrayLen)));
                return 8 * arrayLen;
            case "int8":
                this.Value = Array.from(new Int8Array(arrayBuffer.slice(0, arrayLen)));
                return arrayLen;
            case "int16":
                this.Value = Array.from(new Int16Array(arrayBuffer.slice(0, 2 * arrayLen)));
                return 2 * arrayLen;
            case "int32":
                this.Value = Array.from(new Int32Array(arrayBuffer.slice(0, 4 * arrayLen)));
                return 4 * arrayLen;
            case "int64":
                this.Value = Array.from(new Int64Array(arrayBuffer.slice(0, 4 * arrayLen)));
                return 8 * arrayLen;
            case "float":
                this.Value = Array.from(new Float32Array(arrayBuffer.slice(0, 4 * arrayLen)));
                return 4 * arrayLen;
        }

        throw "ConfigNumberTable Type Invalid";
    }
    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "Parent")    
                return undefined; 
        }));
    }
}

class ConfigFormula {
    constructor(obj, parent) {
        if(obj)
            Object.assign(this, obj);
        this.Parent = parent;
        if(!this.Degree)
            this.Degree = 1;
        if(!this.Min)
            this.Min = -340282300000000000000000000000000000000;
        if(!this.Max)
            this.Max = 340282300000000000000000000000000000000;
        if(!this.Value) {
            var val = 0
            if(this.Min > 0)
                val = this.Min;
            this.Value = new Array(this.GetTableArrayLength());
            var thisClass = this;
            $.each(this.Value, function(index, value) {
                thisClass.Value[index] = val;
            });
        }
    }
    GetTableArrayLength() {
        return GetReferenceByNumberOrReference(this.Parent, this.Degree, 0).Value + 1;
    }
    GetArrayBuffer() {
        return Float32Array.from(this.Value);
    }
    SetArrayBuffer(arrayBuffer) {
        var arrayLen = this.GetTableArrayLength();
        this.Value = Array.from(new Float32Array(arrayBuffer.slice(0, 4 * arrayLen)));
        return 4 * arrayLen;
    }
    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "Parent")    
                return undefined; 
        }));
    }
}

class ConfigArray {
    constructor(obj, configNameSpace, parent) {
        if(obj)
            Object.assign(this, obj);
        this.Parent = parent;
        
        this.ConfigNameSpace = configNameSpace;

        var tableArrayLength = this.GetTableArrayLength()

        if(!this.Value || this.Value.length < tableArrayLength) {
            var prevValue = this.Value;
            var prevValueLength = 0;
            if(prevValue)
                prevValueLength = prevValue.length;
            this.Value = new Array(Math.max(prevValueLength, tableArrayLength));
    
            for(var i = 0; i < Math.max(prevValueLength, tableArrayLength); i++) {
                var subConfig = {};
                Object.assign(subConfig, this);
                delete subConfig.Array;
                delete subConfig.Value;
                delete subConfig.Labels;
                if(this.Labels && i < this.Labels.length) {
                    subConfig.Label = this.Labels[i];
                } else {
                    subConfig.Label = this.Label + "[" + i + "]";
                }

                if(i < prevValueLength)
                    this.Value[i] = prevValue[i];
                else
                    this.Value[i] = new Config(subConfig, this.ConfigNameSpace, this.Parent);
            }
        }
    }
    GetTableArrayLength() {
        return GetReferenceByNumberOrReference(this.Parent, this.Array, 0).Value;
    }
    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();
        for(var config in this.Value) {
            arrayBuffer = arrayBuffer.concatArray(this.Value[config].GetArrayBuffer());
        }
        return arrayBuffer;
    }
    SetArrayBuffer(arrayBuffer) {
        var size = 0;

        var tableArrayLength = this.GetTableArrayLength()

        var prevValue = this.Value;
        var prevValueLength = 0;
        if(prevValue)
            prevValueLength = prevValue.length;
        this.Value = new Array(Math.max(prevValueLength, tableArrayLength));

        for(var i = 0; i < Math.max(prevValueLength, tableArrayLength); i++) {
            if(i < tableArrayLength) {
                var subConfig = {};
                Object.assign(subConfig, this);
                delete subConfig.Array;
                delete subConfig.Value;
                delete subConfig.Labels;
                if(this.Labels && i < this.Labels.length) {
                    subConfig.Label = this.Labels[i];
                } else {
                    subConfig.Label = this.Label + "[" + i + "]";
                }

                this.Value[i] = new Config(subConfig, this.ConfigNameSpace, this.Parent);
                size += this.Value[i].SetArrayBuffer(arrayBuffer.slice(size));
            } else {
                this.Value[i] = prevValue[i];
            }
        }

        return size;
    }
    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "ConfigNameSpace" || key === "Parent")    
                return undefined; 
        }));
    }
}

function GetReferenceByNumberOrReference(referenceObj, numberOrReference, defaultValue) {
    var value = parseInt(numberOrReference);
    if(isNaN(value)) {
        var ref = referenceObj[numberOrReference];
        if(!ref)
            return { Value: defaultValue };
        return ref;
    }

    return { Value: value};
}

function GetReferenceCount(referenceObj, reference) {
    var refernceCount = 0;
    for(key in referenceObj) {
        if(!referenceObj[key])
            continue;

        if(referenceObj[key].XResolution && referenceObj[key].XResolution === reference) {
            refernceCount++;
            continue;
        }

        if(referenceObj[key].XMin && referenceObj[key].XMin === reference) {
            refernceCount++;
            continue;
        }

        if(referenceObj[key].XMax && referenceObj[key].XMax === reference) {
            refernceCount++;
            continue;
        }

        if(referenceObj[key].YResolution && referenceObj[key].YResolution === reference) {
            refernceCount++;
            continue;
        }

        if(referenceObj[key].YMin && referenceObj[key].YMin === reference) {
            refernceCount++;
            continue;
        }

        if(referenceObj[key].YMax && referenceObj[key].YMax === reference) {
            refernceCount++;
            continue;
        }
    }

    return refernceCount;
}