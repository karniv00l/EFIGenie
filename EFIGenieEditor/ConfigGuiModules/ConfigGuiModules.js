var numberConfigGuiTemplate;
class ConfigNumberGui extends ConfigNumber {
    constructor(obj, parent, callBack){
        super(obj);
        this.GUID = getGUID();
        this.CallBack = callBack;
        this.Parent = parent;

        switch(this.Type) {
            case "uint8":
            case "uint16":
            case "uint32":
            case "uint64":
            case "int8":
            case "int16":
            case "int32":
            case "int64":
                if(!this.DisplayMultiplier)
                    this.DisplayMultiplier = 1;
                if(!this.Step)
                    this.Step = 1 * this.DisplayMultiplier;
                break;
            case "float":
                if(!this.DisplayMultiplier)
                    this.DisplayMultiplier = 1;
                if(!this.Step)
                    this.Step = 0.01;
                break;
        }
    }

    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {
            if(key === "GUID" || key === "CallBack" || key === "Parent")
                return undefined;
            return value;
        }));
    }

    UpdateReferences() {
        switch(this.Type) {
            case "uint8":
            case "uint16":
            case "uint32":
                if(this.Value < 0)
                this.Value = 0;
            case "int8":
            case "int16":
            case "int32":
                this.Value = Math.round(this.Value);
        }

        if(this.Value < this.Min)
            this.Value = this.Min;
        if(this.Value > this.Max)
            this.Value = this.Max;

        $("#" + this.GUID).val(this.Value * this.DisplayMultiplier)
    }

    GetHtml() {
        if(this.Hidden)
            return "";

        if(!numberConfigGuiTemplate)
            numberConfigGuiTemplate = getFileContents("ConfigGuiModules/Number.html");
        var template = numberConfigGuiTemplate;
        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]label[$]/g, this.Label);
        template = template.replace(/[$]value[$]/g, this.Value * this.DisplayMultiplier);
        template = template.replace(/[$]min[$]/g, this.Min);
        template = template.replace(/[$]max[$]/g, this.Max);
        template = template.replace(/[$]step[$]/g, this.Step);

        var thisClass = this;

        $(document).off("change."+this.GUID);
        $(document).on("change."+this.GUID, "#" + this.GUID, function(){
            thisClass.Value = parseFloat($(this).val()) / thisClass.DisplayMultiplier;
            
            thisClass.UpdateReferences();

            if(thisClass.CallBack)
                thisClass.CallBack();
        });
        return template;
    }
}

var checkBoxConfigGuiTemplate;
class ConfigBooleanGui extends ConfigBoolean {
    constructor(obj, parent, callBack){
        super(obj);
        this.GUID = getGUID();
        this.CallBack = callBack;
        this.Parent = parent;
    }

    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {
            if(key === "GUID" || key === "CallBack" || key === "Parent")
                return undefined;
            return value;
        }));
    }

    UpdateReferences() {
        $("#" + this.GUID).val(this.Value);
        console.log("ConfigBooleanGui.UpdateReferences() make sure this works");
    }

    GetHtml() {
        if(this.Hidden)
            return "";

        if(!checkBoxConfigGuiTemplate)
            checkBoxConfigGuiTemplate = getFileContents("ConfigGuiModules/CheckBox.html");
        var template = checkBoxConfigGuiTemplate;
        template = template.replace(/[$]id[$]/g, this.GUID);
        template = template.replace(/[$]label[$]/g, this.Label);
        if(this.Value)
            template = template.replace(/[$]checked[$]/g, "checked");
        else
            template = template.replace(/[$]checked[$]/g, "");
    
        var thisClass = this;

        $(document).off("change."+this.GUID);
        $(document).on("change."+this.GUID, "#" + this.GUID, function(){
            thisClass.Value = this.checked;

            thisClass.UpdateReferences();

            if(thisClass.CallBack)
                thisClass.CallBack();
        });
    
        return template;
    }
}

class ConfigNumberTableGui {

}

var selectionConfigGuiTemplate;
class ConfigSelectionGui extends ConfigSelection {
    constructor(obj, configNameSpace, parent, mainCallBack){
        super(obj, configNameSpace);
        this.GUID = getGUID();
        this.CallBack = mainCallBack;
        this.Parent = parent;

        var thisClass = this;
        this.CallBack = function() {
            if(mainCallBack)
                mainCallBack();
            thisClass.UpdateReferences();
        }

        this.Value = new ConfigGui(this.Value, this.ConfigNameSpace, undefined, this, this.CallBack);
    }

