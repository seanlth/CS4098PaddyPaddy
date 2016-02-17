from flask import Flask
from flask import request
from flask import render_template
from subprocess import check_output

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
def signUp():
    return render_template("register.html")
    # do something

@app.route("/login")
def login():
    return render_template("login.html")

if __name__ == "__main__":
	app.run(host="0.0.0.0", port="8000")
