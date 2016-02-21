from flask import Flask
from flask import request
from flask import render_template
from subprocess import check_output
from werkzeug import generate_password_hash, check_password_hash
from database.database_create import Base, User
from database.database_insert import insert_user
from database.database_query import query_user, number_of_users


app = Flask(__name__)
def get_resource_as_string(name, charset='utf-8'):
    with app.open_resource(name) as f:
        return f.read().decode(charset)

app.jinja_env.globals['get_resource_as_string'] = get_resource_as_string

@app.route("/")
def my_form():
    return render_template("form.html")

@app.route("/", methods=["POST"])
def my_form_post():
    f = open("temp.pml", "w")
    f.write(request.form["program"])
    f.close()
    output = check_output(["./pmlcheck", "temp.pml"])
    output = str.replace(output.decode(), "\n", "<br/>")
    return output

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
    password = request.form["verify"]

    password_hash = generate_password_hash(password)
    insert_user(email, password_hash)
    user = query_user(33)
    print(number_of_users())
    print(user.password)

    return "Welcome screen"



@app.route("/login")
def login():
    return render_template("login.html")

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=int("8000"), debug=True)
