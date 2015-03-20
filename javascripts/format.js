var TermFrag = "";
var TermFragTmp = "";
var QueryFormer = "";
var QueryLatter = "";
var CaretPosition = 0;
var DefaltPrefix = ["rdf:", "rdfs:", "owl:", "dc:", "dcterm:", "skos:", "foaf:", "xsd:"]
var SparqlTerm = ["FILTER ()", "REGEX ()", "REPLACE ()", "CONTAINS ()", "BIND ()", "BOUND ()", "STR ()", "IF ()", "COALESCE ()", "EXIST {}", "NOT EXIST {}", "SameTerm ()", "IN ()", "NOT IN ()", "IRI ()", "IsIRI ()", "IsBlank ()", "IsLiteral ()", "IsNumeric ()", "LANG ()", "DATATYPE ()", "BNODE ()", "STRDT ()", "STRLANG ()", "UUID ()", "STRUUID ()", "STRLEN ()", "SUBSTR ()", "UCASE ()", "LCASE ()", "STRSTARTS ()", "STRENDS ()", "STRBEFORE ()", "STRAFTER ()", "ENCODE_FOR_URI ()", "CONCAT ()", "LangMatches ()", "ABS ()", "ROUND ()", "CEIL ()", "FLOOR ()", "RAND ()", "NOW ()", "YEAR ()", "MONTH ()", "DAY ()", "HOURS ()", "MINUITES ()", "SECONDS ()", "TIMEZONE ()", "TZ ()", "MD5 ()", "SHA1 ()", "SHA256 ()", "SHA384 ()", "SHA512 ()", "PREFIX", "SELECT", "DISTINCT", "REDUCED", "FROM", "GRAPH", "WHERE", "UNION", "VALUES", "ORDER BY", "GROUP BY", "LIMIT", "OFFSET", "DESCRIBE", "CONSTRUCT {}", "ASK {}", "MINUS {}", "OPTIONAL {}"];

var TextAreaName = 'query';
var IndentUnit = 4;

// event
document.onkeydown = function (e){
    var textarea = document.activeElement;
    var name = textarea.name;
    if(name = TextAreaName && e.keyCode == 9) return false;
    if(name != TextAreaName && e.keyCode == 9) textarea.spellcheck = false;
    if(name = TextAreaName && TermFrag && e.keyCode == 13){
	TermFrag = "";
	return false;
    }
}

document.onkeyup = function (e){
    var key_code = e.keyCode;
    var textarea = document.activeElement;
    var name = textarea.name;
    if(name = TextAreaName){
        // tabulator
	if(key_code != 9) TermFrag = "";
	if(key_code == 9) tabKeyUp(textarea);
    }
}

document.onclick = function (){
    var textarea = document.activeElement;
    var name = textarea.name;
    if(name = TextAreaName){
	TermFrag = "";
	textarea.spellcheck = false;
    }
}


function tabKeyUp(textarea){
    var flag = setIndent(textarea);
    if(flag){
	if(!TermFrag) getTermFrag(textarea);
	if(!TermFrag) return 0;
	else autoCompletion(textarea);
    }
}

function setIndent(textarea){
    var position = textarea.selectionStart;
    var value = textarea.value;
    var lines = value.substr(0, position).split("\n");
    var caretLine = lines.length - 1;
    var caretLinePosition = lines[lines.length - 1].length;
    lines = value.split(/\n/);
    var formerText = [];
    var latterText = [];
    for(var i = 0; i < caretLine; i++){ formerText.push(lines[i]); }
    for(var i = caretLine + 1; i < lines.length; i++){ latterText.push(lines[i]); }
    var caretText = lines[caretLine];
    var caretLineIndent = caretText.replace(/^( *).*/, "$1");

    var beforeLine = "";
    for(var i = 1; i < formerText.length; i++){
	beforeLine = formerText[formerText.length - i];
	if(beforeLine.match(/[^\s]/) && !beforeLine.match(/^\s*#/)) break;
    }

    var spaceCount = 0;
    var words = beforeLine.replace(/^\s*/, "").replace(/\./, "").replace(/;/, "").replace(/\s*$/, "").replace(/\[[^\]]+\]/g, "[]").replace(/, +/g, "").split(/\s+/);
    var beforeTmp = beforeLine;
    var bracket = beforeTmp.replace(/\"[^\"]*\"/g, "").replace(/[^\(\)\{\}\[\]]/g, "").split("");
    var bracketNum = 0;
    for(var i = 0; i < bracket.length; i++){
	if(bracket[i].match(/[\(\{\[]/)) bracketNum++;
	if(bracket[i].match(/[\)\}\]]/)) bracketNum--;
    }
    if(beforeLine) spaceCount += beforeLine.replace(/^( *).*$/, "$1").length;
    if(beforeLine.match(/;\s*$/) && words.length == 3) spaceCount += IndentUnit;
    if(beforeLine.match(/\.\s*$/) && words.length == 2) spaceCount -= IndentUnit;
    if(caretText.match(/^ *[\)\}\]]/)) spaceCount -= IndentUnit;
    if(bracketNum < 0) bracketNum++ ;
    spaceCount += IndentUnit * bracketNum;

    var indent = "";
    for(var i = 0; i < spaceCount; i++){ indent += " ";}
    var flag = 1;
    var caret = position;
    if(caretLineIndent != indent){
	textarea.value = formerText.join("\n") + "\n" + indent + caretText.replace(/^ +/,"") + "\n" + latterText.join("\n");
	caret = position + indent.length - caretLineIndent.length;
	flag = 0;
    }else{
	if(caretText.match(/^\s*$/)) caret = position + indent.length - caretLinePosition;
    }
    textarea.setSelectionRange(caret, caret);
    return flag;
}

