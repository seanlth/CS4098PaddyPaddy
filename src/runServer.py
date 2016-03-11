from flask import Flask, request, render_template
from flask import redirect, url_for, send_from_directory
from flask import session, flash

from subprocess import check_output, STDOUT, CalledProcessError

from werkzeug import generate_password_hash, check_password_hash, secure_filename

from database.database_create import Base, User
from database.database_insert import insert_user
from database.database_query import query_user, number_of_users

import base64
import os
import shutil
import tempfile


DEBUG = False
app = Flask(__name__)
app.secret_key = 'fe2917b485cc985c47071f3e38273348' # echo team paddy paddy | md5sum
app.config['UPLOAD_FOLDER'] = 'userFiles/'
app.config['ALLOWED_EXTENSIONS'] = set(['pml'])

def get_resource_as_string(name, charset='utf-8'):
    with app.open_resource(name) as f:
        return f.read().decode(charset)
app.jinja_env.globals['get_resource_as_string'] = get_resource_as_string

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']



@app.route("/", methods=["POST"])
def my_form_post():
    with tempfile.NamedTemporaryFile(mode='w+t', suffix='.pml') as f:
        fname = f.name

        f.write(request.form["program"])
        f.flush()

        try:
            return check_output(["./pmlcheck", fname], stderr=STDOUT).decode().replace(fname+':', "Line ")
        except CalledProcessError as e:
            return e.output.decode().replace(fname+':', "Line "), 400


@app.route("/")
def editor(filename = ""):
    editor_content = "";
    print(session['tempFile']);
    if session['tempFile'] != "":
        editor_content = open(session['tempFile']).read();  

    if 'filename' in request.args or filename != "":
        filename = filename if filename else request.args['filename']
        if 'email' in session:
            email = session['email']
            userpath = os.path.join(app.config['UPLOAD_FOLDER'], email)
            filepath = os.path.join(userpath, filename)
            try:
                with open(filepath) as f:
                    editor_content = f.read()
            except FileNotFoundError:
                editor_content = "" #TODO: some kind of message here

        
    return render_template("editor.html", editor_content=editor_content)



@app.route('/openFile')
def openFile():
    if not 'email' in session:
        return redirect('/signup?return_url=openFile')

    files = []
    email = session['email']
    userpath = os.path.join(app.config['UPLOAD_FOLDER'], email)
    try:
        files = os.listdir(userpath)
    except: # userpath doesn't exist yet; create it and assume empty
        os.makedirs(userpath, exist_ok=True)
    return render_template('openFile.html', files=files)


@app.route('/upload', methods=['POST'])
def upload():
    if not 'email' in session:
        return "", 401 # not authorised

    email = session['email']
    file = request.files['file']
    filename = ""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        userpath = os.path.join(app.config['UPLOAD_FOLDER'], email)
        file.save(os.path.join(userpath, filename))
        return redirect('/?filename=%s'%filename)
    flash("Invalid file")
    return redirect('/openFile')


@app.route('/save')
def save():
    if not 'email' in session:
        return redirect('/signup?return_url=saveAs')
    if 'currentFile' in session:
        return saveFile(session['currentFile'])
    return saveAs()

@app.route('/saveAs')
def saveAs():
    if not 'email' in session:
        return redirect('/signup?return_url=saveAs')
    else:
        return render_template('saveFile.html')


@app.route('/saveAs', methods=['POST'])
@app.route('/save', methods=['POST'])
def saveFile(fname=None):
    if not 'email' in session:
        return "", 401 # not authorised

    name = fname if fname else request.form['filename']
    if name:
        if name[-4:] != ".pml": # check for '.pml' extension
            name += ".pml"

        if allowed_file(name):
            session['currentFile'] = name
            email = session['email']
            savepath = os.path.join(app.config['UPLOAD_FOLDER'], email)
            os.makedirs(savepath, exist_ok=True) # make the users save dir if it doesn't already exist

            saveFilePath = os.path.join(savepath, name)
            tempFilePath = session.pop("tempFile", None)
            if tempFilePath:
                shutil.copy(tempFilePath, saveFilePath)

                return redirect('/?filename=%s'%name)
    flash("Invalid File")
    return redirect('/saveAs')


@app.route("/diagram")
def diagram():
    return render_template("diagramEditor.html")

@app.route("/signup")
def renderSignUp():
    if 'return_url' in request.args:
        session['return_url'] = request.args['return_url']

    return render_template("register.html")


@app.route("/signup", methods=["POST"])
def signUpButton():
    email = request.form["email"]
    password = request.form["password"]

    password_hash = generate_password_hash(password)
    insert_user(email, password_hash)
    session['email'] = email

    returnUrl = session.pop('return_url', None)
    if returnUrl:
        return redirect(returnUrl)
    else:
        return "Welcome screen"



@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def loginButton():
    email = request.form["email"]
    password = request.form["password"]
    user = query_user(email);
    if user != None:
        #print(user.password);
        if check_password_hash(user.password, password):
            session['email'] = email
            return "Login"

    return "incorrect email or password<br/>"



@app.route("/logout")
def logout():
    session.pop('email', None)
    return redirect('/')


@app.route("/tmp", methods=["POST"])
def tmp():
    with tempfile.NamedTemporaryFile(mode="w+t", delete=False) as f:
        content = base64.b64decode(request.form["content"]).decode()
        f.write(content)
        session["tempFile"] = f.name
        return ""

@app.route("/resetCurrent")
def resetCurrent():
    if session.get('tempFile') is not None: 
        session['tempFile'] = ""
    
    if session.get('currentFile') is not None: 
        session['currentFile'].pop()

    return ""

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8000, debug=DEBUG)

