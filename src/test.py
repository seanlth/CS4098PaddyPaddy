from flask import Flask, request, render_template, request, redirect, url_for, send_from_directory
from werkzeug import secure_filename
from subprocess import check_output, STDOUT, CalledProcessError
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

app.jinja_env.globals['get_resource_as_string'] = get_resource_as_string
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['ALLOWED_EXTENSIONS'] = set(['pml'])


@app.route("/")
def my_form():
    return render_template("form.html")

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

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

# @app.route('/uploads/<filename>')
# def uploaded_file(filename):
#     return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/index')
def index():
    return render_template('index.html')

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8000, debug=DEBUG)

