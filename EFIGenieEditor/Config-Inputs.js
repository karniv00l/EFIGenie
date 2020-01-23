var OperationIncrement = 0;
var SystemChannel = 1
var CurrentTickVariableID = 0;
var InputRawChannel = 2;
var InputRawIncrement = 0;
var InputRawConfigs = [];
var InputTranslationChannel = 3;
var InputTranslationIncrement = 0;
var InputTranslationConfigs = [];

var configInputsTemplate;
class ConfigInputs {
    constructor(){
        this.GUID = getGUID();
    }

    Inputs = [new ConfigInput()];

    GetObj() {
        var obj  = [];

        for(var i = 0; i < this.Inputs.length; i++){
            obj.push(this.Inputs[i].GetObj())
        }

        return obj;
    }

    SetObj(obj) {
        this.Detach();
        this.Inputs = [];

        for(var i = 0; i < obj.length; i++){
            this.Inputs.push(new ConfigInput());
            this.Inputs[i].SetObj(obj[i]);
        }

        $("#" + this.GUID).replaceWith(this.GetHtml());
        this.Attach();
    }

    Detach() {
        for(var i = 0; i < this.Inputs.Length; i++){
            this.Inputs[i].Detach();
        }

        $(document).off("change."+this.GUID);
        $(document).off("click."+this.GUID);
    }

    Attach() {
        var thisClass = this;
        
        for(var i = 0; i < this.Inputs.Length; i++){
            this.Inputs[i].Attach();
        }
        
        $(document).on("change."+this.GUID, "#" + this.GUID + "-Selection", function(){
            thisClass.Detach();

            var selected = parseInt($(this).val());
            if(isNaN(selected)) {
                $("#"+ thisClass.GUID + "-name").hide();
                thisClass.Attach();
                return;
            }

            $("#"+ thisClass.GUID + "-inputconfig").html(thisClass.Inputs[selected].GetHtml());
            $("#"+ thisClass.GUID + "-name").show();
            $("#"+ thisClass.GUID + "-name").val(thisClass.Inputs[selected].Name);

            thisClass.Attach();
        });
        
        $(document).on("change."+this.GUID, "#" + this.GUID + "-name", function(){
            thisClass.Detach();

            var selected = parseInt($("#" + thisClass.GUID + "-Selection").val());
            if(isNaN(selected)) {
                thisClass.Attach();
                return;
            }

            thisClass.Inputs[selected].Name = $(this).val();
            $("#"+ thisClass.GUID).html(thisClass.GetHtml());

            thisClass.Attach();
        });
        
        $(document).on("click."+this.GUID, "#" + this.GUID + "-Add", function(){
            thisClass.Detach();
                    
            thisClass.Inputs.push(new ConfigInput());
            $("#" + thisClass.GUID).replaceWith(thisClass.GetHtml());

            thisClass.Attach();
        });
        
        $(document).on("click."+this.GUID, "#" + this.GUID + "-Delete", function(){
            thisClass.Detach();
                    
            var selected = parseInt($("#" + thisClass.GUID + "-Selection").val());
            if(isNaN(selected)) {
                thisClass.Attach();
                return;
            }
            
            thisClass.Inputs.splice(selected, 1);
            $("#" + thisClass.GUID).replaceWith(thisClass.GetHtml());

            thisClass.Attach();
        });
        
        $(document).on("click."+this.GUID, "#" + this.GUID + "-Up", function(){
            thisClass.Detach();
                    
            var selected = parseInt($("#" + thisClass.GUID + "-Selection").val());
            if(isNaN(selected) || selected === 0) {
                thisClass.Attach();
                return;
            }
            
            var temp = thisClass.Inputs[selected];
            thisClass.Inputs[selected] = thisClass.Inputs[selected - 1];
            thisClass.Inputs[selected - 1] = temp;
            $("#" + thisClass.GUID + "-Selection").val(selected - 1);
            $("#" + thisClass.GUID).replaceWith(thisClass.GetHtml());

            thisClass.Attach();
        });
        
        $(document).on("click."+this.GUID, "#" + this.GUID + "-Down", function(){
            thisClass.Detach();
                    
            var selected = parseInt($("#" + thisClass.GUID + "-Selection").val());
            if(isNaN(selected) || selected === thisClass.Inputs.length-1) {
                thisClass.Attach();
                return;
            }
            
            var temp = thisClass.Inputs[selected];
            thisClass.Inputs[selected] = thisClass.Inputs[selected + 1];
            thisClass.Inputs[selected + 1] = temp;
            $("#" + thisClass.GUID + "-Selection").val(selected + 1);
            $("#" + thisClass.GUID).replaceWith(thisClass.GetHtml());

            thisClass.Attach();
        });
        
        $(document).on("click."+this.GUID, "#" + this.GUID + "-Duplicate", function(){
            thisClass.Detach();
                    
            var selected = parseInt($("#" + thisClass.GUID + "-Selection").val());
            if(isNaN(selected)) {
                thisClass.Attach();
                return;
            }
            
            thisClass.Inputs.push(new ConfigInput());
            thisClass.Inputs[thisClass.Inputs.length-1].SetObj(thisClass.Inputs[selected].GetObj());
            $("#" + thisClass.GUID + "-Selection").append("<option value=\"" + (thisClass.Inputs.length-1) + "\"></option>")
            $("#" + thisClass.GUID + "-Selection").val(thisClass.Inputs.length-1);
            $("#" + thisClass.GUID).replaceWith(thisClass.GetHtml());

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configInputsTemplate)
            configInputsTemplate = getFileContents("ConfigGui/Inputs.html");
        var template = configInputsTemplate;
        
        var selected = parseInt($("#" + this.GUID + "-Selection").val());
        if(isNaN(selected))
            selected = 0;

        template = template.replace(/[$]id[$]/g, this.GUID);
        
        var inputlist = "";
        for(var i = 0; i < this.Inputs.length; i++){
            inputlist += "<option value=\"" + i + "\" " + (selected === i? "selected" : "") + ">" + this.Inputs[i].Name + "</option>";
        }
        template = template.replace(/[$]inputlist[$]/g, inputlist);

        var inputconfig = "";
        if(selected < this.Inputs.length) {
            inputconfig = this.Inputs[selected].GetHtml();
            template = template.replace(/[$]name[$]/g, this.Inputs[selected].Name);
            template = template.replace(/[$]namedivstyle[$]/g, "");
        } else {
            template = template.replace(/[$]name[$]/g, "");
            template = template.replace(/[$]namedivstyle[$]/g, " display: none;");
        }
        template = template.replace(/[$]inputconfig[$]/g, inputconfig);

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        for(var i = 0; i < this.Inputs.length; i++){
            arrayBuffer = arrayBuffer.concatArray(this.Inputs[i].GetArrayBuffer())
        }

        return arrayBuffer;
    }
}

var configInputTemplate;
class ConfigInput {
    constructor(){
        this.GUID = getGUID();
    }