    SetArrayBuffer(arrayBuffer) {
        var size = super.SetArrayBuffer(arrayBuffer);
        this.Value = new ConfigGui(this.Value, this.ConfigNameSpace, undefined, this, this.CallBack);
        return size;
    }

    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {   
            if(key === "ConfigNameSpace" || key === "GUID" || key === "CallBack" || key === "Parent")    
                return undefined;   
            if(key != "" && value.GetConfig) 
                return value.GetConfig();  
            return value;
        }));
    }
    
    UpdateReferences() {
        this.Value.UpdateReferences();
    }

    GetHtml() {
        if(this.Hidden)
            return "";

        if(!selectionConfigGuiTemplate)
            selectionConfigGuiTemplate = getFileContents("ConfigGuiModules/Selection.html");
        var template = "<span id=\"span"+this.GUID+"\">";
        if(this.Selections.length > 1) {
            template = selectionConfigGuiTemplate;
            template = template.replace(/[$]id[$]/g, this.GUID);
            template = template.replace(/[$]label[$]/g, this.Label);
            var selectionHtml = "";
            var thisClass = this;
            $.each(this.Selections, function(selectionIndex, selectionValue) {
                if(selectionIndex === parseInt(thisClass.Index))
                    selectionHtml += "<option selected value=\"" + selectionIndex + "\">" + selectionValue.Name + "</option>";
                else
                    selectionHtml += "<option value=\"" + selectionIndex + "\">" + selectionValue.Name + "</option>";
            });
            template = template.replace(/[$]selections[$]/g, selectionHtml);
            
            $(document).off("change."+this.GUID);
            $(document).on("change."+this.GUID, "#" + this.GUID, function(){
                var selectionIndex = parseInt($(this).val());
                var selection = thisClass.Selections[selectionIndex];

                thisClass.Index = selectionIndex;
                thisClass.Value.Config = selection.Config;
                thisClass.Value.ConfigName = selection.ConfigName;

                thisClass.Value = new ConfigGui(thisClass.Value, thisClass.ConfigNameSpace, undefined, thisClass, thisClass.CallBack);
                $("#span" + thisClass.GUID).replaceWith(thisClass.GetHtml());
            });

            $(document).off("click."+this.GUID);
            $(document).on("click."+this.GUID, "#" + this.GUID + "clear", function(){
                thisClass.Value = new ConfigGui(undefined, thisClass.ConfigNameSpace, thisClass.Value.ConfigName, thisClass, thisClass.CallBack);
                $("#span" + thisClass.GUID).replaceWith(thisClass.GetHtml());
            });
        }

        template += this.Value.GetHtml();

        return template + "</span>";
    }
}

class ConfigGui extends Config {
    constructor(obj, configNameSpace, configName, parent, mainCallBack){
        super(obj, configNameSpace, configName);
        this.GUID = getGUID();
        this.CallBack = mainCallBack;
        this.Parent = parent;

        var thisClass = this;
        this.CallBack = function() {
            if(mainCallBack)
                mainCallBack();
            thisClass.UpdateReferences();
        }

        for(var configRowIndex in this.Config) {
            var configRow = this.Config[configRowIndex];
            var configRowKey = Object.keys(configRow)[0];
            var configRowObj = this[configRowKey];

            if(configRowObj instanceof ConfigNumber) {
                this[configRowKey] = new ConfigNumberGui(configRowObj, this, this.CallBack);
            } else if(configRowObj instanceof ConfigBoolean) {
                this[configRowKey] = new ConfigBooleanGui(configRowObj, this, this.CallBack);
            } else if(configRowObj instanceof Config) {
                this[configRowKey] = new ConfigGui(configRowObj, this[configRowKey].ConfigNameSpace, undefined, this, this.CallBack);
            } else if(configRowObj instanceof ConfigSelection) {
                this[configRowKey] = new ConfigSelectionGui(configRowObj, this[configRowKey].ConfigNameSpace, this, this.CallBack);
            }
        }
    }

