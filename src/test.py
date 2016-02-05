from flask import Flask
from flask import request
from flask import render_template
from subprocess import check_output

app = Flask(__name__)

@app.route("/")
def my_form():
    return render_template("form.html")

@app.route("/", methods=["POST"])
def my_form_post():
    f = open("temp.pml", "w")
    f.write(request.form["text"])
    f.close()
    output = check_output(["./../pmlcheck", "temp.pml"])
    return asd

if __name__ == "__main__":
	app.run(host="0.0.0.0", port="8000")
