function getEnvironment() {
    var obj = new Object();
    obj.isWscript = function () {
        return "undefined" !== typeof (WScript);
    }
    obj.log = function (data) {
        if (this.isWscript()) {
            WScript.Echo(data);
        } else {
            console.log(data);
        }
    }
    obj.main = function () {
        if (this.isWscript()) {
            cscGen();
        } else {
            self.onmessage = handleMessageFromMain;
        }
    }
    return obj;
}


function handleMessageFromMain(msg) {
    if (msg.data.jsonSpec === undefined) {
        return;
    }
    var jsonSpec = JSON.parse(msg.data.jsonSpec);
    var generated = generateCode(jsonSpec);
    postMessage({ 'jsonGen': generated });
}




String.prototype.indentLine = function (indentLevel) {
    var toReturn = [];
    for (var i = 0; i < indentLevel; i++) {
        toReturn.push("\t");
    }
    toReturn.push(this);
    return toReturn.join("");
}

String.prototype.formatCode = function () {
    var lines = this.split('\n');
    var output = [];
    var indent = 0;
    for (line in lines) {
        var trimmed = lines[line].trim();
        if (trimmed.length == 0) {
            continue;
        }

        if (trimmed.indexOf("{") !== -1) {
            output.push(trimmed.indentLine(indent));
            indent++;
        }
        else if (trimmed.indexOf("}") !== -1) {
            indent--;
            output.push(trimmed.indentLine(indent));
        }
        else {
            output.push(trimmed.indentLine(indent));
        }

    }
    var indented = output.join("\n");
    env.log(indented);
    return indented;
}

function generateCode(jsonSpec) {
    var languages = jsonSpec.supportedLanguages.sort(function (a, b) { return b.priority - a.priority });
    var langEnumArray = [];
    langEnumArray.push("using System;");
    langEnumArray.push("namespace " + jsonSpec.module);
    langEnumArray.push("{");
    langEnumArray.push("public enum Language");
    langEnumArray.push("{");
    for (var idx in languages) {
        var shortDesc = languages[idx].shortDesc;
        var separator = ",";
        if (idx === languages.length - 1) {
            separator = "";
        }
        langEnumArray.push(shortDesc + separator);
    }
    langEnumArray.push("}");
    langEnumArray.push("}");
    var langEnum = langEnumArray.join("\n").formatCode();


    var langDescArray = [];

    //var langDesc = `
    langDescArray.push("using System;");
    langDescArray.push("namespace " + jsonSpec.module);
    langDescArray.push("{");
    langDescArray.push("public sealed class LanguageInfo");
    langDescArray.push("{");
    langDescArray.push(" public static string ObtainDescription(Language language)");
    langDescArray.push("{");
    langDescArray.push("switch(language):");
    langDescArray.push("{");
    for (var language in languages) {
        var elem = languages[language];
        langDescArray.push("case " + elem.shortDesc + ": return \"" + elem.longDesc + "\";");
    }
    langDescArray.push("default: throw new Exception(\"No such language.\")");
    langDescArray.push("}");
    langDescArray.push("}");

    langDescArray.push("public static int ObtainPriority(Language language)");
    langDescArray.push("{");
    langDescArray.push("switch(language):");
    langDescArray.push("{");
    for (var language in languages) {
        var elem = languages[language];
        langDescArray.push("case " + elem.shortDesc + ": return \"" + elem.priority + "\";");
    }
    langDescArray.push("default: throw new Exception(\"No such language.\")");
    langDescArray.push("}");
    langDescArray.push("}");
    langDescArray.push("}");
    langDescArray.push("}");

    var langDesc = langDescArray.join("\n").formatCode();

    var enumeratedLabels = Object.getOwnPropertyNames(jsonSpec.labels);
    var translatorClassArray = [];
    translatorClassArray.push("using System;");
    translatorClassArray.push("namespace " + jsonSpec.module);
    translatorClassArray.push("{");
    translatorClassArray.push("public sealed class " + jsonSpec.translatorClass);
    translatorClassArray.push("{");

    translatorClassArray.push("private Language CurrentLanguage");
    translatorClassArray.push("{");
    translatorClassArray.push("get;");
    translatorClassArray.push("set;");
    translatorClassArray.push("}");

    translatorClassArray.push("private " + jsonSpec.translatorClass + "()");
    translatorClassArray.push("{");
    translatorClassArray.push("current = Language." + languages[0].shortDesc + ";");
    translatorClassArray.push("}");

    translatorClassArray.push("public static " + jsonSpec.translatorClass + " Instance");
    translatorClassArray.push("{");
    translatorClassArray.push("get;");
    translatorClassArray.push("} = new " + jsonSpec.translatorClass + "();");

    for (var label in enumeratedLabels) {
        var x = enumeratedLabels[label];
        translatorClassArray.push('public string ' + x);
        translatorClassArray.push('{')
        translatorClassArray.push('get');
        translatorClassArray.push('{');
        translatorClassArray.push('return CurrentLanguage switch');
        translatorClassArray.push('{')
        for (lang in languages) {
            var futureReturn = jsonSpec.labels[x][languages[lang].shortDesc];
            if (futureReturn === undefined) {
                futureReturn = '$_' + languages[lang].shortDesc + '_' + x + '_$';
            }
            translatorClassArray.push('case Language.' + languages[lang].shortDesc + ': return \"' + futureReturn + '\";');
        }
        translatorClassArray.push('default: return \"$_' + x + '_$');
        translatorClassArray.push('};')
        translatorClassArray.push('}');
        translatorClassArray.push('}');
    }
    translatorClassArray.push('}');
    translatorClassArray.push('}');

    var translatorClass = translatorClassArray.join("\n").formatCode();

    return { spec: jsonSpec, languages: langEnum, descriptions: langDesc, translator: translatorClass, translatorClassName: jsonSpec.translatorClass };
}