    GetConfig() {
        var returnConfig = []
        for(var configRowIndex in this.Config) {
            var configRow = this.Config[configRowIndex];
            var configRowKey = Object.keys(configRow)[0];
            var configRowObj = this[configRowKey];

            if(!configRowObj)
                throw "Config not initialized";

            var configRowValue = configRowObj.GetConfig();

            var returnConfigRow = {};
            returnConfigRow[configRowKey] = configRowValue;
            
            returnConfig.push(returnConfigRow);
        }
        this.Config = returnConfig;
        
        return JSON.parse(JSON.stringify(this, function(key, value) { 
            if(key === "ConfigNameSpace" || key === "GUID" || key === "CallBack" || key === "Parent")
                return undefined;
            for(var configRowIndex in this.Config) {
                var configRow = this.Config[configRowIndex];

                if(key === Object.keys(configRow)[0]) {
                    return undefined;
                }
            }
            if(key != "" && value.GetConfig) 
                return value.GetConfig();  
            
            return value;
        }));
    }
    
    UpdateReferences() {
        for(var configRowIndex in this.Config) {
            var configRow = this.Config[configRowIndex];
            var configRowKey = Object.keys(configRow)[0];
            var configRowObj = this[configRowKey];
            
            if(!configRowObj || !configRowObj.UpdateReferences)
                continue; //throw "ConfigGui not initialized";
                
            configRowObj.UpdateReferences();
        }
    }

    GetHtml() {
        if(this.Hidden)
            return "";

        var template = "";

        for(var configRowIndex in this.Config) {
            var configRow = this.Config[configRowIndex];
            var configRowKey = Object.keys(configRow)[0];
            var configRowObj = this[configRowKey];
            
            if(!configRowObj || !configRowObj.GetHtml)
                continue; //throw "ConfigGui not initialized";

            template += configRowObj.GetHtml();
        }
    
        if(this.WrapInConfigContainer)
            template = wrapInConfigContainerGui(this.GUID, template);
        else
            template = wrapInConfigDivGui(this.GUID, template);

            if(this.Label) {
                if(this.SameLine) 
                    template = "<label for=\"" + this.GUID + "\" class=\"subConfigSameLineLabel\">" + this.Label + ":</label>" + template;
                else
                    template = "<label for=\"" + this.GUID + "\" class=\"subConfigLabel\">" + this.Label + "</label><span class=\"sameLineSpacer\"></span>" + template;
            }

        return "<span id=\"span"+this.GUID+"\">" + template + "</span>";
    }
}