    Name = "Input";
    RawConfig = undefined;
    TranslationConfig = undefined;

    GetObj() {
        return { 
            Name: this.Name,
            RawConfig: this.RawConfig? this.RawConfig.GetObj() : undefined, 
            TranslationConfig: this.TranslationConfig? this.TranslationConfig.GetObj() : undefined
        };
    }

    SetObj(obj) {
        this.Detach();
        this.Name = obj.Name;
        this.RawConfig = undefined;
        if(obj.RawConfig){
            for(var i = 0; i < InputRawConfigs.length; i++)
            {
                if(InputRawConfigs[i].Name === obj.RawConfig.Name) {
                    this.RawConfig = new InputRawConfigs[i]();
                    this.RawConfig.SetObj(obj.RawConfig);
                    break;
                }
            }
        }
        this.TranslationConfig = undefined;
        if(obj.TranslationConfig){
            for(var i = 0; i < InputTranslationConfigs.length; i++)
            {
                if(InputTranslationConfigs[i].Name === obj.TranslationConfig.Name) {
                    this.TranslationConfig = new InputTranslationConfigs[i]();
                    this.TranslationConfig.SetObj(obj.TranslationConfig);
                    break;
                }
            }
        }
        $("#" + this.GUID).replaceWith(this.GetHtml());
        this.Attach();
    }