function cscCombinePath(basePath, fileName) {
    var fileSystemObject = WScript.CreateObject("Scripting.FileSystemObject");
    var path = fileSystemObject.BuildPath(basePath, fileName);
    return path;
}

function cscReadUtf8File(path) {
    var stream = WScript.CreateObject("ADODB.Stream");
    var adTypeText = 2;
    stream.Type = adTypeText;
    stream.Charset = "UTF-8";
    stream.Open();
    try {
        stream.LoadFromFile(path);
        var strData = stream.ReadText();
        return strData;
    } finally {
        stream.Close();
    }
}

function cscWriteUtf8File(path, data) {
    var stream = WScript.CreateObject("ADODB.Stream");
    var adTypeText = 2;
    var adSaveCreateOverWrite = 2;
    stream.Type = adTypeText;
    stream.Charset = "UTF-8";
    stream.Open();
    try {
        stream.WriteText(data);
        stream.SaveToFile(path, adSaveCreateOverWrite);
    } finally {
        stream.Close();
    }
}

function cscGen() {
    //https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/filesystemobject-object
    if (WScript.Arguments.length !== 2) {
        throw new Error("Usage is : cscript //E:JScript //D D:/Work/LocalizR/js/generator.js <JsonFileInput> <OutputDir>");
    }
    var inputFile = WScript.arguments(0);
    var outputDir = WScript.arguments(1);
    env.log("Generating classes from json file " + inputFile + " to output dir " + outputDir + " ...");

    env.log("Opening file " + inputFile + " ...");
    var unparsed = cscReadUtf8File(inputFile);
    

    //LOAD CHAKRA
    env.log("Loading CHAKRA ...")
    var htmlfile = WScript.CreateObject('htmlfile'), JSON;
    htmlfile.write('<meta http-equiv="x-ua-compatible" content="IE=9" />');
    JSON = htmlfile.parentWindow.JSON;
    Object = htmlfile.parentWindow.Object;
    String.prototype.trim = htmlfile.parentWindow.String.prototype.trim;
    htmlfile.close();

    env.log("Parsing json spec ...");
    env.log(unparsed);
    var jsonSpec = JSON.parse(unparsed);
    env.log("Loaded json to memory ...");

    env.log("Generating code ...")
    var gen = generateCode(jsonSpec);


    var langEnumFilePath = cscCombinePath(outputDir, "Language.cs");
    var langInfoFilePath = cscCombinePath(outputDir, "LanguageInfo.cs");
    var translatorClassFilePath = cscCombinePath(outputDir, gen.spec.translatorClass + ".cs");
    env.log("Writing " + langEnumFilePath + " ...");
    cscWriteUtf8File(langEnumFilePath, gen.languages);
    env.log("Writing " + langInfoFilePath + " ...");
    cscWriteUtf8File(langInfoFilePath, gen.descriptions);
    env.log("Writing " + translatorClassFilePath + " ...");
    cscWriteUtf8File(translatorClassFilePath, gen.translator);
}

var env = getEnvironment();
env.main();



