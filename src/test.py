from flask import Flask
from flask import request
from flask import render_template
from subprocess import check_output
from subprocess import STDOUT
from subprocess import CalledProcessError
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

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=int(8000))#, debug=True)
