from flask import Flask, request, render_template

from subprocess import check_output, STDOUT, CalledProcessError

from werkzeug import generate_password_hash, check_password_hash

from database.database_create import Base, User
from database.database_insert import insert_user
from database.database_query import query_user, number_of_users

import tempfile

app = Flask(__name__)
def get_resource_as_string(name, charset='utf-8'):
    with app.open_resource(name) as f:
        return f.read().decode(charset)

app.jinja_env.globals['get_resource_as_string'] = get_resource_as_string

@app.route("/")
def my_form():
    return render_template("form2.html")

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

@app.route("/ace")
def ace():
    return render_template("form2.html")

@app.route("/signUp")
def renderSignUp():
    return render_template("register.html")

@app.route("/signUp", methods=["POST"])
def signUpButton():
    email = request.form["email"]
    password = request.form["password"]

    password_hash = generate_password_hash(password)
    insert_user(email, password_hash)

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
            return "Login"

    return "incorrect email or password<br/>"



if __name__ == "__main__":
	app.run(host="0.0.0.0", port=int(8000))#, debug=True)
