var TermFrag = "";
var TermFragTmp = "";
var QueryFormer = "";
var QueryLatter = "";
var CaretPosition = 0;
var DefaltPrefix = ["rdf:", "rdfs:", "owl:", "dc:", "dcterm:", "skos:", "foaf:", "xsd:"]
var SparqlTerm = ["FILTER ()", "REGEX ()", "REPLACE ()", "CONTAINS ()", "BIND ()", "BOUND ()", "STR ()", "IF ()", "COALESCE ()", "EXIST {}", "NOT EXIST {}", "SameTerm ()", "IN ()", "NOT IN ()", "IRI ()", "IsIRI ()", "IsBlank ()", "IsLiteral ()", "IsNumeric ()", "LANG ()", "DATATYPE ()", "BNODE ()", "STRDT ()", "STRLANG ()", "UUID ()", "STRUUID ()", "STRLEN ()", "SUBSTR ()", "UCASE ()", "LCASE ()", "STRSTARTS ()", "STRENDS ()", "STRBEFORE ()", "STRAFTER ()", "ENCODE_FOR_URI ()", "CONCAT ()", "LangMatches ()", "ABS ()", "ROUND ()", "CEIL ()", "FLOOR ()", "RAND ()", "NOW ()", "YEAR ()", "MONTH ()", "DAY ()", "HOURS ()", "MINUITES ()", "SECONDS ()", "TIMEZONE ()", "TZ ()", "MD5 ()", "SHA1 ()", "SHA256 ()", "SHA384 ()", "SHA512 ()","PREFIX", "SELECT", "DISTINCT", "FROM", "GRAPH", "WHERE", "UNION", "VALUES", "ORDER BY", "GROUP BY", "LIMIT", "OFFSET", "DESCRIBE", "CONSTRUCT {}", "ASK {}", "MINUS {}", "OPTIONAL {}"];

var TextAreaID = 'query';
var IndentUnit = 4;

document.onkeydown = function (e){
    var current = document.activeElement;
    var textarea = document.getElementById(TextAreaID);
    if(current == textarea && e.keyCode == 9) return false;
    if(current != textarea && e.keyCode == 9) textarea.spellcheck = false;
    if(current == textarea && TermFrag && e.keyCode == 13){
	TermFrag = "";
	return false;
    }
}

document.onclick = function (){
    var current = document.activeElement;
    var textarea = document.getElementById(TextAreaID);
    if(current == textarea){
	TermFrag = "";
	textarea.spellcheck = false;
    }
}

document.onkeyup = function (e){
     var key_code = e.keyCode;
     var current = document.activeElement;
     var textarea = document.getElementById(TextAreaID);
     if(current == textarea){
         // return
	 // if(key_code == 13) setIndent(textarea);
         // tabulator
	 if(key_code != 9) TermFrag = "";
	 if(key_code == 9) tabKeyUp(textarea);
     }
}

function setIndent(textarea){
   var position = textarea.selectionStart;
   var value = textarea.value;
   var lines = value.substr(0, position).split("\n");
   var caret_line = lines.length - 1;
   lines = value.split(/\n/);
   var formerText = [];
   var latterText = [];
   for(i = 0; i < caret_line; i++){ formerText.push(lines[i]); }
   for(i = caret_line + 1; i < lines.length; i++){ latterText.push(lines[i]); }
   var caretText = lines[caret_line];

   var beforeLine = "";
   for(i = 1; i < formerText.length; i++){
      beforeLine = formerText[formerText.length - i];
       if(beforeLine.match(/[^\s]/)) break;
   }
   var word = beforeLine.replace(/^\s*/, "").replace(/\./, "").replace(/;/, "").replace(/\s*$/, "").replace(/\[[^\]]+\]/g, "[]").replace(/, +/g, "").split(/\s+/);
   var beforeTmp = beforeLine;
   var bracket = beforeTmp.replace(/\"[^\"]*\"/g, "").replace(/[^\(\)\{\}\[\]]/g, "").split("");
   var bracketNum = 0;
   for(i = 0; i < bracket.length; i++){
       if(bracket[i].match(/[\(\{\[]/)) bracketNum++;
       if(bracket[i].match(/[\)\}\]]/)) bracketNum--;
   }
   var space_count = 0;
   if(beforeLine) space_count += beforeLine.replace(/^( *).*$/, "$1").length;
   if(beforeLine.match(/;\s*$/) && word.length == 3) space_count += IndentUnit;
   if(beforeLine.match(/\.\s*$/) && word.length == 2) space_count -= IndentUnit;
   if(caretText.match(/^ *[\)\}\]]/)) space_count -= IndentUnit;
   space_count += IndentUnit * bracketNum;
   var space = "";
   for(i = 0; i < space_count; i++){ space += " ";}

   var caretSpace = caretText.replace(/^( *).*/, "$1");

   if(caretSpace != space){
       textarea.value = formerText.join("\n") + "\n" + space + caretText.replace(/^ +/,"") + "\n" + latterText.join("\n");
       var curet = position + space.length - caretSpace.length;

       // dummy key event for jQuery.highlightTextarea
      // var key_e = document.createEvent("KeyboardEvent");
      // key_e.initKeyEvent("keydown", true, true, null, false, false, false, false, 65, 0);
     //  document.getElementById("test").dispatchEvent(key_e);

       textarea.setSelectionRange(curet, curet);
       //  document.getElementById('test3').innerHTML = word.join("#");

       return 0;
   }else{
       return 1;
   }
}

