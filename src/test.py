from flask import Flask
from flask import request
from flask import render_template
from subprocess import check_output
import tempfile

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
    with tempfile.NamedTemporaryFile(mode='w+t', suffix='.pml') as f:
        fname = f.name

        f.write(request.form["program"])
        f.flush()

        return check_output(["./pmlcheck", fname]).decode() \
                                                  .replace("\n", "<br/>") \
                                                  .replace(fname+':', "Line ")

@app.route("/ace")
def ace():
    return render_template("form2.html")

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8000)# debug=True)
