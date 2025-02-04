var BooleanOutputConfigs = [];

class Output_Digital extends UITemplate {
    static Name = `Digital Pin`;
    static Inputs = [`bool`];
    static Template = `<div><label for="$Pin.GUID$">Pin:</label>$Pin$$Inverted$Inverted $HighZ$High Z</div>`

    constructor(prop){
        super();
        this.Pin = new UIPinSelection({
            Value: 0xFFFF,
            PinType: `digital`
        });
        this.Inverted = new UICheckbox();
        this.HighZ = new UICheckbox();
        this.Setup(prop);
    }

    GetObjOperation(inputVariableId) {
        var objOperation = { value: [
            { type: `UINT32`, value: EmbeddedOperationsFactoryIDs.Offset + EmbeddedOperationsFactoryIDs.DigitalOutput }, //variable
            { type: `UINT16`, value: this.Pin.Value },
            { type: `UINT8`, value: this.Inverted.Value | (this.HighZ.Value? 0x02 : 0x00) }
        ]};

        if (inputVariableId) {
            return Packagize(objOperation, {
                inputVariables: [ inputVariableId ]
            })
        }

        return objOperation;
    }
}
BooleanOutputConfigs.push(Output_Digital);