    Detach() {
        $(document).off("change."+this.GUID);
        if(this.RawConfig) 
            this.RawConfig.Detach();
        if(this.TranslationConfig) 
            this.TranslationConfig.Detach();
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-rawselection", function(){
            thisClass.Detach();

            var val = $(this).val();
            if(val === "-1")
                thisClass.RawConfig = undefined;
            else
                thisClass.RawConfig = new InputRawConfigs[val]();
            
            if(thisClass.RawConfig)
                $("#" + thisClass.GUID + "-raw").html(thisClass.RawConfig.GetHtml());
            else
                $("#" + thisClass.GUID + "-raw").html("");
                
            var translationSelections = thisClass.GetTranslationSelections();
            $("#" + thisClass.GUID + "-translationselection").html(translationSelections.Html);
            
            if(translationSelections.Available)
                $("#" + thisClass.GUID + "-translationselection").prop( "disabled", false );
            else
                $("#" + thisClass.GUID + "-translationselection").prop( "disabled", true );
            
            thisClass.Attach();
        });
        $(document).on("change."+this.GUID, "#" + this.GUID + "-translationselection", function(){
            thisClass.Detach();

            var val = $(this).val();
            if(val === "-1")
                thisClass.TranslationConfig = undefined;
            else
                thisClass.TranslationConfig = new InputTranslationConfigs[val]();
            
            if(thisClass.TranslationConfig)
                $("#" + thisClass.GUID + "-translation").html(thisClass.TranslationConfig.GetHtml());
            else
                $("#" + thisClass.GUID + "-translation").html("");

            thisClass.Attach();
        });

        if(this.RawConfig) 
            this.RawConfig.Attach();
        if(this.TranslationConfig) 
            this.TranslationConfig.Attach();
    }

    GetTranslationSelections() {
        var availableTranslation = false;
        var translationSelections;
        if(this.RawConfig)
        {
            var output = this.RawConfig.constructor.Output;
            var translationSelected = false;
            if(output !== undefined)
            {
                for(var i = 0; i < InputTranslationConfigs.length; i++)
                {
                    var inputs = InputTranslationConfigs[i].Inputs;
                    if(inputs.length !== 1 || inputs[0] !== output)
                        continue;

                    var selected = false;
                    if(this.TranslationConfig && this.TranslationConfig instanceof InputTranslationConfigs[i]){
                        selected = true;
                        translationSelected = true;
                    }

                    translationSelections += "<option value=\"" + i + "\"" + (selected? " selected" : "") + ">" + InputTranslationConfigs[i].Name + "</option>"
                    availableTranslation = true;
                }
            }

            if(!translationSelected) {
                this.TranslationConfig = undefined;
                $("#" + this.GUID + "-translation").html("");
            }

            if(availableTranslation){
                translationSelections = "<option value=\"-1\"" + (translationSelected? "" : " selected") + ">None</option>" + translationSelections;
            } else {
                translationSelections = "<option value=\"-1\" disabled selected>None</option>";
            }
        } else {
            this.TranslationConfig = undefined;
            $("#" + this.GUID + "-translation").html("");
            translationSelections = "<option value=\"-1\">Select Raw First</option>"
        }
        return { Html : translationSelections, Available: availableTranslation };
    }

    GetHtml() {
        if(!configInputTemplate)
            configInputTemplate = getFileContents("ConfigGui/Input.html");
        var template = configInputTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        
        var rawSelections;
        var rawSelected = false;
        for(var i = 0; i < InputRawConfigs.length; i++)
        {
            var selected = false;
            if(this.RawConfig && this.RawConfig instanceof InputRawConfigs[i]){
                selected = true;
                rawSelected = true;
            }

            rawSelections += "<option value=\"" + i + "\"" + (selected? " selected" : "") + ">" + InputRawConfigs[i].Name + "</option>"
        }
        if(!rawSelected)
            this.RawConfig = undefined;
        rawSelections = "<option value=\"-1\" disabled" + (rawSelected? "" : " selected") + ">Select</option>" + rawSelections;
        template = template.replace(/[$]rawselections[$]/g, rawSelections);

        var translationSelections = this.GetTranslationSelections();
        template = template.replace(/[$]translationselections[$]/g, translationSelections.Html);
        template = template.replace(/[$]translationdisabled[$]/g, translationSelections.Available? "" : "disabled");
        
        if(this.RawConfig)
            template = template.replace(/[$]raw[$]/g, this.RawConfig.GetHtml());
        else
            template = template.replace(/[$]raw[$]/g, "");
        if(this.TranslationConfig)
            template = template.replace(/[$]translation[$]/g, this.TranslationConfig.GetHtml());
        else
            template = template.replace(/[$]translation[$]/g, "");

        this.Detach();
        this.Attach();

        return template;
    }

    GetArrayBuffer() {
        if(!this.RawConfig) 
            throw this.GUID + ": No Raw"
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([ 6003 ]).buffer); //Execute in main loop

        if(this.TranslationConfig) {
            arrayBuffer = arrayBuffer.concatArray(new Uint8Array([ InputTranslationChannel << 1 | 1 ]).buffer); //variable channel | immediate
            arrayBuffer = arrayBuffer.concatArray(new Uint8Array([ InputTranslationIncrement++ ]).buffer); //sensorTranslationID
            arrayBuffer = arrayBuffer.concatArray(this.TranslationConfig.GetArrayBuffer());
            arrayBuffer = arrayBuffer.concatArray(new Uint8Array([ 0 ]).buffer); //use operation for input parameter
        }
        
        arrayBuffer = arrayBuffer.concatArray(new Uint8Array([ InputRawChannel << 1 | 1 ]).buffer); //variable channel | immediate
        arrayBuffer = arrayBuffer.concatArray(new Uint8Array([ InputRawIncrement++ ]).buffer); //sensorID
        arrayBuffer = arrayBuffer.concatArray(this.RawConfig.GetArrayBuffer());
        
        return arrayBuffer;
    }
}

