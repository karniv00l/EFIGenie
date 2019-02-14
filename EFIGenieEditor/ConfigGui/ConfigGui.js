class ConfigGui extends Config {
    constructor(obj, configNameSpace, configName, parent, mainCallBack){
        super(obj, configNameSpace, configName, parent);
        this.GUID = getGUID();
        this.CallBack = mainCallBack;

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
            } else if(configRowObj instanceof ConfigNumberTable) {
                this[configRowKey] = new ConfigNumberTableGui(configRowObj, this, this.CallBack);
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

            if(GetReferenceCount(this, configRowKey) !== 1)
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

var selectionConfigGuiTemplate;
class ConfigSelectionGui extends ConfigSelection {
    constructor(obj, configNameSpace, parent, mainCallBack){
        super(obj, configNameSpace, parent);
        this.GUID = getGUID();
        this.CallBack = mainCallBack;

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

        var template = "<span id=\"span"+this.GUID+"\">";
        if(this.Selections.length > 1) {
            if(!selectionConfigGuiTemplate)
                selectionConfigGuiTemplate = getFileContents("ConfigGui/Selection.html");
            template += selectionConfigGuiTemplate;
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

var numberConfigGuiTemplate;
var numberInputOnlyConfigGuiTemplate;
class ConfigNumberGui extends ConfigNumber {
    constructor(obj, parent, callBack){
        super(obj, parent);
        this.GUID = getGUID();
        this.CallBack = callBack;

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

    GetHtml(inputOnly) {
        if(this.Hidden)
            return "";

        var template = "";
        if(inputOnly) {
            if(!numberInputOnlyConfigGuiTemplate) {
                numberInputOnlyConfigGuiTemplate = getFileContents("ConfigGui/NumberInputOnly.html");
            }
            template = numberInputOnlyConfigGuiTemplate;
        } else {
            if(!numberConfigGuiTemplate) {
                numberConfigGuiTemplate = getFileContents("ConfigGui/Number.html");
            }
            template = numberConfigGuiTemplate;
        }
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
        super(obj, parent);
        this.GUID = getGUID();
        this.CallBack = callBack;
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
            checkBoxConfigGuiTemplate = getFileContents("ConfigGui/CheckBox.html");
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

class ConfigNumberTableGui extends ConfigNumberTable {
    constructor(obj, parent, callBack){
        super(obj, parent);
        this.GUID = getGUID();
        this.CallBack = callBack;
    }

    GetConfig() {
        return JSON.parse(JSON.stringify(this, function(key, value) {
            if(key === "GUID" || key === "CallBack" || key === "Parent")
                return undefined;
            return value;
        }));
    }

    UpdateReferences() {
        $("#" + this.GUID + "table").replaceWith(this.GetTableHtml());
    }
    GetTableHtml() {
        var xResRef = GetReferenceByNumberOrReference(this.Parent, this.XResolution, 1);
        var yResRef = GetReferenceByNumberOrReference(this.Parent, this.YResolution, 1);
        var xMinRef = GetReferenceByNumberOrReference(this.Parent, this.XMin, 0);
        var xMaxRef = GetReferenceByNumberOrReference(this.Parent, this.XMax, 0);
        var yMinRef = GetReferenceByNumberOrReference(this.Parent, this.YMin, 0);
        var yMaxRef = GetReferenceByNumberOrReference(this.Parent, this.YMax, 0);

        if(xMinRef.DisplayMultiplier !== xMaxRef.DisplayMultiplier) {
            throw "XMin and XMax references do not share the same DisplayMultiplier"
        }

        if(yMinRef.DisplayMultiplier !== yMaxRef.DisplayMultiplier) {
            throw "YMin and YMax references do not share the same DisplayMultiplier"
        }

        var thisClass = this;
        $(document).off("change."+this.GUID);
        var row = "";
        var table = "";
        for(var y = 0; y < (!yResRef.Value? 2 : yResRef.Value + 1); y++) {
            var row = "<tr>"
            for(var x = 0; x < xResRef.Value + 1; x++) {
                if(y === 0) {
                    if(x === 0) {
                        // X - - -
                        // - - - -
                        // - - - -
                        // - - - -
                        if(yResRef.Value === 1 && xResRef.Value !== 1) {
                            row += "<th>" + this.XLabel + "</th>";
                        } else if(xResRef.Value === 1) {
                            row += "<th>" + this.YLabel + "</th>";
                        } else {
                            row += "<td></td>";
                        }
                    } else {
                        // - X X X
                        // - - - -
                        // - - - -
                        // - - - -
                        if(x === 1 && xMinRef.GetHtml) {
                            // - X - -
                            // - - - -
                            // - - - -
                            // - - - -
                            row += "<td>"+xMinRef.GetHtml(true)+"</td>";
                        } else if (x === xResRef.Value && xMaxRef.GetHtml) {
                            // - - - X
                            // - - - -
                            // - - - -
                            // - - - -
                            row += "<td>"+xMaxRef.GetHtml(true)+"</td>";
                        } else {
                            // - - X -
                            // - - - -
                            // - - - -
                            // - - - -
                            row += "<td><input id=\"" + this.GUID + "x" + x + "\" type=\"number\" disabled value=\"" + parseFloat(parseFloat(((xMaxRef.Value - xMinRef.Value) * (x-1) / (xResRef.Value-1) + xMinRef.Value).toFixed(6)).toPrecision(7)) + "\"/></td>";
                        }
                    }
                } else {
                    if(x === 0) {
                        // - - - -
                        // X - - -
                        // X - - -
                        // X - - -
                        if(y === 1 && yMinRef.GetHtml) {
                            // - - - -
                            // X - - -
                            // - - - -
                            // - - - -
                            row += "<td>"+yMinRef.GetHtml(true)+"</td>";
                        } else if (x === yResRef.Value && yMaxRef.GetHtml) {
                            // - - - -
                            // - - - -
                            // - - - -
                            // X - - -
                            row += "<td>"+yMaxRef.GetHtml(true)+"</td>";
                        } else {
                            // - - - -
                            // - - - -
                            // X - - -
                            // - - - -
                            if(yResRef.Value === 1) {
                                row += "<th>" + this.ZLabel + "</th>";
                            } else {
                                row += "<td><input id=\"" + id + "y" + y + "\" type=\"number\" disabled value=\"" + parseFloat(parseFloat(((yMaxRef.Value - yMinRef.Value) * (y-1) / (yResRef.Value-1) + yMinRef.Value).toFixed(6)).toPrecision(7)) + "\"/></td>";
                            }
                        }
                    } else {
                        // - - - -
                        // - X X X
                        // - X X X
                        // - X X X
                        var valuesIndex = (x-1) + xResRef.Value * (y-1);
                        var inputId =  this.GUID + "-" + valuesIndex;
                        var rowClass = $("#" + inputId).attr("class")
                        if(rowClass)
                            rowClass = " class =\"" + rowClass + "\"";
                        else
                            rowClass = "";
                        var value = this.Value[valuesIndex];
                        if(this.DisplayMultiplier)
                            value *= this.DisplayMultiplier;
                        row += "<td><input id=\"" + inputId + "\" type=\"number\" min=\"" + this.Min + "\" max=\"" + this.Max + "\" step=\"" + this.Step + "\" value=\"" + value + "\""+rowClass+"/></td>";

                        var registerOnChange = function(valuesIndex) {
                            $(document).on("change."+thisClass.GUID, "#" + inputId, function(){
                                var val = parseFloat($(this).val());
                                if(thisClass.DisplayMultiplier) 
                                    val /= thisClass.DisplayMultiplier;
                                thisClass.Value[valuesIndex] = val;
                                var selectedCount = 0;
                                $.each(thisClass.Value, function(selectedindex, value) { if ($("#" + thisClass.GUID + "-" + selectedindex).hasClass("selected")) selectedCount++; });
                                if(selectedCount > 1) {
                                    $.each(thisClass.Value, function(selectedindex, value) {
                                        var thisElement = $("#" + thisClass.GUID + "-" + selectedindex);
                                        if(thisElement.hasClass("selected"))  {
                                            thisClass.Value[selectedindex] = val;
                                        }
                                    });
                                }
                                if(thisClass.CallBack)
                                    thisClass.CallBack();
                            });
                        };

                        registerOnChange(valuesIndex);
                    }
                }
            }
            row += "</tr>";
            table += row;
        }

        $(document).off("mousedown."+this.GUID);
        $(document).off("mouseup."+this.GUID);
        $(document).off("mousemove."+this.GUID);
        $(document).off("contextmenu."+this.GUID);
        $(document).off("copy."+this.GUID);
        var selecting = false;
        var pointX;
        var pointY;
        $.each(this.Value, function(index, value) {
            $(document).on("mousedown."+thisClass.GUID, "#" + thisClass.GUID + "-" + index, function(){
                pointX =  $(this).offset().left - $(this).closest("table").offset().left;
                pointY =  $(this).offset().top - $(this).closest("table").offset().top;
                $.each(thisClass.Value, function(index, value) {
                    $("#" + thisClass.GUID + "-" + index).removeClass("selected");
                });
                $(this).addClass("selected");
                selecting = true;
            });
            $(document).on("copy."+thisClass.GUID, "#" + thisClass.GUID + "-" + index, function(e){
                var copyData = "";
                var prevRow;
                $.each(thisClass.Value, function(index, value) {
                    if($("#" + thisClass.GUID + "-" + index).hasClass("selected")) {
                        if(!prevRow)
                            prevRow = index % xResRef.Value;
                        if(prevRow !== index % xResRef.Value)
                            copyData += "\n";
                        else
                            copyData += "\t";
                        copyData += value;
                    }
                    prevRow = index % xResRef.Value;
                });
                copyData = copyData.substring(1);
                e.originalEvent.clipboardData.setData('text/plain', copyData);
                e.preventDefault();
            });
            $(document).on("paste."+thisClass.GUID, "#" + thisClass.GUID + "-" + index, function(e){
                var val = e.originalEvent.clipboardData.getData('text/plain');
                var selectedIndex = index;
                $.each(val.split("\n"), function(valIndex, val) {
                    $.each(val.split("\t"), function(valIndex, val) {
                        if(selectedIndex + valIndex < thisClass.Value.length) {
                            $("#" + thisClass.GUID + "-" + (selectedIndex + valIndex)).addClass("selected");
                            thisClass.Value[selectedIndex + valIndex] = val;
                        }
                    });
                    selectedIndex += xResRef.Value;
                });
                if(thisClass.CallBack)
                    thisClass.CallBack();
                e.preventDefault();
            });
        });

        $(document).on("mousedown."+this.GUID, "#" + this.GUID + "table", function(e){
            if(selecting)
                return;
            $.each(thisClass.Value, function(index, value) {
                $("#" + thisClass.GUID + "-" + index).removeClass("selected");
            });
        });

        $(document).on("mouseup."+this.GUID, function(e){
            selecting = false;
        });
        
        $(document).on("mousemove."+this.GUID, function(e){
            if(!selecting)
                return;
            $.each(thisClass.Value, function(index, value) {
                var thisElement = $("#" + thisClass.GUID + "-" + index);
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
        
        $.each(this.Value, function(index, value) {
            $(document).on("contextmenu."+thisClass.GUID, "#" + thisClass.GUID + "-" + index, function(){
                event.preventDefault();
            });
        });

        return "<table id=\"" + this.GUID + "table\" class=\"configtable\">" + table + "</table>";
    }
    GetHtml() {
        if(this.Hidden)
            return "";

        var xResRef = GetReferenceByNumberOrReference(this.Parent, this.XResolution, 1);
        var yResRef = GetReferenceByNumberOrReference(this.Parent, this.YResolution, 1);

        var template = "";
        if(xResRef.GetHtml && GetReferenceCount(this.Parent, this.XResolution) === 1)
            template += xResRef.GetHtml();
        if(yResRef.GetHtml && GetReferenceCount(this.Parent, this.YResolution) === 1)
            template += yResRef.GetHtml();

        template += this.GetTableHtml();
        
        var thisClass = this;
        if(this.Dialog) {
            var style = $("#" + this.GUID + "dialog").is(":visible")? "" : "style=\"display: none;\"";
            var buttonVal = $("#" + this.GUID + "edit").val();
            if(!buttonVal)
                buttonVal = "Show/Edit";

            template = "<label for=\"" + this.GUID + "edit\">" + this.Label + ":</label><input type=\"button\" id=\"" + this.GUID + "edit\" value=\""+buttonVal+"\"><div id=\"" + this.GUID + "dialog\" "+style+">" + template + "</div>";
            
            $(document).off("click."+this.GUID);
            $(document).on("click."+this.GUID, "#" + this.GUID + "edit", function(){
                if($("#" + thisClass.GUID + "dialog").is(":visible")) {
                    $("#" + thisClass.GUID + "dialog").hide();
                    $("#" + thisClass.GUID + "edit").val("Show/Edit");
                } else {
                    $("#" + thisClass.GUID + "dialog").show();
                    $("#" + thisClass.GUID + "edit").val("Hide");
                }
            });
        }

        return "<span id=\"span" + this.GUID + "\">" + template + "</span>";
    }
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
            $(document).on("change."+id, "#" + thisClass.GUID + "-" + index, function(){
                values[index] = $(this).val();
                callBack(values);
            });
        });
    }

    return template;
}

var configContainerGuiTemplate;
function wrapInConfigContainerGui(id, content)
{
    if(!configContainerGuiTemplate)
        configContainerGuiTemplate = getFileContents("ConfigGui/ConfigContainer.html");
    var template = configContainerGuiTemplate;
    template = template.replace(/[$]id[$]/g, id);
    template = template.replace(/[$]content[$]/g, content);
    return template;
}

var configDivGuiTemplate;
function wrapInConfigDivGui(id, content)
{
    if(!configDivGuiTemplate)
        configDivGuiTemplate = getFileContents("ConfigGui/ConfigDiv.html");
    var template = configDivGuiTemplate;
    template = template.replace(/[$]id[$]/g, id);
    template = template.replace(/[$]content[$]/g, content);
    return template;
}