function getNumberTableConfigGui(id, dialog, label,
    zlabel, values, min, max, step, displayMultiplier, callBack, 
    xlabel, xMin, xMinMin, xMinMax, xMinStep, xMinDisplayMultiplier, xMinCallBack, 
    xMax, xMaxMin, xMaxMax, xMaxStep, xMaxDisplayMultiplier, xMaxCallBack, 
    xRes, xResMin, xResMax, xResStep, xResDisplayMultiplier, xResCallBack, 
    ylabel, yMin, yMinMin, yMinMax, yMinStep, yMinDisplayMultiplier, yMinCallBack, 
    yMax, yMaxMin, yMaxMax, yMaxStep, yMaxDisplayMultiplier, yMaxCallBack, 
    yRes, yResMin, yResMax, yResStep, yResDisplayMultiplier, yResCallBack) {

    var template = "";
    if(xResCallBack)
        template += getNumberConfigGui(id + "xres", "X Resolution", xRes, xResMin, xResMax, xResStep, xResDisplayMultiplier, xResCallBack) + "<br>";
    if(yResCallBack)
        template += getNumberConfigGui(id + "yres", "Y Resolution", yRes, yResMin, yResMax, yResStep, yResDisplayMultiplier, yResCallBack) + "<br>";
    
    if(xMinDisplayMultiplier) {
        xMin *= xMinDisplayMultiplier;
    }
    if(xMaxDisplayMultiplier) {
        xMin *= xMaxDisplayMultiplier;
    }
    if(yMinDisplayMultiplier) {
        yMin *= yMinDisplayMultiplier;
    }
    if(yMaxDisplayMultiplier) {
        yMin *= yMaxDisplayMultiplier;
    }

    if(xMinDisplayMultiplier !== xMaxDisplayMultiplier) {
        throw "XMin and XMax references do not share the same DisplayMultiplier"
    }

    if(yMinDisplayMultiplier !== yMaxDisplayMultiplier) {
        throw "YMin and YMax references do not share the same DisplayMultiplier"
    }

    $(document).off("change."+id);
    var row = "";
    var table = "";
    for(var y = 0; y < (!yRes? 2 : yRes + 1); y++) {
        var row = "<tr>"
        for(x = 0; x < xRes + 1; x++) {
            if(y === 0) {
                if(x === 0) {
                    // X - - -
                    // - - - -
                    // - - - -
                    // - - - -
                    if(!yRes) {
                        row += "<th>" + xlabel + "</th>";
                    } else {
                        row += "<td></td>";
                    }
                } else {
                    // - X X X
                    // - - - -
                    // - - - -
                    // - - - -
                    if(x === 1 && xMinCallBack) {
                        // - X - -
                        // - - - -
                        // - - - -
                        // - - - -
                        row += "<td><input id=\"" + id + "xmin\" type=\"number\" min=\"" + xMinMin + "\" max=\"" + xMinMax + "\" step=\"" + xMinStep + "\" value=\"" + xMin + "\"/></td>";
                        
                        $(document).on("change."+id, "#" + id + "xmin", function(){
                            val = parseFloat($(this).val());
                            if(xMinDisplayMultiplier) 
                                val /= xMinDisplayMultiplier;
                            xMinCallBack(val);
                        });
                    } else if (x === xRes && xMaxCallBack) {
                        // - - - X
                        // - - - -
                        // - - - -
                        // - - - -
                        row += "<td><input id=\"" + id + "xmax\" type=\"number\" min=\"" + xMaxMin + "\" max=\"" + xMaxMax + "\" step=\"" + xMaxStep + "\" value=\"" + xMax + "\"/></td>";
                        
                        $(document).on("change."+id, "#" + id + "xmax", function(){
                            val = parseFloat($(this).val());
                            if(xMaxDisplayMultiplier) 
                                val /= xMaxDisplayMultiplier;
                            xMaxCallBack(val);
                        });
                    } else {
                        // - - X -
                        // - - - -
                        // - - - -
                        // - - - -
                        row += "<td><input id=\"" + id + "x" + x + "\" type=\"number\" disabled value=\"" + parseFloat(parseFloat(((xMax - xMin) * x / (values.length-1) + xMin).toFixed(6)).toPrecision(7)) + "\"/></td>";
                    }
                }
            } else {
                if(x === 0) {
                    // - - - -
                    // X - - -
                    // X - - -
                    // X - - -
                    if(y === 1 && yMinCallBack) {
                        // - - - -
                        // X - - -
                        // - - - -
                        // - - - -
                        row += "<td><input id=\"" + id + "ymin\" type=\"number\" min=\"" + yMinMin + "\" max=\"" + yMinMax + "\" step=\"" + yMinStep + "\" value=\"" + yMin + "\"/></td>";
                        
                        $(document).on("change."+id, "#" + id + "ymin", function(){
                            val = parseFloat($(this).val());
                            if(yMinDisplayMultiplier) 
                                val /= yMinDisplayMultiplier;
                            yMinCallBack(val);
                        });
                    } else if (x === xRes && xMaxCallBack) {
                        // - - - -
                        // - - - -
                        // - - - -
                        // X - - -
                        row += "<td><input id=\"" + id + "ymax\" type=\"number\" min=\"" + yMaxMin + "\" max=\"" + yMaxMax + "\" step=\"" + yMaxStep + "\" value=\"" + yMax + "\"/></td>";
                        
                        $(document).on("change."+id, "#" + id + "ymax", function(){
                            val = parseFloat($(this).val());
                            if(yMaxDisplayMultiplier) 
                                val /= yMaxDisplayMultiplier;
                            yMaxCallBack(val);
                        });
                    } else {
                        // - - - -
                        // - - - -
                        // X - - -
                        // - - - -
                        if(!yRes) {
                            row += "<th>" + zlabel + "</th>";
                        } else {
                            row += "<td><input id=\"" + id + "y" + y + "\" type=\"number\" disabled value=\"" + parseFloat(parseFloat(((yMax - yMin) * y / (values.length-1) + yMin).toFixed(6)).toPrecision(7)) + "\"/></td>";
                        }
                    }
                } else {
                    // - - - -
                    // - X X X
                    // - X X X
                    // - X X X
                    var valuesIndex = (x-1) + xRes * (y-1);
                    var inputId =  id + valuesIndex;
                    var rowClass = $("#" + inputId).attr("class")
                    if(rowClass)
                        rowClass = " class =\"" + rowClass + "\"";
                    else
                        rowClass = "";
                    var value = values[valuesIndex];
                    if(displayMultiplier)
                        value *= displayMultiplier;
                    row += "<td><input id=\"" + inputId + "\" type=\"number\" min=\"" + min + "\" max=\"" + max + "\" step=\"" + step + "\" value=\"" + value + "\""+rowClass+"/></td>";

                    if(callBack) {
                        var registerOnChange = function(valuesIndex) {
                            $(document).on("change."+id, "#" + inputId, function(){
                                val = parseFloat($(this).val());
                                if(displayMultiplier) 
                                    val /= displayMultiplier;
                                values[valuesIndex] = val;
                                var selectedCount = 0;
                                $.each(values, function(selectedindex, value) { if ($("#" + id + selectedindex).hasClass("selected")) selectedCount++; });
                                if(selectedCount > 1) {
                                    $.each(values, function(selectedindex, value) {
                                        var thisElement = $("#" + id + selectedindex);
                                        if(thisElement.hasClass("selected"))  {
                                            values[selectedindex] = val;
                                        }
                                    });
                                }
                                callBack(values);
                            });
                        }

                        registerOnChange(valuesIndex);
                    }
                }
            }
        }
        row += "</tr>";
        table += row;
    }
    template += "<table id=\"" + id + "table\" class=\"configtable\">" + table + "</table>";
    
    $(document).off("mousedown."+id);
    $(document).off("mouseup."+id);
    $(document).off("mousemove."+id);
    $(document).off("contextmenu."+id);
    $(document).off("copy."+id);
    var selecting = false;
    var pointX;
    var pointY;
    $.each(values, function(index, value) {
        $(document).on("mousedown."+id, "#" + id + index, function(){
            pointX =  $(this).offset().left - $(this).closest("table").offset().left;
            pointY =  $(this).offset().top - $(this).closest("table").offset().top;
            $.each(values, function(index, value) {
                $("#" + id + index).removeClass("selected");
            });
            $(this).addClass("selected");
            selecting = true;
        });
        $(document).on("copy."+id, "#" + id + index, function(e){
            var copyData = "";
            var prevRow;
            $.each(values, function(index, value) {
                if($("#" + id + index).hasClass("selected")) {
                    if(!prevRow)
                        prevRow = index % xRes;
                    if(prevRow !== index % xRes)
                        copyData += "\n";
                    else
                        copyData += "\t";
                    copyData += value;
                }
                prevRow = index % xRes;
            });
            copyData = copyData.substring(1);
            e.originalEvent.clipboardData.setData('text/plain', copyData);
            e.preventDefault();
        });
        $(document).on("paste."+id, "#" + id + index, function(e){
            var val = e.originalEvent.clipboardData.getData('text/plain');
            var selectedIndex = index;
            $.each(val.split("\n"), function(valIndex, val) {
                $.each(val.split("\t"), function(valIndex, val) {
                    if(selectedIndex + valIndex < values.length) {
                        $("#" + id + (selectedIndex + valIndex)).addClass("selected");
                        values[selectedIndex + valIndex] = val;
                    }
                });
                selectedIndex += xRes;
            });
            callBack(values);
            e.preventDefault();
        });
    });

    $(document).on("mousedown."+id, "#" + id + "table", function(e){
        if(selecting)
            return;
        $.each(values, function(index, value) {
            $("#" + id + index).removeClass("selected");
        });
    });

    $(document).on("mouseup."+id, function(e){
        selecting = false;
    });
    
    $(document).on("mousemove."+id, function(e){
        if(!selecting)
            return;
        $.each(values, function(index, value) {
            var thisElement = $("#" + id + index);
            var thisTable = thisElement.closest("table")
            var relX = e.pageX - thisTable.offset().left;
            var elX = thisElement.offset().left - thisTable.offset().left + (thisElement.width() / 2);
            var relY = e.pageY - thisTable.offset().top;
            var elY = thisElement.offset().top - thisTable.offset().top + (thisElement.height() / 2);
            if(((elX <= relX && elX >= pointX) || (elX >= relX && elX <= pointX) || (pointX == thisElement.offset().left - thisTable.offset().left)) &&
                ((elY <= relY && elY >= pointY) || (elY >= relY && elY <= pointY) || (pointY == thisElement.offset().top - thisTable.offset().top))) {
                thisElement.addClass("selected");
            } else {
                thisElement.removeClass("selected");
            }
        });
    });
    
    $.each(values, function(index, value) {
        $(document).on("contextmenu."+id, "#" + id + index, function(){
            event.preventDefault();
        });
    });

    if(dialog) {
        var style = $("#" + id + "dialog").is(":visible")? "" : "style=\"display: none;\"";
        var buttonVal = $("#" + id + "edit").val();
        if(!buttonVal)
            buttonVal = "Show/Edit";

        template = "<label for=\"" + id + "edit\">" + label + ":</label><input type=\"button\" id=\"" + id + "edit\" value=\""+buttonVal+"\"><div id=\"" + id + "dialog\" "+style+">" +"<span class=\"configElementSpan\">" + template + "</span>" + "</div>";
        
        $(document).off("click."+id);
        $(document).on("click."+id, "#" + id + "edit", function(){
            if($("#" + id + "dialog").is(":visible")) {
                $("#" + id + "dialog").hide();
                $("#" + id + "edit").val("Show/Edit");
            } else {
                $("#" + id + "dialog").show();
                $("#" + id + "edit").val("Hide");
            }
        });
    }

    return template;
}