var configOperation_AnalogPinReadTemplate;
class ConfigOperation_AnalogPinRead {
    static Name = "Analog Pin";
    static Output = "float";
    static Inputs = [];

    constructor(){
        this.GUID = getGUID();
    }

    Pin = 0;

    GetObj() {
        return {
            Name: this.constructor.Name,
            Pin: this.Pin
        };
    }

    SetObj(obj) {
        this.Pin = obj.Pin;
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-pin", function(){
            thisClass.Detach();

            thisClass.Pin = parseInt($(this).val());

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configOperation_AnalogPinReadTemplate)
            configOperation_AnalogPinReadTemplate = getFileContents("ConfigGui/Operation_AnalogPinRead.html");
        var template = configOperation_AnalogPinReadTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]pin[$]/g, this.Pin);

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([5]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Pin]).buffer); //pin
        
        return arrayBuffer;
    }
}
InputRawConfigs.push(ConfigOperation_AnalogPinRead);

var configOperation_DigitalPinReadTemplate;
class ConfigOperation_DigitalPinRead {
    static Name = "Digital Pin";
    static Output = "bool";
    static Inputs = [];

    constructor(){
        this.GUID = getGUID();
    }
    
    Pin = 0;
    Inverted = 0;

    GetObj() {
        return { 
            Name: this.constructor.Name,
            Pin: this.Pin,
            Inverted: this.Inverted
        };
    }

    SetObj(obj) {
        this.Pin = obj.Pin;
        this.Inverted = obj.Inverted;
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-pin", function(){
            thisClass.Detach();

            thisClass.Pin = parseInt($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-inverted", function(){
            thisClass.Detach();

            thisClass.Inverted = this.checked? 1 : 0;

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configOperation_DigitalPinReadTemplate)
            configOperation_DigitalPinReadTemplate = getFileContents("ConfigGui/Operation_DigitalPinRead.html");
        var template = configOperation_DigitalPinReadTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]pin[$]/g, this.Pin);
        template = template.replace(/[$]inverted[$]/g, (this.Inverted === 1? "checked": ""));

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([4]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Pin]).buffer); //pin
        arrayBuffer = arrayBuffer.concatArray(new Uint8Array([this.Inverted]).buffer); //inverted
        
        return arrayBuffer;
    }
}
InputRawConfigs.push(ConfigOperation_DigitalPinRead);

var configOperation_DigitalPinRecordTemplate;
class ConfigOperation_DigitalPinRecord {
    static Name = "Digital Pin (Record)";
    static Output = "Record";
    static Inputs = [];

    constructor(){
        this.GUID = getGUID();
    }
    
    Pin = 0;
    Inverted = 0;
    Length = 2;

    GetObj() {
        return { 
            Name: this.constructor.Name,
            Pin: this.Pin,
            Inverted: this.Inverted,
            Length: this.Length
        };
    }

