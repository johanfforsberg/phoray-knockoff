(function () {

    var $ = require('dom')
    var model = require('karlbohlmark-evented-model/index.js')

    var ObservableCollection = require('karlbohlmark-observable-collection/index.js')
    var knockoff = require("knockoff")

    var wrapperSchema = {
        "type": "object",
        "properties": {
            "class": {
                // "type": "string",
                "enum": ["Mirror", "Frame"]
            },
            "args": {
                type: "object"
            }
        }
    };

    var schema = {

        "Frame": {
            "type": "object",
            "properties": {
                "position": {
                    "type": "object",
                    "hint": "vector",  // used to pick a template
                    "properties": {
                        "x": {"type": "number"},
                        "y": {"type": "number"},
                        "z": {"type": "number"}
                    }
                },
                "children": {
                    "type": "array",
                    "item": {"type": "Wrapper"}
                }
            }
        },
        "Mirror": {
            "type": "object",
            "properties": {
                "position": {
                    "type":"object",
                    "hint": "vector",
                    "properties": {
                        "x": {"type": "number"},
                        "y": {"type": "number"},
                        "z": {"type": "number"}
                    }
                },
                "shape": {
                    "type":"string",
                    default: "sphere"
                }
            }
        },
        "Detector": {
            "type": "object",
            "properties": {
                "position": {
                    "type":"object",
                    "hint": "vector",
                    "properties": {
                        "x": {"type": "number"},
                        "y": {"type": "number"},
                        "z": {"type": "number"}
                    }
                },
                "gain": {
                    "type":"number",
                    default: 1
                }
            }
        }

    };

    var templates = {};
    $("[id^=template-]").each(function (el) {
        templates[el.get(0).id.slice(9)] = el.get(0).innerHTML;
    });

    //'compile' templates
    for (var cls in schema) {
        var properties = schema[cls].properties;
        var html = "<div>";
        for (var prop in properties) {
            var def  = properties[prop],
                type = def.hint || def.type,
                tmpl = templates[type];
            html += (Mustache.render(tmpl, {property: prop}));
        }
        templates[cls] = html + "</div>";
    }
    console.log("templates", templates);
    for (var t in templates) {
        knockoff.registerTemplate(t, templates[t]);
    }

    var Wrapper = model("Wrapper", wrapperSchema);

    Wrapper.prototype.getClassNames = function () {
        return Object.keys(schema);
    };

    Wrapper.prototype.setClass = function (v) {
        console.log("setClass", this);
        var new_class = v.target.value;
        this.args = new elementTypes[new_class](makeArgs(this.class, this.args));  //this.args);
    };

    var elementTypes = {};
    for (var name in schema) {
        elementTypes[name] = new model(name, schema[name]);
    }

    var json = {
        class: "Frame",
        args: {
            position: {x: 0, y: 1, z: -1},
            children: [
                {
                    class: "Mirror",
                    args: {
                        position: {x: -4, y: 16, z: -1},
                        color: 2121
                    }
                }
            ]
        }
    };

    function makeArgs (cls, args) {
        var filtered_args = {};
        Object.keys(args).forEach(function (prop) {
            if (prop in schema[cls].properties)
                filtered_args[prop] = args[prop];
        });
        return new elementTypes[cls](filtered_args);
    }

    function makeModel (obj) {
        var args;
        if (obj.args.children) {
            obj.args.children = obj.args.children.map(makeModel);
        }
        args = makeArgs(obj.class, obj.args);
        return new Wrapper({'class': obj.class, 'args': args});
    }

    var data = {root: makeModel(json)};

    data.root.changes()(
        function (change) {
            console.log("***CHANGE***", change);
        });

    knockoff($('#root').get(0), data);

    console.log("changing x");
    data.root.args.position.x = 7;

})();
