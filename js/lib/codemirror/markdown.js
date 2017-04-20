define(["./codemirror", "css!./theme-light"], function(CodeMirror) {
    CodeMirror.defineMode("xml", function(config, parserConfig) {
        var indentUnit = config.indentUnit;
        var Kludges = parserConfig.htmlMode ? {
            autoSelfClosers: {
                'area': true,
                'base': true,
                'br': true,
                'col': true,
                'command': true,
                'embed': true,
                'frame': true,
                'hr': true,
                'img': true,
                'input': true,
                'keygen': true,
                'link': true,
                'meta': true,
                'param': true,
                'source': true,
                'track': true,
                'wbr': true
            },
            implicitlyClosed: {
                'dd': true,
                'li': true,
                'optgroup': true,
                'option': true,
                'p': true,
                'rp': true,
                'rt': true,
                'tbody': true,
                'td': true,
                'tfoot': true,
                'th': true,
                'tr': true
            },
            contextGrabbers: {
                'dd': {
                    'dd': true,
                    'dt': true
                },
                'dt': {
                    'dd': true,
                    'dt': true
                },
                'li': {
                    'li': true
                },
                'option': {
                    'option': true,
                    'optgroup': true
                },
                'optgroup': {
                    'optgroup': true
                },
                'p': {
                    'address': true,
                    'article': true,
                    'aside': true,
                    'blockquote': true,
                    'dir': true,
                    'div': true,
                    'dl': true,
                    'fieldset': true,
                    'footer': true,
                    'form': true,
                    'h1': true,
                    'h2': true,
                    'h3': true,
                    'h4': true,
                    'h5': true,
                    'h6': true,
                    'header': true,
                    'hgroup': true,
                    'hr': true,
                    'menu': true,
                    'nav': true,
                    'ol': true,
                    'p': true,
                    'pre': true,
                    'section': true,
                    'table': true,
                    'ul': true
                },
                'rp': {
                    'rp': true,
                    'rt': true
                },
                'rt': {
                    'rp': true,
                    'rt': true
                },
                'tbody': {
                    'tbody': true,
                    'tfoot': true
                },
                'td': {
                    'td': true,
                    'th': true
                },
                'tfoot': {
                    'tbody': true
                },
                'th': {
                    'td': true,
                    'th': true
                },
                'thead': {
                    'tbody': true,
                    'tfoot': true
                },
                'tr': {
                    'tr': true
                }
            },
            doNotIndent: {
                "pre": true
            },
            allowUnquoted: true,
            allowMissing: true
        } : {
            autoSelfClosers: {},
            implicitlyClosed: {},
            contextGrabbers: {},
            doNotIndent: {},
            allowUnquoted: false,
            allowMissing: false
        };
        var alignCDATA = parserConfig.alignCDATA;
        var tagName, type;

        function inText(stream, state) {
            function chain(parser) {
                state.tokenize = parser;
                return parser(stream, state);
            }
            var ch = stream.next();
            if (ch == "<") {
                if (stream.eat("!")) {
                    if (stream.eat("[")) {
                        if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));
                        else return null;
                    } else if (stream.match("--")) return chain(inBlock("comment", "-->"));
                    else if (stream.match("DOCTYPE", true, true)) {
                        stream.eatWhile(/[\w\._\-]/);
                        return chain(doctype(1));
                    } else return null;
                } else if (stream.eat("?")) {
                    stream.eatWhile(/[\w\._\-]/);
                    state.tokenize = inBlock("meta", "?>");
                    return "meta";
                } else {
                    var isClose = stream.eat("/");
                    tagName = "";
                    var c;
                    while ((c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/))) tagName += c;
                    if (!tagName) return "error";
                    type = isClose ? "closeTag" : "openTag";
                    state.tokenize = inTag;
                    return "tag";
                }
            } else if (ch == "&") {
                var ok;
                if (stream.eat("#")) {
                    if (stream.eat("x")) {
                        ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
                    } else {
                        ok = stream.eatWhile(/[\d]/) && stream.eat(";");
                    }
                } else {
                    ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
                }
                return ok ? "atom" : "error";
            } else {
                stream.eatWhile(/[^&<]/);
                return null;
            }
        }

        function inTag(stream, state) {
            var ch = stream.next();
            if (ch == ">" || (ch == "/" && stream.eat(">"))) {
                state.tokenize = inText;
                type = ch == ">" ? "endTag" : "selfcloseTag";
                return "tag";
            } else if (ch == "=") {
                type = "equals";
                return null;
            } else if (/[\'\"]/.test(ch)) {
                state.tokenize = inAttribute(ch);
                return state.tokenize(stream, state);
            } else {
                stream.eatWhile(/[^\s\u00a0=<>\"\']/);
                return "word";
            }
        }

        function inAttribute(quote) {
            return function(stream, state) {
                while (!stream.eol()) {
                    if (stream.next() == quote) {
                        state.tokenize = inTag;
                        break;
                    }
                }
                return "string";
            };
        }

        function inBlock(style, terminator) {
            return function(stream, state) {
                while (!stream.eol()) {
                    if (stream.match(terminator)) {
                        state.tokenize = inText;
                        break;
                    }
                    stream.next();
                }
                return style;
            };
        }

        function doctype(depth) {
            return function(stream, state) {
                var ch;
                while ((ch = stream.next()) != null) {
                    if (ch == "<") {
                        state.tokenize = doctype(depth + 1);
                        return state.tokenize(stream, state);
                    } else if (ch == ">") {
                        if (depth == 1) {
                            state.tokenize = inText;
                            break;
                        } else {
                            state.tokenize = doctype(depth - 1);
                            return state.tokenize(stream, state);
                        }
                    }
                }
                return "meta";
            };
        }
        var curState, setStyle;

        function pass() {
            for (var i = arguments.length - 1; i >= 0; i--) curState.cc.push(arguments[i]);
        }

        function cont() {
            pass.apply(null, arguments);
            return true;
        }

        function pushContext(tagName, startOfLine) {
            var noIndent = Kludges.doNotIndent.hasOwnProperty(tagName) || (curState.context && curState.context.noIndent);
            curState.context = {
                prev: curState.context,
                tagName: tagName,
                indent: curState.indented,
                startOfLine: startOfLine,
                noIndent: noIndent
            };
        }

        function popContext() {
            if (curState.context) curState.context = curState.context.prev;
        }

        function element(type) {
            if (type == "openTag") {
                curState.tagName = tagName;
                return cont(attributes, endtag(curState.startOfLine));
            } else if (type == "closeTag") {
                var err = false;
                if (curState.context) {
                    if (curState.context.tagName != tagName) {
                        if (Kludges.implicitlyClosed.hasOwnProperty(curState.context.tagName.toLowerCase())) {
                            popContext();
                        }
                        err = !curState.context || curState.context.tagName != tagName;
                    }
                } else {
                    err = true;
                }
                if (err) setStyle = "error";
                return cont(endclosetag(err));
            }
            return cont();
        }

        function endtag(startOfLine) {
            return function(type) {
                if (type == "selfcloseTag" || (type == "endTag" && Kludges.autoSelfClosers.hasOwnProperty(curState.tagName.toLowerCase()))) {
                    maybePopContext(curState.tagName.toLowerCase());
                    return cont();
                }
                if (type == "endTag") {
                    maybePopContext(curState.tagName.toLowerCase());
                    pushContext(curState.tagName, startOfLine);
                    return cont();
                }
                return cont();
            };
        }

        function endclosetag(err) {
            return function(type) {
                if (err) setStyle = "error";
                if (type == "endTag") {
                    popContext();
                    return cont();
                }
                setStyle = "error";
                return cont(arguments.callee);
            };
        }

        function maybePopContext(nextTagName) {
            var parentTagName;
            while (true) {
                if (!curState.context) {
                    return;
                }
                parentTagName = curState.context.tagName.toLowerCase();
                if (!Kludges.contextGrabbers.hasOwnProperty(parentTagName) || !Kludges.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
                    return;
                }
                popContext();
            }
        }

        function attributes(type) {
            if (type == "word") {
                setStyle = "attribute";
                return cont(attribute, attributes);
            }
            if (type == "endTag" || type == "selfcloseTag") return pass();
            setStyle = "error";
            return cont(attributes);
        }

        function attribute(type) {
            if (type == "equals") return cont(attvalue, attributes);
            if (!Kludges.allowMissing) setStyle = "error";
            else if (type == "word") setStyle = "attribute";
            return (type == "endTag" || type == "selfcloseTag") ? pass() : cont();
        }

        function attvalue(type) {
            if (type == "string") return cont(attvaluemaybe);
            if (type == "word" && Kludges.allowUnquoted) {
                setStyle = "string";
                return cont();
            }
            setStyle = "error";
            return (type == "endTag" || type == "selfCloseTag") ? pass() : cont();
        }

        function attvaluemaybe(type) {
            if (type == "string") return cont(attvaluemaybe);
            else return pass();
        }
        return {
            startState: function() {
                return {
                    tokenize: inText,
                    cc: [],
                    indented: 0,
                    startOfLine: true,
                    tagName: null,
                    context: null
                };
            },
            token: function(stream, state) {
                if (stream.sol()) {
                    state.startOfLine = true;
                    state.indented = stream.indentation();
                }
                if (stream.eatSpace()) return null;
                setStyle = type = tagName = null;
                var style = state.tokenize(stream, state);
                state.type = type;
                if ((style || type) && style != "comment") {
                    curState = state;
                    while (true) {
                        var comb = state.cc.pop() || element;
                        if (comb(type || style)) break;
                    }
                }
                state.startOfLine = false;
                return setStyle || style;
            },
            indent: function(state, textAfter, fullLine) {
                var context = state.context;
                if ((state.tokenize != inTag && state.tokenize != inText) || context && context.noIndent)
                    return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
                if (alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
                if (context && /^<\//.test(textAfter))
                    context = context.prev;
                while (context && !context.startOfLine)
                    context = context.prev;
                if (context) return context.indent + indentUnit;
                else return 0;
            },
            electricChars: "/"
        };
    });
    CodeMirror.defineMIME("text/xml", "xml");
    CodeMirror.defineMIME("application/xml", "xml");
    if (!CodeMirror.mimeModes.hasOwnProperty("text/html")) {
        CodeMirror.defineMIME("text/html", {
            name: "xml",
            htmlMode: true
        });
    }

    CodeMirror.defineMode("markdown", function(cmCfg, modeCfg) {

        var htmlFound = CodeMirror.modes.hasOwnProperty("xml");
        var htmlMode = CodeMirror.getMode(cmCfg, htmlFound ? {
            name: "xml",
            htmlMode: true
        } : "text/plain");

        function getMode(name) {
            if (CodeMirror.findModeByName) {
                var found = CodeMirror.findModeByName(name);
                if (found) name = found.mime || found.mimes[0];
            }
            var mode = CodeMirror.getMode(cmCfg, name);
            return mode.name == "null" ? null : mode;
        }

        // Should characters that affect highlighting be highlighted separate?
        // Does not include characters that will be output (such as `1.` and `-` for lists)
        if (modeCfg.highlightFormatting === undefined)
            modeCfg.highlightFormatting = true;

        // Maximum number of nested blockquotes. Set to 0 for infinite nesting.
        // Excess `>` will emit `error` token.
        if (modeCfg.maxBlockquoteDepth === undefined)
            modeCfg.maxBlockquoteDepth = 0;

        // Should underscores in words open/close em/strong?
        if (modeCfg.underscoresBreakWords === undefined)
            modeCfg.underscoresBreakWords = true;

        // Use `fencedCodeBlocks` to configure fenced code blocks. false to
        // disable, string to specify a precise regexp that the fence should
        // match, and true to allow three or more backticks or tildes (as
        // per CommonMark).

        // Turn on task lists? ("- [ ] " and "- [x] ")
        if (modeCfg.taskLists === undefined) modeCfg.taskLists = true;

        // Turn on strikethrough syntax
        if (modeCfg.strikethrough === undefined)
            modeCfg.strikethrough = true;

        // Allow token types to be overridden by user-provided token types.
        if (modeCfg.tokenTypeOverrides === undefined)
            modeCfg.tokenTypeOverrides = {};

        var codeDepth = 0;

        var tokenTypes = {
            header: "header",
            code: "comment",
            quote: "quote",
            list1: "variable-2",
            list2: "variable-3",
            list3: "variable-3",
            hr: "hr",
            image: "tag",
            formatting: "",
            linkInline: "link",
            linkEmail: "link",
            linkText: "link",
            linkHref: "string",
            em: "em",
            strong: "strong",
            strikethrough: "strikethrough"
        };

        for (var tokenType in tokenTypes) {
            if (tokenTypes.hasOwnProperty(tokenType) && modeCfg.tokenTypeOverrides[tokenType]) {
                tokenTypes[tokenType] = modeCfg.tokenTypeOverrides[tokenType];
            }
        }

        var hrRE = /^([*-_=])(?:\s*\1){2,}\s*$/,
            ulRE = /^[*\-+]\s+/,
            olRE = /^[0-9]+([.)])\s+/,
            taskListRE = /^\[(x| )\](?=\s)/ // Must follow ulRE or olRE
            ,
            atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace ? /^(#+)/ : /^(#+)(?: |$)/,
            setextHeaderRE = /^ *(?:\={1,}|-{1,})\s*$/,
            textRE = /^[^#!\[\]*_\\<>` "'(~]+/,
            fencedCodeRE = new RegExp("^(" + (modeCfg.fencedCodeBlocks === true ? "~~~+|```+" : modeCfg.fencedCodeBlocks) +
                ")[ \\t]*([\\w+#]*)");

        function switchInline(stream, state, f) {
            state.f = state.inline = f;
            return f(stream, state);
        }

        function switchBlock(stream, state, f) {
            state.f = state.block = f;
            return f(stream, state);
        }

        function lineIsEmpty(line) {
            return !line || !/\S/.test(line.string)
        }

        // Blocks

        function blankLine(state) {
            // Reset linkTitle state
            state.linkTitle = false;
            // Reset EM state
            state.em = false;
            // Reset STRONG state
            state.strong = false;
            // Reset strikethrough state
            state.strikethrough = false;
            // Reset state.quote
            state.quote = 0;
            // Reset state.indentedCode
            state.indentedCode = false;
            if (!htmlFound && state.f == htmlBlock) {
                state.f = inlineNormal;
                state.block = blockNormal;
            }
            // Reset state.trailingSpace
            state.trailingSpace = 0;
            state.trailingSpaceNewLine = false;
            // Mark this line as blank
            state.prevLine = state.thisLine
            state.thisLine = null
            return null;
        }

        function blockNormal(stream, state) {

            var sol = stream.sol();

            var prevLineIsList = state.list !== false,
                prevLineIsIndentedCode = state.indentedCode;

            state.indentedCode = false;

            if (prevLineIsList) {
                if (state.indentationDiff >= 0) { // Continued list
                    if (state.indentationDiff < 4) { // Only adjust indentation if *not* a code block
                        state.indentation -= state.indentationDiff;
                    }
                    state.list = null;
                } else if (state.indentation > 0) {
                    state.list = null;
                    state.listDepth = Math.floor(state.indentation / 4);
                } else { // No longer a list
                    state.list = false;
                    state.listDepth = 0;
                }
            }

            var match = null;
            if (state.indentationDiff >= 4) {
                stream.skipToEnd();
                if (prevLineIsIndentedCode || lineIsEmpty(state.prevLine)) {
                    state.indentation -= 4;
                    state.indentedCode = true;
                    return tokenTypes.code;
                } else {
                    return null;
                }
            } else if (stream.eatSpace()) {
                return null;
            } else if ((match = stream.match(atxHeaderRE)) && match[1].length <= 6) {
                state.header = match[1].length;
                if (modeCfg.highlightFormatting) state.formatting = "header";
                state.f = state.inline;
                return getType(state);
            } else if (!lineIsEmpty(state.prevLine) && !state.quote && !prevLineIsList &&
                !prevLineIsIndentedCode && (match = stream.match(setextHeaderRE))) {
                state.header = match[0].charAt(0) == '=' ? 1 : 2;
                if (modeCfg.highlightFormatting) state.formatting = "header";
                state.f = state.inline;
                return getType(state);
            } else if (stream.eat('>')) {
                state.quote = sol ? 1 : state.quote + 1;
                if (modeCfg.highlightFormatting) state.formatting = "quote";
                stream.eatSpace();
                return getType(state);
            } else if (stream.peek() === '[') {
                return switchInline(stream, state, footnoteLink);
            } else if (stream.match(hrRE, true)) {
                state.hr = true;
                return tokenTypes.hr;
            } else if ((lineIsEmpty(state.prevLine) || prevLineIsList) && (stream.match(ulRE, false) || stream.match(olRE, false))) {
                var listType = null;
                if (stream.match(ulRE, true)) {
                    listType = 'ul';
                } else {
                    stream.match(olRE, true);
                    listType = 'ol';
                }
                state.indentation = stream.column() + stream.current().length;
                state.list = true;
                state.listDepth++;
                if (modeCfg.taskLists && stream.match(taskListRE, false)) {
                    state.taskList = true;
                }
                state.f = state.inline;
                if (modeCfg.highlightFormatting) state.formatting = ["list", "list-" + listType];
                return getType(state);
            } else if (modeCfg.fencedCodeBlocks && (match = stream.match(fencedCodeRE, true))) {
                state.fencedChars = match[1]
                    // try switching mode
                state.localMode = getMode(match[2]);
                if (state.localMode) state.localState = state.localMode.startState();
                state.f = state.block = local;
                if (modeCfg.highlightFormatting) state.formatting = "code-block";
                state.code = true;
                return getType(state);
            }

            return switchInline(stream, state, state.inline);
        }

        function htmlBlock(stream, state) {
            var style = htmlMode.token(stream, state.htmlState);
            if ((htmlFound && state.htmlState.tagStart === null &&
                    (!state.htmlState.context && state.htmlState.tokenize.isInText)) ||
                (state.md_inside && stream.current().indexOf(">") > -1)) {
                state.f = inlineNormal;
                state.block = blockNormal;
                state.htmlState = null;
            }
            return style;
        }

        function local(stream, state) {
            if (stream.sol() && state.fencedChars && stream.match(state.fencedChars, false)) {
                state.localMode = state.localState = null;
                state.f = state.block = leavingLocal;
                return null;
            } else if (state.localMode) {
                return state.localMode.token(stream, state.localState);
            } else {
                stream.skipToEnd();
                return tokenTypes.code;
            }
        }

        function leavingLocal(stream, state) {
            stream.match(state.fencedChars);
            state.block = blockNormal;
            state.f = inlineNormal;
            state.fencedChars = null;
            if (modeCfg.highlightFormatting) state.formatting = "code-block";
            state.code = true;
            var returnType = getType(state);
            state.code = false;
            return returnType;
        }

        // Inline
        function getType(state) {
            var styles = [];

            if (state.formatting) {
                styles.push(tokenTypes.formatting);

                if (typeof state.formatting === "string") state.formatting = [state.formatting];

                for (var i = 0; i < state.formatting.length; i++) {
                    styles.push(tokenTypes.formatting + "-" + state.formatting[i]);

                    if (state.formatting[i] === "header") {
                        styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.header);
                    }

                    // Add `formatting-quote` and `formatting-quote-#` for blockquotes
                    // Add `error` instead if the maximum blockquote nesting depth is passed
                    if (state.formatting[i] === "quote") {
                        if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
                            styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.quote);
                        } else {
                            styles.push("error");
                        }
                    }
                }
            }

            if (state.taskOpen) {
                styles.push("meta");
                return styles.length ? styles.join(' ') : null;
            }
            if (state.taskClosed) {
                styles.push("property");
                return styles.length ? styles.join(' ') : null;
            }

            if (state.linkHref) {
                styles.push(tokenTypes.linkHref, "url");
            } else { // Only apply inline styles to non-url text
                if (state.strong) {
                    styles.push(tokenTypes.strong);
                }
                if (state.em) {
                    styles.push(tokenTypes.em);
                }
                if (state.strikethrough) {
                    styles.push(tokenTypes.strikethrough);
                }
                if (state.linkText) {
                    styles.push(tokenTypes.linkText);
                }
                if (state.code) {
                    styles.push(tokenTypes.code);
                }
            }

            if (state.header) {
                styles.push(tokenTypes.header, tokenTypes.header + "-" + state.header);
            }

            if (state.quote) {
                styles.push(tokenTypes.quote);

                // Add `quote-#` where the maximum for `#` is modeCfg.maxBlockquoteDepth
                if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
                    styles.push(tokenTypes.quote + "-" + state.quote);
                } else {
                    styles.push(tokenTypes.quote + "-" + modeCfg.maxBlockquoteDepth);
                }
            }

            if (state.list !== false) {
                var listMod = (state.listDepth - 1) % 3;
                if (!listMod) {
                    styles.push(tokenTypes.list1);
                } else if (listMod === 1) {
                    styles.push(tokenTypes.list2);
                } else {
                    styles.push(tokenTypes.list3);
                }
            }

            if (state.trailingSpaceNewLine) {
                styles.push("trailing-space-new-line");
            } else if (state.trailingSpace) {
                styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
            }

            return styles.length ? styles.join(' ') : null;
        }

        function handleText(stream, state) {
            if (stream.match(textRE, true)) {
                return getType(state);
            }
            return undefined;
        }

        function inlineNormal(stream, state) {
            var style = state.text(stream, state);
            if (typeof style !== 'undefined')
                return style;

            if (state.list) { // List marker (*, +, -, 1., etc)
                state.list = null;
                return getType(state);
            }

            if (state.taskList) {
                var taskOpen = stream.match(taskListRE, true)[1] !== "x";
                if (taskOpen) state.taskOpen = true;
                else state.taskClosed = true;
                if (modeCfg.highlightFormatting) state.formatting = "task";
                state.taskList = false;
                return getType(state);
            }

            state.taskOpen = false;
            state.taskClosed = false;

            if (state.header && stream.match(/^#+$/, true)) {
                if (modeCfg.highlightFormatting) state.formatting = "header";
                return getType(state);
            }

            // Get sol() value now, before character is consumed
            var sol = stream.sol();

            var ch = stream.next();

            if (ch === '\\') {
                stream.next();
                if (modeCfg.highlightFormatting) {
                    var type = getType(state);
                    var formattingEscape = tokenTypes.formatting + "-escape";
                    return type ? type + " " + formattingEscape : formattingEscape;
                }
            }

            // Matches link titles present on next line
            if (state.linkTitle) {
                state.linkTitle = false;
                var matchCh = ch;
                if (ch === '(') {
                    matchCh = ')';
                }
                matchCh = (matchCh + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
                var regex = '^\\s*(?:[^' + matchCh + '\\\\]+|\\\\\\\\|\\\\.)' + matchCh;
                if (stream.match(new RegExp(regex), true)) {
                    return tokenTypes.linkHref;
                }
            }

            // If this block is changed, it may need to be updated in GFM mode
            if (ch === '`') {
                var previousFormatting = state.formatting;
                if (modeCfg.highlightFormatting) state.formatting = "code";
                var t = getType(state);
                var before = stream.pos;
                stream.eatWhile('`');
                var difference = 1 + stream.pos - before;
                if (!state.code) {
                    codeDepth = difference;
                    state.code = true;
                    return getType(state);
                } else {
                    if (difference === codeDepth) { // Must be exact
                        state.code = false;
                        return t;
                    }
                    state.formatting = previousFormatting;
                    return getType(state);
                }
            } else if (state.code) {
                return getType(state);
            }

            if (ch === '!' && stream.match(/\[[^\]]*\] ?(?:\(|\[)/, false)) {
                stream.match(/\[[^\]]*\]/);
                state.inline = state.f = linkHref;
                return tokenTypes.image;
            }

            if (ch === '[' && stream.match(/.*\](\(.*\)| ?\[.*\])/, false)) {
                state.linkText = true;
                if (modeCfg.highlightFormatting) state.formatting = "link";
                return getType(state);
            }

            if (ch === ']' && state.linkText && stream.match(/\(.*\)| ?\[.*\]/, false)) {
                if (modeCfg.highlightFormatting) state.formatting = "link";
                var type = getType(state);
                state.linkText = false;
                state.inline = state.f = linkHref;
                return type;
            }

            if (ch === '<' && stream.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/, false)) {
                state.f = state.inline = linkInline;
                if (modeCfg.highlightFormatting) state.formatting = "link";
                var type = getType(state);
                if (type) {
                    type += " ";
                } else {
                    type = "";
                }
                return type + tokenTypes.linkInline;
            }

            if (ch === '<' && stream.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/, false)) {
                state.f = state.inline = linkInline;
                if (modeCfg.highlightFormatting) state.formatting = "link";
                var type = getType(state);
                if (type) {
                    type += " ";
                } else {
                    type = "";
                }
                return type + tokenTypes.linkEmail;
            }

            if (ch === '<' && stream.match(/^(!--|\w)/, false)) {
                var end = stream.string.indexOf(">", stream.pos);
                if (end != -1) {
                    var atts = stream.string.substring(stream.start, end);
                    if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts)) state.md_inside = true;
                }
                stream.backUp(1);
                state.htmlState = CodeMirror.startState(htmlMode);
                return switchBlock(stream, state, htmlBlock);
            }

            if (ch === '<' && stream.match(/^\/\w*?>/)) {
                state.md_inside = false;
                return "tag";
            }

            var ignoreUnderscore = false;
            if (!modeCfg.underscoresBreakWords) {
                if (ch === '_' && stream.peek() !== '_' && stream.match(/(\w)/, false)) {
                    var prevPos = stream.pos - 2;
                    if (prevPos >= 0) {
                        var prevCh = stream.string.charAt(prevPos);
                        if (prevCh !== '_' && prevCh.match(/(\w)/, false)) {
                            ignoreUnderscore = true;
                        }
                    }
                }
            }
            if (ch === '*' || (ch === '_' && !ignoreUnderscore)) {
                if (sol && stream.peek() === ' ') {
                    // Do nothing, surrounded by newline and space
                } else if (state.strong === ch && stream.eat(ch)) { // Remove STRONG
                    if (modeCfg.highlightFormatting) state.formatting = "strong";
                    var t = getType(state);
                    state.strong = false;
                    return t;
                } else if (!state.strong && stream.eat(ch)) { // Add STRONG
                    state.strong = ch;
                    if (modeCfg.highlightFormatting) state.formatting = "strong";
                    return getType(state);
                } else if (state.em === ch) { // Remove EM
                    if (modeCfg.highlightFormatting) state.formatting = "em";
                    var t = getType(state);
                    state.em = false;
                    return t;
                } else if (!state.em) { // Add EM
                    state.em = ch;
                    if (modeCfg.highlightFormatting) state.formatting = "em";
                    return getType(state);
                }
            } else if (ch === ' ') {
                if (stream.eat('*') || stream.eat('_')) { // Probably surrounded by spaces
                    if (stream.peek() === ' ') { // Surrounded by spaces, ignore
                        return getType(state);
                    } else { // Not surrounded by spaces, back up pointer
                        stream.backUp(1);
                    }
                }
            }

            if (modeCfg.strikethrough) {
                if (ch === '~' && stream.eatWhile(ch)) {
                    if (state.strikethrough) { // Remove strikethrough
                        if (modeCfg.highlightFormatting) state.formatting = "strikethrough";
                        var t = getType(state);
                        state.strikethrough = false;
                        return t;
                    } else if (stream.match(/^[^\s]/, false)) { // Add strikethrough
                        state.strikethrough = true;
                        if (modeCfg.highlightFormatting) state.formatting = "strikethrough";
                        return getType(state);
                    }
                } else if (ch === ' ') {
                    if (stream.match(/^~~/, true)) { // Probably surrounded by space
                        if (stream.peek() === ' ') { // Surrounded by spaces, ignore
                            return getType(state);
                        } else { // Not surrounded by spaces, back up pointer
                            stream.backUp(2);
                        }
                    }
                }
            }

            if (ch === ' ') {
                if (stream.match(/ +$/, false)) {
                    state.trailingSpace++;
                } else if (state.trailingSpace) {
                    state.trailingSpaceNewLine = true;
                }
            }

            return getType(state);
        }

        function linkInline(stream, state) {
            var ch = stream.next();

            if (ch === ">") {
                state.f = state.inline = inlineNormal;
                if (modeCfg.highlightFormatting) state.formatting = "link";
                var type = getType(state);
                if (type) {
                    type += " ";
                } else {
                    type = "";
                }
                return type + tokenTypes.linkInline;
            }

            stream.match(/^[^>]+/, true);

            return tokenTypes.linkInline;
        }

        function linkHref(stream, state) {
            // Check if space, and return NULL if so (to avoid marking the space)
            if (stream.eatSpace()) {
                return null;
            }
            var ch = stream.next();
            if (ch === '(' || ch === '[') {
                state.f = state.inline = getLinkHrefInside(ch === "(" ? ")" : "]");
                if (modeCfg.highlightFormatting) state.formatting = "link-string";
                state.linkHref = true;
                return getType(state);
            }
            return 'error';
        }

        function getLinkHrefInside(endChar) {
            return function(stream, state) {
                var ch = stream.next();

                if (ch === endChar) {
                    state.f = state.inline = inlineNormal;
                    if (modeCfg.highlightFormatting) state.formatting = "link-string";
                    var returnState = getType(state);
                    state.linkHref = false;
                    return returnState;
                }

                if (stream.match(inlineRE(endChar), true)) {
                    stream.backUp(1);
                }

                state.linkHref = true;
                return getType(state);
            };
        }

        function footnoteLink(stream, state) {
            if (stream.match(/^([^\]\\]|\\.)*\]:/, false)) {
                state.f = footnoteLinkInside;
                stream.next(); // Consume [
                if (modeCfg.highlightFormatting) state.formatting = "link";
                state.linkText = true;
                return getType(state);
            }
            return switchInline(stream, state, inlineNormal);
        }

        function footnoteLinkInside(stream, state) {
            if (stream.match(/^\]:/, true)) {
                state.f = state.inline = footnoteUrl;
                if (modeCfg.highlightFormatting) state.formatting = "link";
                var returnType = getType(state);
                state.linkText = false;
                return returnType;
            }

            stream.match(/^([^\]\\]|\\.)+/, true);

            return tokenTypes.linkText;
        }

        function footnoteUrl(stream, state) {
            // Check if space, and return NULL if so (to avoid marking the space)
            if (stream.eatSpace()) {
                return null;
            }
            // Match URL
            stream.match(/^[^\s]+/, true);
            // Check for link title
            if (stream.peek() === undefined) { // End of line, set flag to check next line
                state.linkTitle = true;
            } else { // More content on line, check if link title
                stream.match(/^(?:\s+(?:"(?:[^"\\]|\\\\|\\.)+"|'(?:[^'\\]|\\\\|\\.)+'|\((?:[^)\\]|\\\\|\\.)+\)))?/, true);
            }
            state.f = state.inline = inlineNormal;
            return tokenTypes.linkHref + " url";
        }

        var savedInlineRE = [];

        function inlineRE(endChar) {
            if (!savedInlineRE[endChar]) {
                // Escape endChar for RegExp (taken from http://stackoverflow.com/a/494122/526741)
                endChar = (endChar + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
                // Match any non-endChar, escaped character, as well as the closing
                // endChar.
                savedInlineRE[endChar] = new RegExp('^(?:[^\\\\]|\\\\.)*?(' + endChar + ')');
            }
            return savedInlineRE[endChar];
        }

        var mode = {
            startState: function() {
                return {
                    f: blockNormal,

                    prevLine: null,
                    thisLine: null,

                    block: blockNormal,
                    htmlState: null,
                    indentation: 0,

                    inline: inlineNormal,
                    text: handleText,

                    formatting: false,
                    linkText: false,
                    linkHref: false,
                    linkTitle: false,
                    em: false,
                    strong: false,
                    header: 0,
                    hr: false,
                    taskList: false,
                    list: false,
                    listDepth: 0,
                    quote: 0,
                    trailingSpace: 0,
                    trailingSpaceNewLine: false,
                    strikethrough: false,
                    fencedChars: null
                };
            },

            copyState: function(s) {
                return {
                    f: s.f,

                    prevLine: s.prevLine,
                    thisLine: s.thisLine,

                    block: s.block,
                    htmlState: s.htmlState && CodeMirror.copyState(htmlMode, s.htmlState),
                    indentation: s.indentation,

                    localMode: s.localMode,
                    localState: s.localMode ? CodeMirror.copyState(s.localMode, s.localState) : null,

                    inline: s.inline,
                    text: s.text,
                    formatting: false,
                    linkTitle: s.linkTitle,
                    code: s.code,
                    em: s.em,
                    strong: s.strong,
                    strikethrough: s.strikethrough,
                    header: s.header,
                    hr: s.hr,
                    taskList: s.taskList,
                    list: s.list,
                    listDepth: s.listDepth,
                    quote: s.quote,
                    indentedCode: s.indentedCode,
                    trailingSpace: s.trailingSpace,
                    trailingSpaceNewLine: s.trailingSpaceNewLine,
                    md_inside: s.md_inside,
                    fencedChars: s.fencedChars
                };
            },

            token: function(stream, state) {

                // Reset state.formatting
                state.formatting = false;

                if (stream != state.thisLine) {
                    var forceBlankLine = state.header || state.hr;

                    // Reset state.header and state.hr
                    state.header = 0;
                    state.hr = false;

                    if (stream.match(/^\s*$/, true) || forceBlankLine) {
                        blankLine(state);
                        if (!forceBlankLine) return null
                        state.prevLine = null
                    }

                    state.prevLine = state.thisLine
                    state.thisLine = stream

                    // Reset state.taskList
                    state.taskList = false;

                    // Reset state.trailingSpace
                    state.trailingSpace = 0;
                    state.trailingSpaceNewLine = false;

                    state.f = state.block;
                    var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, '    ').length;
                    var difference = Math.floor((indentation - state.indentation) / 4) * 4;
                    if (difference > 4) difference = 4;
                    var adjustedIndentation = state.indentation + difference;
                    state.indentationDiff = adjustedIndentation - state.indentation;
                    state.indentation = adjustedIndentation;
                    if (indentation > 0) return null;
                }
                return state.f(stream, state);
            },

            innerMode: function(state) {
                if (state.block == htmlBlock) return {
                    state: state.htmlState,
                    mode: htmlMode
                };
                if (state.localState) return {
                    state: state.localState,
                    mode: state.localMode
                };
                return {
                    state: state,
                    mode: mode
                };
            },

            blankLine: blankLine,

            getType: getType,

            fold: "markdown"
        };
        return mode;
    }, "xml");

    CodeMirror.defineMIME("text/x-markdown", "markdown");
    return CodeMirror
})