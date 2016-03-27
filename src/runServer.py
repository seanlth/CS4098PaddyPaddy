from flask import Flask, redirect, url_for, render_template,request, session, flash
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager, UserMixin, login_user, logout_user,\
    current_user

from oauth import OAuthSignIn
from subprocess import check_output, STDOUT, CalledProcessError
from werkzeug import generate_password_hash, check_password_hash, secure_filename

from database.database_create import Base, User
from database.database_insert import insert_user, insert_social_user
from database.database_query import query_user,query_social_user, number_of_users

import base64
import json
import os
import shutil
import tempfile

import parser

DEBUG = True
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
app.config['OAUTH_CREDENTIALS'] = {
    'facebook': {
        'id': '604820106335654',
        'secret': '5eb3f15f84c722df9cbc577206557cc8'
    },
    'twitter': {
        'id': 'cGFr2WV93py7an7FrGXXNDS6p',
        'secret': 'U9ufkrhicVHrj5CGojmQ7ZCxSwytoShSgM0t9WCq0HbqcfKwL8'
    }
}
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
    if session.get('tempFile') is not None:
        if session['tempFile'] != "":
            editor_content = open(session['tempFile']).read();

    if 'filename' in request.args or filename != "":
        filename = filename if filename else request.args['filename']
        if 'email' in session:
            email = session['email']
            userpath = os.path.join(app.config['UPLOAD_FOLDER'], email)
            filepath = os.path.join(userpath, filename)
            session['currentFile'] = filename
            try:
                with open(filepath) as f:
                    editor_content = f.read()
            except FileNotFoundError:
                editor_content = "" #TODO: some kind of message here


    return render_template("editor.html", editor_content=editor_content)


@app.route('/openFile')
def openFile():
    if not 'email' in session:
        return redirect('/login?return_url=openFile')

    files = []
    email = session['email']
    userpath = os.path.join(app.config['UPLOAD_FOLDER'], email)
    try:
        files = os.listdir(userpath)
    except: # userpath doesn't exist yet; create it and assume empty
        os.makedirs(userpath, exist_ok=True)
    # print ("CURRENT file: ", session['currentFile'])
    return render_template('openFile.html', files=files)

# def uploadFile():
#     if not 'email' in session:
#         return redirect('/login?return_url=openFile')

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
        os.makedirs(userpath, exist_ok=True)
        file.save(os.path.join(userpath, filename))
        session['currentFile'] = filename
        return redirect('/?filename=%s'%filename)
    flash("Invalid file")
    return redirect('/openFile')


@app.route('/save')
def save():
    print(session)
    if not 'email' in session:
        return redirect('/login?return_url=saveAs')
    if 'currentFile' in session:
        return saveFile(session['currentFile'])
    return saveAs()

@app.route('/saveAs')
def saveAs():
    if not 'email' in session:
        return redirect('/login?return_url=saveAs')
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
    if 'useParsed' in request.args and 'tempFile' in session:
        tempFile = session['tempFile']
        with open(tempFile) as f:
            data = f.read()
            try:
                parsed = parser.parse(data) #TODO: proper error message
                return render_template("diagramEditor.html", data=json.dumps(parsed))
            except parser.ParserException: pass

    return render_template("diagramEditor.html")

@app.route("/signup")
def renderSignUp():
    if 'return_url' in request.args:
        session['return_url'] = request.args['return_url']

    return render_template("register.html")


@app.route("/signup", methods=["POST"])
def signUpButton():
    email = request.form["email"]
    user = query_user(email)
    if user == None:
        password = request.form["password"]
        password_hash = generate_password_hash(password)
        insert_user(email, password_hash)
        session['email'] = email

        returnUrl = session.pop('return_url', None)
        if returnUrl:
            return redirect(returnUrl)
        else:
            return redirect('/')
    # email has been used
    flash('Email already in use')
    return redirect('/signup')



@app.route("/login")
def login():
    if 'return_url' in request.args:
        session['return_url'] = request.args['return_url']
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def loginButton():
    email = request.form["email"]
    password = request.form["password"]
    user = query_user(email)
    if user != None:
        if check_password_hash(user.password, password):
            session['email'] = email
            returnUrl = session.pop('return_url', None)
            if returnUrl:
                return redirect(returnUrl)
            else:
                return redirect('/')

    return "Incorrect/Invalid e-mail and/or password<br/>", 401


@app.route("/logout")
def logout():

    if 'email' in session:
        session.pop('email', None)
    else:
        session.pop('social', None)
    if session.get('tempFile') is not None:
        session['tempFile'] = ""
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
@app.route('/authorize/<provider>')
def oauth_authorize(provider):
    oauth = OAuthSignIn.get_provider(provider)
    return oauth.authorize()


@app.route('/callback/<provider>')
def oauth_callback(provider):
    oauth = OAuthSignIn.get_provider(provider)
    social, username, email = oauth.callback()
    if social is None:
        flash('Authentication failed.')
        return redirect(url_for('login'))
    user = query_social_user(social);
    session['social'] = social
    if user is None:
        insert_social_user(social)
    return redirect('/')
if __name__ == "__main__":
	app.run(host="localhost", port=8000, debug=DEBUG)
