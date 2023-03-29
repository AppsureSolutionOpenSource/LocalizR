self.onmessage = function handleMessageFromMain(msg) {
    if (msg.data.jsonSpec === undefined) {
        return;
    }
    const jsonSpec = JSON.parse(msg.data.jsonSpec);
    const generated = generateCode(jsonSpec);
    postMessage({ 'jsonGen': generated });
}
String.prototype.indentLine = function (indentLevel) {
    return "\t".repeat(indentLevel) + this;
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
        
        if (trimmed.includes('{')) {
            output.push(trimmed.indentLine(indent));
            indent++;
        }
        else if (trimmed.includes('}')) {
            indent--;
            output.push(trimmed.indentLine(indent));
        }
        else {
            output.push(trimmed.indentLine(indent));
        }
        
    }
    var indented = output.join("\n");
    console.log(indented);
    return indented;
}

function generateCode(jsonSpec) {
    var languages = jsonSpec.supportedLanguages.sort(function (a, b) { return b.priority - a.priority });
    var langEnum = `
    using System;
    namespace ${jsonSpec.module}
    {
        public enum Language
        {
            ${languages.map((elem) => elem.shortDesc).join(",\n\t\t")}
        }
    }
    `.formatCode();
    var langDesc = `
        using System;
        namespace ${jsonSpec.module}{
            public sealed class LanguageInfo{
                public static string ObtainDescription(Language language){
                    switch(language):{
                        ${languages.map((elem) => 'case ' + elem.shortDesc + ": return \"" + elem.longDesc + "\";").join("\n\t\t\t\t\t\t")}
                        default: throw new Exception("No such language."); 
                    }
                }
                public static int ObtainPriority(Language language){
                    switch(language):{
                        ${languages.map((elem) => 'case ' + elem.shortDesc + ": return \"" + elem.priority + "\";").join("\n\t\t\t\t\t\t")}
                        default: throw new Exception("No such language."); 
                    }
                }
            }
        }
    `.formatCode();
    var enumeratedLabels = Object.getOwnPropertyNames(jsonSpec.labels);
    var translatorClass = `
        using System;
        namespace ${jsonSpec.module}{
            public sealed class ${jsonSpec.translatorClass}
            {
                private Language CurrentLanguage 
                {
                    get;
                    set;
                }
                private ${jsonSpec.translatorClass}()
                {
                    current = Language.${languages[0].shortDesc};
                }
                public static ${jsonSpec.translatorClass} Instance 
                {
                    get;
                } = new ${jsonSpec.translatorClass}();
                ${enumeratedLabels.map(
                (x) => {
                    var lines = [];
                    lines.push('public string ' + x);
                    lines.push('{')
                    lines.push('\tget');
                    lines.push('\t{');
                    lines.push('\t\treturn CurrentLanguage switch');
                    lines.push('\t\t{')
                    for (lang in languages) {
                        var futureReturn = jsonSpec.labels[x][languages[lang].shortDesc];
                        if (futureReturn === undefined) {
                            futureReturn = '$_' + languages[lang].shortDesc + '_' + x + '_$';
                        }
                        lines.push('\t\t\tcase Language.' + languages[lang].shortDesc + ': return \"' + futureReturn + '\";');
                    }
                    lines.push('\t\t\tdefault: return \"$_' + x + '_$');
                    lines.push('\t\t};')
                    lines.push('\t}');
                    lines.push('}');
                    return lines.join('\n\t\t\t\t');
                    }).join("\n\t\t\t\t")}
                }
        }
    `.formatCode();
    return { languages: langEnum, descriptions: langDesc, translator: translatorClass, translatorClassName: jsonSpec.translatorClass };
}