    SetObj(obj) {
        this.Pin = obj.Pin;
        this.Inverted = obj.Inverted;
        this.Length = obj.Length;
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-pin", function(){
            thisClass.Detach();

            thisClass.Pin = parseInt($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-inverted", function(){
            thisClass.Detach();

            thisClass.Inverted = this.checked? 1 : 0;

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-length", function(){
            thisClass.Detach();

            thisClass.Length = parseInt($(this).val());

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configOperation_DigitalPinRecordTemplate)
            configOperation_DigitalPinRecordTemplate = getFileContents("ConfigGui/Operation_DigitalPinRecord.html");
        var template = configOperation_DigitalPinRecordTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]pin[$]/g, this.Pin);
        template = template.replace(/[$]inverted[$]/g, (this.Inverted === 1? "checked": ""));
        template = template.replace(/[$]length[$]/g, this.Length);

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([12]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Pin]).buffer); //pin
        arrayBuffer = arrayBuffer.concatArray(new Uint8Array([this.Inverted]).buffer); //inverted
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Length]).buffer); //length
        
        return arrayBuffer;
    }
}
InputRawConfigs.push(ConfigOperation_DigitalPinRecord);

var configOperation_DutyCyclePinReadTemplate;
class ConfigOperation_DutyCyclePinRead {
    static Name = "Duty Cycle Pin";
    static Output = "float";
    static Inputs = [];

    constructor(){
        this.GUID = getGUID();
    }
    
    Pin = 0;
    MinFrequency = 1000;

    GetObj() {
        return { 
            Name: this.constructor.Name,
            Pin: this.Pin,
            MinFrequency: this.MinFrequency
        };
    }

    SetObj(obj) {
        this.Pin = obj.Pin;
        this.MinFrequency = obj.MinFrequency;
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-pin", function(){
            thisClass.Detach();

            thisClass.Pin = parseInt($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-minFrequency", function(){
            thisClass.Detach();

            thisClass.MinFrequency = parseInt($(this).val());

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configOperation_DutyCyclePinReadTemplate)
            configOperation_DutyCyclePinReadTemplate = getFileContents("ConfigGui/Operation_DutyCyclePinRead.html");
        var template = configOperation_DutyCyclePinReadTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]pin[$]/g, this.Pin);
        template = template.replace(/[$]minFrequency[$]/g, this.MinFrequency);

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([8]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Pin]).buffer); //pin
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.MinFrequency]).buffer); //minFrequency
        
        return arrayBuffer;
    }
}
InputRawConfigs.push(ConfigOperation_DutyCyclePinRead);

var configOperation_FrequencyPinReadTemplate;
class ConfigOperation_FrequencyPinRead {
    static Name = "Frequency Pin";
    static Output = "float";
    static Inputs = [];

    constructor(){
        this.GUID = getGUID();
    }
    
    Pin = 0;
    MinFrequency = 1000;

    GetObj() {
        return { 
            Name: this.constructor.Name,
            Pin: this.Pin,
            MinFrequency: this.MinFrequency
        };
    }

    SetObj(obj) {
        this.Pin = obj.Pin;
        this.MinFrequency = obj.MinFrequency;
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-pin", function(){
            thisClass.Detach();

            thisClass.Pin = parseInt($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-minFrequency", function(){
            thisClass.Detach();

            thisClass.MinFrequency = parseInt($(this).val());

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configOperation_FrequencyPinReadTemplate)
            configOperation_FrequencyPinReadTemplate = getFileContents("ConfigGui/Operation_FrequencyPinRead.html");
        var template = configOperation_FrequencyPinReadTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]pin[$]/g, this.Pin);
        template = template.replace(/[$]minFrequency[$]/g, this.MinFrequency);

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([6]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Pin]).buffer); //pin
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.MinFrequency]).buffer); //minFrequency
        
        return arrayBuffer;
    }
}
InputRawConfigs.push(ConfigOperation_FrequencyPinRead);

var configOperation_PolynomialTemplate;
class ConfigOperation_Polynomial {
    static Name = "Polynomial";
    static Output = "float";
    static Inputs = ["float"];

    constructor(){
        this.GUID = getGUID();
    }
    
    MinValue = 0;
    MaxValue = 1;
    Degree = 3;
    A = [0, 0, 0];

    GetObj() {
        return { 
            Name: this.constructor.Name,
            MinValue: this.MinValue,
            MaxValue: this.MaxValue,
            Degree: this.Degree,
            A: this.A.slice()
        };
    }

