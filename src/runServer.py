from flask import Flask, request, render_template
from flask import redirect, url_for, send_from_directory
from flask import session

from subprocess import check_output, STDOUT, CalledProcessError

from werkzeug import generate_password_hash, check_password_hash, secure_filename

from database.database_create import Base, User
from database.database_insert import insert_user
from database.database_query import query_user, number_of_users

import tempfile
import os


DEBUG = True
app = Flask(__name__)
def get_resource_as_string(name, charset='utf-8'):
    with app.open_resource(name) as f:
        return f.read().decode(charset)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']

def userIsAuthenticated():
    return False #TODO: fill in actual authentication

app.jinja_env.globals['get_resource_as_string'] = get_resource_as_string
app.config['UPLOAD_FOLDER'] = 'userFiles/'
app.config['ALLOWED_EXTENSIONS'] = set(['pml'])


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
    editor_content = ""

    if 'filename' in request.args or filename != "":
        filename = filename if filename else request.args['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        try:
            with open(filepath) as f:
                editor_content = f.read()
        except FileNotFoundError:
            editor_content = "" #TODO: some kind of message here

    return render_template("form2.html", editor_content=editor_content)


@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    filename = ""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return redirect('/ace?filename=%s'%filename)

@app.route('/saveFile')
def saveFile():
    return render_template('saveFile.html')

@app.route('/openFile')
def openFile():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    return render_template('openFile.html', files=files)

@app.route('/fileUpload')
def fileUpload():
    return render_template('fileUpload.html')

@app.route("/signup")
def renderSignUp():
    return render_template("register.html")

@app.route("/signup", methods=["POST"])
def signUpButton():
    email = request.form["email"]
    password = request.form["password"]

    print(email);
    print(password);

    password_hash = generate_password_hash(password)
    insert_user(email, password_hash)
    session['email'] = email

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
        print(user.password);
        if check_password_hash(user.password, password):
            session['email'] = email
            return "Login"

    return "incorrect email or password<br/>"

@app.route("/logout")
def logout():
    sesssion.pop('email', None)
    return redirect(url_for('index'))


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8000, debug=DEBUG)