function getFormulaConfigGui(id, label, values, min, max, step, callBack) {
    var template = "<label>" + label + ":</label>";
    for(var i = values.length-1; i > 0; i--)
    {
        template += "<input id=\"" + id + i + "\" type=\"number\" min=\"" + min + "\" max=\"" + max + "\" step=\"" + step + "\" value=\"" + values[i] + "\"/>";
        if(i > 1)
            template += " x<sup>" + i + "</sup> + ";
        else
            template += " x + ";
    }
    template += "<input id=\"" + id + 0 + "\" type=\"number\" min=\"" + min + "\" max=\"" + max + "\" step=\"" + step + "\" value=\"" + values[0] + "\"/>";
    
    $(document).off("change."+id);
    if(callBack) {
        $.each(values, function(index, value) {
            $(document).on("change."+id, "#" + id + index, function(){
                values[index] = $(this).val();
                callBack(values);
            });
        });
    }

    return template;
}

var selectionConfigGuiTemplate;
function getSelectionConfigGui(id, label, value, selections, callBack, clearCallBack) {
    if(!selectionConfigGuiTemplate)
        selectionConfigGuiTemplate = getFileContents("ConfigGuiModules/Selection.html");
    if(selections.length < 2) {
        return "";
    }
    var template = selectionConfigGuiTemplate;
    template = template.replace(/[$]id[$]/g, id);
    template = template.replace(/[$]label[$]/g, label);
    var selectionHtml = "";
    $.each(selections, function(selectionIndex, selectionValue) {
        if(selectionIndex === parseInt(value.Index))
            selectionHtml += "<option selected value=\"" + selectionIndex + "\">" + selectionValue.Name + "</option>";
        else
            selectionHtml += "<option value=\"" + selectionIndex + "\">" + selectionValue.Name + "</option>";
    });
    template = template.replace(/[$]selections[$]/g, selectionHtml);
    
    $(document).off("change."+id);
    if(callBack) {
        $(document).on("change."+id, "#" + id, function(){
            callBack($(this).val());
        });
    }
    $(document).off("click."+id);
    if(clearCallBack) {
        $(document).on("click."+id, "#" + id + "clear", function(){
            clearCallBack();
        });
    }

    return template;
}