    SetObj(obj) {
        this.MinValue = obj.MinValue;
        this.MaxValue = obj.MaxValue;
        this.Degree = obj.Degree;
        this.A = obj.A.slice();
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-min", function(){
            thisClass.Detach();

            thisClass.MinValue = parseFloat($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-max", function(){
            thisClass.Detach();

            thisClass.MaxValue = parseFloat($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-degree", function(){
            thisClass.Detach();

            thisClass.Degree = parseInt($(this).val());

            var oldA = thisClass.A;

            thisClass.A = new Array(thisClass.Degree);
            for(var i = 0; i < thisClass.A.length; i++){
                if(i < oldA.length)
                    thisClass.A[i] = oldA[i];
                else
                    thisClass.A[i] = 0;
            }
            $("#" + thisClass.GUID + "-coefficients").html(thisClass.GetCoefficientsHtml());
            
            thisClass.Attach();
        });
        
        $(document).on("change."+this.GUID, "#" + this.GUID + "-A", function(){
            thisClass.Detach();

            var index = $(this).data("index");
            var val = parseFloat($(this).val());

            thisClass.A[index] = val;
            
            thisClass.Attach();
        });
    }

    GetCoefficientsHtml() {
        var coefficients = "<label>Coefficients:</label>";
        for(var i = this.Degree-1; i > 0; i--)
        {
            coefficients += "<input id=\"" + this.GUID + "-A\" data-index=\"" + i + "\" type=\"number\" step=\"0.1\" value=\"" + this.A[i] + "\"/>";
            if(i > 1)
                coefficients += " x<sup>" + i + "</sup> + ";
            else
                coefficients += " x + ";
        }
        coefficients += "<input id=\"" + this.GUID + "-A\" data-index=\"0\" type=\"number\" step=\"0\" value=\"" + this.A[0] + "\"/>";

        return coefficients;
    }

    GetHtml() {
        if(!configOperation_PolynomialTemplate)
            configOperation_PolynomialTemplate = getFileContents("ConfigGui/Operation_Polynomial.html");
        var template = configOperation_PolynomialTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]min[$]/g, this.MinValue);
        template = template.replace(/[$]max[$]/g, this.MaxValue);
        template = template.replace(/[$]degree[$]/g, this.Degree);

        template = template.replace(/[$]coefficients[$]/g, this.GetCoefficientsHtml());

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([1]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Float32Array([this.MinValue]).buffer); //MinValue
        arrayBuffer = arrayBuffer.concatArray(new Float32Array([this.MaxValue]).buffer); //MaxValue
        arrayBuffer = arrayBuffer.concatArray(new Uint8Array([this.Degree]).buffer); //Degree
        arrayBuffer = arrayBuffer.concatArray(new Float32Array(this.A).buffer); //coefficients
        
        return arrayBuffer;
    }
}
InputTranslationConfigs.push(ConfigOperation_Polynomial);

var configOperation_PulseWidthPinReadTemplate;
class ConfigOperation_PulseWidthPinRead {
    static Name = "Pulse Width Pin";
    static Output = "float";
    static Inputs = [];

    constructor(){
        this.GUID = getGUID();
    }
    
    Pin = 0;
    MinFrequency = 1000;

    GetObj() {
        return { 
            Name: this.constructor.Name,
            Pin: this.Pin,
            MinFrequency: this.MinFrequency
        };
    }

    SetObj(obj) {
        this.Pin = obj.Pin;
        this.MinFrequency = obj.MinFrequency;
        $("#" + this.GUID).replaceWith(this.GetHtml());
    }

    Detach() {
        $(document).off("change."+this.GUID);
    }

    Attach() {
        var thisClass = this;

        $(document).on("change."+this.GUID, "#" + this.GUID + "-pin", function(){
            thisClass.Detach();

            thisClass.Pin = parseInt($(this).val());

            thisClass.Attach();
        });

        $(document).on("change."+this.GUID, "#" + this.GUID + "-minFrequency", function(){
            thisClass.Detach();

            thisClass.MinFrequency = parseInt($(this).val());

            thisClass.Attach();
        });
    }

    GetHtml() {
        if(!configOperation_PulseWidthPinReadTemplate)
            configOperation_PulseWidthPinReadTemplate = getFileContents("ConfigGui/Operation_PulseWidthPinRead.html");
        var template = configOperation_PulseWidthPinReadTemplate;

        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]pin[$]/g, this.Pin);
        template = template.replace(/[$]minFrequency[$]/g, this.MinFrequency);

        return template;
    }

    GetArrayBuffer() {
        var arrayBuffer = new ArrayBuffer();

        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([7]).buffer); //factory ID
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.Pin]).buffer); //pin
        arrayBuffer = arrayBuffer.concatArray(new Uint16Array([this.MinFrequency]).buffer); //minFrequency
        
        return arrayBuffer;
    }
}
InputRawConfigs.push(ConfigOperation_PulseWidthPinRead);
