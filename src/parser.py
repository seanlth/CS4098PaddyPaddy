import re
import itertools

TOKENS = ( (r'[ \n\t]+'                , None)
         , (r'"[^"]*"'                 , "STRING")
         , (r'/\*((?!(\*/)).)*\*/'     , None) # ignore comments
         , (r'script[ \n\t{]'          , "SCRIPT")
         , (r'process[ \n\t{]'         , "PROCESS")
         , (r'select(ion)?[ \n\t{]'    , "SELECTION")
         , (r'sequence[ \n\t{]'        , "SEQUENCE")
         , (r'iteration[ \n\t{]'       , "ITERATION")
         , (r'branch[ \n\t{]'          , "BRANCH")
         , (r'action[ \n\t{]'          , "ACTION")
         , (r'manual'                  , "MANUAL")
         , (r'executable'              , "EXECUTABLE")
         , (r'{'                       , "LBRACE")
         , (r'}'                       , "RBRACE")
         , (r'requires'                , "REQUIRES")
         , (r'provides'                , "PROVIDES")
         , (r'tool'                    , "TOOL")
         , (r'agent'                   , "AGENT")
         , (r'[_A-Za-z][_A-Za-z0-9]*'  , "IDENT")
         , (r'\.'                      , "DOT")
         , (r'[0-9]+'                  , "NUMBER")
         , (r'(==)|(!=)|(<=?)|(>=?)'   , "COMP_OP")
         , (r'(\|\|)|(&&)'             , "CONJ_OP")
         )

class ParserException(Exception): pass

toks = iter([])

def get():
    '''Get the next token from the token stream'''
    try:
        n = next(toks)
    except StopIteration:
        raise ParserException('Unexpected EOF') from None
    return n

def push_back(val):
    '''Push an unused value back onto the token stream'''
    global toks
    toks = itertools.chain([val], toks)

def expect(tag):
    '''Lookahead for a given tag and fail if it's not present'''
    (text, _tag) = get()
    if tag != _tag:
        raise ParserException('Expected %s, got "%s"\n' % (tag,text))
    return text

def check(tag):
    '''Lookahead for a given tag and return false if not present.
    This doesn't affect the token stream '''
    (text, _tag) = get()
    if tag == _tag:
        return text
    else:
        push_back((text, _tag))
        return False

def fail(loc):
    '''Fail, throwing an error message about current location'''
    (text, _tag) = get()
    raise ParserException('Unexpected %s ("%s") while parsing %s'%(_tag, text, loc))

def lex(content, token_exprs):
    ''' lex :: String -> [Token] '''
    pos = 0
    while pos < len(content):
        for (pattern, tag) in token_exprs:
            regex = re.compile(pattern, flags=re.MULTILINE | re.DOTALL)
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
    '''Main entry point to parser functionality
    - lexes given string and attempts to parse a process '''

    global toks
    toks = lex(content, TOKENS)
    res = process()
    return res

def process():
    expect("PROCESS")
    ident = expect("IDENT")
    prims = listOf(prim)
    return { "actions": prims, "name": ident }

def listOf(pFunc):
    ''' listOf :: Parser a -> Parse [a] '''
    items = []
    expect("LBRACE")
    while not check("RBRACE"):
        items.append(pFunc())
    return items

def prim():
    if check("SEQUENCE"):
        return control("sequence")
    elif check("SELECTION"):
        return control("selection")
    elif check("ITERATION"):
        return control("iteration")
    elif check("BRANCH"):
        return control("branch")
    elif check("ACTION"):
        return action()
    else:
        fail("primative")

def control(cont):
    res = { "control": cont }
    ident = check("IDENT")
    if ident:
        res["name"] = ident

    res["actions"] = listOf(prim)
    return res

def action():
    ident = expect("IDENT")

    if check("MANUAL"):
        type_ = "manual"
    elif check("EXECUTABLE"):
        type_ = "executable"
    else:
        type_ = ""

    act = { "name": ident, "control": "action", "type" : type_ }
    for (specType, sel) in listOf(spec):
        act[specType] = sel

    return act

def spec():
    ''' Parse the general form of each of the specifications, returning the result as a tuple to be dealt
    with elsewhere'''

    specType = None
    if check("REQUIRES"):
        specType = "requires"
    elif check("PROVIDES"):
        specType = "provides"
    elif check("AGENT"):
        specType = "agent"
    elif check("SCRIPT"):
        specType = "script"
    elif check("TOOL"):
        specType = "tool"
    else:
        fail("specification")

    expect("LBRACE")
    if specType in ["provides", "requires", "agent"]:
        sel = expr()
    else:
        sel = expect("STRING")[1:-1]
    expect("RBRACE")

    return (specType, sel)

def expr():
    '''Parse an expression '''
    res = [ rel_expr() ]

    op = check("CONJ_OP")
    while(op):
        rel = rel_expr()
        rel['conj_op'] = op
        res.append(rel)
        op = check("CONJ_OP")

    return res

def rel_expr():
    res = {"lhs": val_expr()}
    op = check("COMP_OP")
    if op:
        res['op'] = op
        res['rhs'] = val_expr()
    return res

def val_expr():
    strOrNumber = check("STRING") or check("NUMBER")
    if strOrNumber:
        return {"core": strOrNumber}

    id = check("IDENT")
    if id:
        r = {"core":id}
        if check("DOT"):
            r['postDot'] = expect("IDENT")
        return r

    fail("Expr")