function getTermFrag(textarea){
    var position = textarea.selectionStart;
    var value = textarea.value;
    QueryFormer = value.substr(0, position).replace(/( *)([\(\{\[]*)[^ \n\/\^]*$/, "$1$2");
    QueryLatter = value.substr(position);
    CaretPosition = position;

    if(!value.substr(position, 1) || value.substr(position, 1).match(/^[\s\)\}\]]/)){
	TermFrag = value.substr(0, position).replace(/\n/g, " ").replace(/^.+[ \/\^]([^ ]*)$/, "$1").replace(/^[\(\{\[]+/, "").replace(/[\)\}\]]+$/, "");
	if(TermFrag.match(/[\.\)\}\]]$/)) TermFrag = "";
    }else{
	TermFrag = "";
    }
    TermFragTmp = "";
}

function autoCompletion(textarea){
    var terms = [];
    if(TermFrag.match(/^[A-Z]/)){
	Array.prototype.push.apply(terms, SparqlTerm);
    }else{
	Array.prototype.push.apply(terms, getWords(textarea));
    }
    terms.unshift(TermFrag.replace(/^\?/, "#"));
    terms = terms.uniq();
    var setTermFrag = " " + TermFrag.replace(/^\?/, "#").toLowerCase();
    var setTermFragTmp = " " + TermFragTmp.toLowerCase();
    if(setTermFragTmp == " "){
	TermFragTmp = TermFrag;
	setTermFragTmp = setTermFrag;
    }
    var flag2 = "";
    var flag3 = 0;
    for(var i = 0; i < terms.length; i++){
	var string = " " + terms[i].toLowerCase();
	var regexp = setTermFrag;
	if(string.match(regexp)){
	    if(string == setTermFragTmp){
		flag3 = 1;
	    }else if(flag3){
		TermFragTmp = terms[i];
		break;
	    }
	    if(!flag2) flag2 = terms[i];
	}else if(flag2 && !(string.match(regexp))){
	    if(flag2){
		TermFragTmp = flag2;
	    }else{
		TermFragTmp = TermFrag.replace(/^\?/, "#");
	    }
	}
    }
    if(TermFragTmp){
	textarea.value = QueryFormer + TermFragTmp.replace(/^#/, "?") + QueryLatter;
	var caret = CaretPosition - TermFrag.length + TermFragTmp.length;
	if(TermFragTmp.match(/[\(\{\[][\)\}\]]$/)) caret--;
	textarea.setSelectionRange(caret, caret);
    }
}

function getWords(textarea){
    var words = textarea.value.replace(/\s+/g, " ").split(/[ \(\)\{\}\[\],\/]+/);
    var variable = [];
    var prefix = [];
    var prefix2 = [];
    Array.prototype.push.apply(prefix, DefaltPrefix);
    for(var i = 0; i < words.length; i++){
	words[i] = words[i].replace(/\.$/, "");
	if(words[i].match(/^\?/)){
	    variable.push(words[i].replace(/^\?/, "#"));
	}else if(words[i].match(/^\w+:$/)){
	    prefix.push(words[i]);
	}else if(words[i].match(/^\w+:\w+/)){
	    prefix2.push(words[i]);
	    prefix.push(words[i].split(/:/)[0] + ":");
	}
    }
    var terms = variable.uniq().sort().concat(prefix.uniq().sort()).concat(prefix2.uniq().sort());
    return terms;
}

function highlight(){
    $('textarea').highlightTextarea({
	words: [{
/*	    color: '#ffeadd',
	    words: ['[^\\s]+:[^\\s]*']
	}, {
	    color: '#eaffdd',
	    words: ['\\<http://[^\\s]+']
	}, { */
	    color: '#ddeaff',
	    words: ['\\?[\\w]*']
/*	}, {
	    color: '#eeeeee',
	    words: ['# [^\\n]+']    */
        }]
    });
}

document.body.addEventListener("load", highlight());

Array.prototype.uniq = function() {
  var o = {}
    , i
    , l = this.length
    , r = [];

  for (i = 0; i < l; i += 1) o[this[i]] = this[i];
  for (i in o) r.push(o[i]);

  return r;
}