var ShowAdvanced = false;
function getIniConfigGui(obj, ini, idPrefix, mainCallBack) {
    var template = "";

    var reRender = function() {
        var element = document.activeElement;
        $("#span" + idPrefix).html(obj.GetHtml());
        var newElement = document.getElementById(element.id);
        if(newElement)
            newElement.focus();
    }

    var callBack = function() {
        obj.IsDefaultValues = false;
        if(mainCallBack)
            mainCallBack(obj);
        else
            reRender();
    }

    var firstElement = true;

    var addIniRow = function(iniIndex, iniRow){    
        var location = iniGetLocation(obj, iniRow, iniIndex);
        
        if(location === "static")
            return;

        var elementTemplate = "";
        var hideElement = false;

        var label = iniGetLabel(obj, iniRow);
        var value = iniGetValue(obj, iniRow, iniIndex);
        var min = iniGetMin(obj, iniRow);
        var max = iniGetMax(obj, iniRow);
        var step = iniGetStep(obj, iniRow);

        if(typeof iniRow.Type === "string")
        {
            switch(iniRow.Type.split("[")[0]) {
                case "label":
                    if(ShowAdvanced || !iniRow.Advanced) {
                        elementTemplate += "<label>" + label + "</label>";
                    }
                    break;
                case "bool":
                    if(ShowAdvanced || !iniRow.Advanced) {
                        elementTemplate += getCheckBoxConfigGui(idPrefix + location, label, value, function(value){
                            obj[location] = value;
                            callBack();
                        });
                    }
                    obj[location] = value;
                    break;
                case "uint8":
                case "uint16":
                case "uint32":
                case "int8":
                case "int16":
                case "int32":
                case "float":
                    if(ShowAdvanced || !iniRow.Advanced) {
                        if(iniRow.Type.split("[").length === 2) {
                            var xRes = iniRow.Type.split("[")[1].split("]")[0];
                            var xMinRef = valueIsReferenceLocation(iniRow.XMin)? ini.find(function(element) { return element.Location === iniRow.XMin}): undefined;
                            var xMaxRef = valueIsReferenceLocation(iniRow.XMin)? ini.find(function(element) { return element.Location === iniRow.XMax}): undefined;
                            var xResRef = valueIsReferenceLocation(xRes)? ini.find(function(element) { return element.Location === xRes}): undefined;
                            
                            elementTemplate += getNumberTableConfigGui(idPrefix + location, iniRow.Dialog, label,
                                iniRow.ZLabel, value, min, max, step, iniRow.DisplayMultiplier, function(value){
                                        obj[location] = value;
                                        callBack();
                                    }, 
                                iniRow.XLabel, parseValueString(obj, iniRow.XMin), xMinRef? xMinRef.Min : undefined, xMinRef? xMinRef.Max : undefined, xMinRef? xMinRef.Step : undefined,  xMinRef? xMinRef.DisplayMultiplier : undefined, xMinRef ? function(value){
                                        obj[iniRow.XMin] = value;
                                        callBack();
                                    } : undefined, 
                                parseValueString(obj, iniRow.XMax), xMaxRef? xMaxRef.Min : undefined, xMaxRef? xMaxRef.Max : undefined, xMaxRef? xMaxRef.Step : undefined, xMaxRef? xMaxRef.DisplayMultiplier : undefined, xMaxRef ? function(value){
                                        obj[iniRow.XMax] = value;
                                        callBack();
                                    } : undefined, 
                                parseValueString(obj, xRes), xResRef? xResRef.Min : undefined, xResRef? xResRef.Max : undefined, xResRef? xResRef.Step : undefined, xResRef? xResRef.DisplayMultiplier : undefined, xResRef ? function(value){
                                        obj[xRes] = value;
                                        callBack();
                                    } : undefined)
                            // elementTemplate += getNumberArrayConfigGui(idPrefix + location, iniRow.Dialog, label, iniRow.XLabel, iniRow.ZLabel, value, min, max, step, iniRow.DisplayMultiplier, function(value){
                            //         obj[location] = value;
                            //         callBack();
                            //     }, parseValueString(obj, iniRow.XMin), xMinRef? xMinRef.Min : undefined, xMinRef? xMinRef.Max : undefined, xMinRef? xMinRef.Step : undefined, xMinRef ? function(value){
                            //         obj[iniRow.XMin] = value;
                            //         callBack();
                            //     } : undefined, parseValueString(obj, iniRow.XMax), xMaxRef? xMaxRef.Min : undefined, xMaxRef? xMaxRef.Max : undefined, xMaxRef? xMaxRef.Step : undefined, xMaxRef ? function(value){
                            //         obj[iniRow.XMax] = value;
                            //         callBack();
                            //     } : undefined, xMinRef.DisplayMultiplier, parseValueString(obj, xRes), xResRef? xResRef.Min : undefined, xResRef? xResRef.Max : undefined, xResRef? xResRef.Step : undefined, xResRef? xResRef.DisplayMultiplier : undefined, xResRef ? function(value){
                            //         obj[xRes] = value;
                            //         callBack();
                            //     } : undefined);
                        } else {
                            var referencedBy = iniReferencedByIniRow(ini, location);
                            if(referencedBy.length !== 1 || (referencedBy[0].XMin !== location && referencedBy[0].XMax !== location && 
                                                            referencedBy[0].YMin !== location && referencedBy[0].YMax !== location && 
                                                            (referencedBy[0].Type.split("[").length < 2 || referencedBy[0].Type.split("[")[1].split("]")[0] !== location) && 
                                                            (referencedBy[0].Type.split("[").length < 3 || referencedBy[0].Type.split("[")[2].split("]")[0] !== location))){
                                elementTemplate += getNumberConfigGui(idPrefix + location, label, value, min, max, step, iniRow.DisplayMultiplier, function(value){
                                    obj[location] = value;
                                    callBack();
                                });
                            } else {
                                hideElement = true;
                            }
                        }
                    }
                    obj[location] = value;
                    break;
                case "formula":
                    if(ShowAdvanced || !iniRow.Advanced) {
                        elementTemplate += getFormulaConfigGui(idPrefix + location, label, value, min, max, step, function(value) {
                            obj[location] = value;
                            callBack();
                        });
                    }
                    obj[location] = value;
                    break;
                case "iniselection":
                    if(ShowAdvanced || !iniRow.Advanced) {
                        elementTemplate += "<span>" + getSelectionConfigGui(idPrefix + location, label, value, iniRow.Selections, function(value) {
                            obj[location].Index = value;
                            if(!obj[location].Value || obj[location].Value.IsDefaultValues)
                                obj[location] = { Index: value, Value: new ConfigGui(obj.iniNameSpace, iniRow.Selections[value].Ini,callBack())}
                            else
                                obj[location].Value.ini = iniRow.Selections[value].Ini
                            callBack();
                        }, function() {
                            obj[location].Value = new ConfigGui(obj.iniNameSpace, iniRow.Selections[obj[location].Index].Ini, callBack)
                            callBack();
                        }) + "</span>";
                    }
                    if(!value.Value)
                        obj[location] = { Index: value.Index, Value: new ConfigGui(obj.iniNameSpace, iniRow.Selections[value.Index].Ini, callBack )}
                        var innerHtml = obj[location].Value.GetHtml();
                    
                    if(innerHtml != "") {
                        if(iniRow.WrapInConfigContainer)
                            elementTemplate += "<br>" + wrapInConfigContainerGui("", innerHtml);
                        else
                            elementTemplate += innerHtml;
                    }
                    break;
                default:
                    break;
            }
        } else {
            if(!obj[location])
                obj[location] = new ConfigGui(obj.iniNameSpace, iniRow.Ini,callBack );

            var innerHtml = obj[location].GetHtml();
            if(innerHtml != "") {
                if(label) {
                    if(iniRow.SameLine) 
                        elementTemplate = "<label for=\"span" + idPrefix + location + "\" class=\"subConfigSameLineLabel\">" + label + ":</label>" + elementTemplate;
                    else
                        elementTemplate = "<label for=\"span" + idPrefix + location + "\" class=\"subConfigLabel\">" + label + "</label><span class=\"sameLineSpacer\"></span>" + elementTemplate;
                }
                if(iniRow.WrapInConfigContainer)
                    elementTemplate += wrapInConfigContainerGui(obj[location].GUID, innerHtml);
                else
                    elementTemplate += innerHtml;
            }
        }
        if(elementTemplate != "") {
            elementTemplate = "<span class=\"configElementSpan\" id=\"span" + idPrefix + location + "\">" + elementTemplate + "</span>";

            if(!firstElement) {
                if(iniRow.SameLine) {
                    elementTemplate = "<span class=\"sameLineSpacer\"></span>" + elementTemplate;
                } else {
                    elementTemplate = "<br>" + elementTemplate;
                }
            }

            if(!hideElement) {
                firstElement = false;
                template += elementTemplate;
            }
        }
    }

    $.each(ini, addIniRow);
    
    if(template != "") {
        template = "<span id=\"span" + idPrefix + "\" class=\"configElementSpan\">" + template + "</span>";
    }

    return template;
}


var configContainerGuiTemplate;
function wrapInConfigContainerGui(id, content)
{
    if(!configContainerGuiTemplate)
        configContainerGuiTemplate = getFileContents("ConfigGuiModules/ConfigContainer.html");
    var template = configContainerGuiTemplate;
    template = template.replace(/[$]id[$]/g, id);
    template = template.replace(/[$]content[$]/g, content);
    return template;
}

var configDivGuiTemplate;
function wrapInConfigDivGui(id, content)
{
    if(!configDivGuiTemplate)
        configDivGuiTemplate = getFileContents("ConfigGuiModules/ConfigDiv.html");
    var template = configDivGuiTemplate;
    template = template.replace(/[$]id[$]/g, id);
    template = template.replace(/[$]content[$]/g, content);
    return template;
}