function tabKeyUp(textarea){
    var flag = setIndent(textarea);
    if(flag){
	if(!TermFrag) getTermFrag(textarea);
	if(!TermFrag) return 0;
	var variables = [];
	if(TermFrag.match(/^[A-Z]/)){
	    Array.prototype.push.apply(variables, SparqlTerm);
	}else{
	    Array.prototype.push.apply(variables, getWords(textarea));
	}
	variables.unshift(TermFrag.replace(/^\?/, "#"));
	variables = variables.uniq();
	var setTermFrag = " " + TermFrag.replace(/^\?/, "#").toLowerCase();
	var setTermFragTmp = " " + TermFragTmp.toLowerCase();
	if(setTermFragTmp == " "){
	    TermFragTmp = TermFrag;
	    setTermFragTmp = setTermFrag;
	}
	var flag2 = "";
	var flag3 = 0;
	for(i = 0; i < variables.length; i++){
	    var string = " " + variables[i].toLowerCase();
	    var regexp = setTermFrag;
	    if(string.match(regexp)){
		if(string == setTermFragTmp){
		    flag3 = 1;
		}else if(flag3){
		    TermFragTmp = variables[i];
		    break;
		}
		if(!flag2) flag2 = variables[i];
	    }else if(flag2 && !(string.match(regexp))){
		if(flag2){
		    TermFragTmp = flag2;
		}else{
		    TermFragTmp = TermFrag.replace(/^\?/, "#");
		}
	//	break;
	    }
	}

        if(TermFragTmp){
	    textarea.value = QueryFormer + TermFragTmp.replace(/^#/, "?") + QueryLatter;
	    var curet = CaretPosition - TermFrag.length + TermFragTmp.length;
	    if(TermFragTmp.match(/[\(\{\[][\)\}\]]$/)) curet--;
	    textarea.setSelectionRange(curet, curet);
        }
//	document.getElementById('test').innerHTML = variables.join(": ");
//	document.getElementById('test3').innerHTML = TermFrag + ", " + TermFragTmp;
//    document.getElementById('test2').innerHTML = QueryFormer.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "<br>" + QueryLatter.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

function getTermFrag(textarea){
   var position = textarea.selectionStart;
   var value = textarea.value;
   QueryFormer = value.substr(0, position).replace(/( *)([\(\{\[]*)[^ \n]*$/, "$1$2");
   QueryLatter = value.substr(position);
   CaretPosition = position;

   if(!value.substr(position, 1) || value.substr(position, 1).match(/^[\s\)\}\]]/)){
       TermFrag = value.substr(0, position).replace(/\n/g, " ").replace(/^.+ ([^ ]*)$/, "$1").replace(/^[\(\{\[]+/, "").replace(/[\)\}\]]+$/, "");
       if(TermFrag.match(/^\^/)) QueryFormer = QueryFormer + "^";
       TermFrag = TermFrag.replace(/^\^/, "");
       if(TermFrag.match(/[\.\)\}\]]$/)) TermFrag = "";
   }else{
       TermFrag = "";
   }
    TermFragTmp = "";
 //   document.getElementById('test3').innerHTML = TermFrag + ", " + TermFragTmp + ", " + position;
 //   document.getElementById('test2').innerHTML = QueryFormer + "<br>" + QueryLatter;
}

function getWords(textarea){
   var query = textarea.value.replace(/\s+/g, " ");
   var words = query.split(/[ \(\)\{\}\[\],\/]+/);
   var tmp1 = DefaltPrefix;
   var tmp2 = [];
   var tmp3 = [];
   for(i = 0; i < words.length; i++){
     words[i] = words[i].replace(/\.$/, "");
     if(words[i].match(/^\?/)){
       tmp1.push(words[i].replace(/^\?/, "#"));
     }else if(words[i].match(/^\w+:$/)){
       tmp2.push(words[i]);
     }else if(words[i].match(/^\w+:\w+/)){
       tmp3.push(words[i]);
       tmp2.push(words[i].split(/:/)[0] + ":");
     }
   }
   var variables = tmp1.uniq().sort().concat(tmp2.uniq().sort()).concat(tmp3.uniq().sort());
   return variables;
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
        }],
        resizable: true
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
