import re
import itertools

TOKENS = ( (r'[ \n\t]+'   , None)
         , (r'process'    , "PROCESS")
         , (r'sequence'   , "SEQUENCE")
         , (r'iteration'  , "ITERATION")
         , (r'branch'     , "BRANCH")
         , (r'action'     , "ACTION")
         , (r'manual'     , "MANUAL")
         , (r'executable' , "EXECUTABLE")
         , (r'{'          , "LBRACE")
         , (r'}'          , "RBRACE")
         , (r'requires'   , "REQUIRES")
         , (r'provides'   , "PROVIDES")
         , (r'tool'       , "TOOL")
         , (r'agent'      , "AGENT")
         , (r'script'     , "SCRIPT")
         , (r'".*"'       , "STRING")
         , (r'[_A-Za-z]+' , "IDENT")
         , (r'.*'         , "EXPR") #TODO: de-generalize this
         )

class ParserException(Exception): pass

toks = iter([])

def get():
    return next(toks)

def push_back(val):
    global toks
    toks = itertools.chain([val], toks)

def expect(tag):
    (text, _tag) = get()
    if tag != _tag:
        raise ParserException('Expected %s, got "%s"\n' % (tag,text))
    return text

def check(tag):
    (text, _tag) = get()
    if tag == _tag:
        return text
    else:
        push_back((text, _tag))
        return False

def fail(loc):
    (text, _tag) = get()
    raise ParserException('Unexpected %s ("%s") while parsing %s'%(_tag, text, loc))

def lex(content, token_exprs):
    pos = 0
    while pos < len(content):
        for (pattern, tag) in token_exprs:
            regex = re.compile(pattern)
            match = regex.match(content, pos)
            if match:
                text = match.group(0)
                if tag:
                    yield (text, tag)
                pos = match.end(0)
                break
        else:
            raise ParserException('Illegal char: "%s"\n' % content[pos])

def parse(content):
    global toks
    toks = lex(content, TOKENS)
    res = process()
    return res



def listOf(pFunc):
    items = []
    expect("LBRACE")
    while not check("RBRACE"):
        items.append(pFunc())
    return items

def prim():
    if check("SEQUENCE"):
        return control("sequence")
    elif check("ITERATION"):
        return control("iteration")
    elif check("BRANCH"):
        return control("branch")
    elif check("ACTION"):
        return action()
    else:
        fail("primative")

def control(cont):
    ident = expect("IDENT")
    prims = listOf(prim)
    return { "name": ident, "control": cont, "actions": prims }

def action():
    ident = expect("IDENT")

    if check("MANUAL"):
        type_ = "manual"
    elif check("EXECUTABLE"):
        type_ = "executable"
    else:
        type_ = ""

    act = { "name": ident, "control": "action", "type" : type_, "requirements": [], "provisions": []}
    for (specType, sel) in listOf(spec):
        if specType == "requires":
            act["requirements"].append(sel)
        elif specType == "provides":
            act["provisions"].append(sel)
        else:
            act[specType] = sel

    return act

def spec():
    specType = None
    if check("REQUIRES"):
        specType = "requires"
    elif check("PROVIDES"):
        specType = "provides"
    elif check("TOOL"):
        specType = "tool"
    elif check("AGENT"):
        specType = "agent"
    elif check("SCRIPT"):
        specType = "script"
    else:
        fail()

    expect("LBRACE")
    sel = selector()
    expect("RBRACE")

    return (specType, sel)

def selector():
    st = check("STRING")
    if st: return st
    ident = check("IDENT")
    if ident: return ident
    exp = check("EXPR")
    if exp: return exp
    fail("selector")

def process():
    expect("PROCESS")
    expect("IDENT")
    return listOf(prim) # the ident of the process doesn't seem to be used in the diagram

print(parse("process p { action a { tool { asdf } provides {qqq} provides {eee}} }"))

