from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver import ActionChains

import string
import random
from time import sleep

testFancyPML = "process a {\n\
    action miracle {\n\
        agent {a}\n\
        provides {r}\n\
    }\n\
    branch {\n\
        action empty {\n\
        }\n\
        action blackhole {\n\
            agent {a}\n\
            requires {r}\n\
        }\n\
        action transform {\n\
            agent {a}\n\
            provides {a}\n\
            requires {b}\n\
        }\n\
    }\n\
}"

testInvalidPML = "process a {\n\
    action b {\n\
        requires {r}\n\
        provides {}\n\
    }\n\
}"

driver = webdriver.Firefox()
driver.get("http://localhost:8000")

def signup(email):
    driver.get("http://localhost:8000/signup");
    driver.find_element_by_name("email").send_keys(email);
    driver.find_element_by_name("password").send_keys("testpassword");
    driver.find_element_by_name("verify").send_keys("testpassword");
    driver.find_element_by_name("submit").click();
    if driver.current_url == "http://localhost:8000/":
        print("Successful: Signup");
    else:
        print("Failure: Signup");

def file_upload():
    driver.get("http://localhost:8000/upload");
    driver.findElement(By.id("upload")).sendKeys("<absolutePathToMyFile>");
    driver.execute_script("return upload_hook()");

def facebook():
    driver.get("http://localhost:8000/login")
    driver.find_element_by_name("facebook").click();
    if "Log into Facebook" in driver.title:
        print("Successful: Facebook login reached")
    else:
        print("Failure: Facebook login reached")

def twitter():
    driver.get("http://localhost:8000/login")
    driver.find_element_by_name("twitter").click();
    if "Twitter" in driver.title:
        print("Successful: Twitter login reached")
    else:
        print("Failure: Twitter login reached")

email = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(10)) + "@test.test"
signup(email);
driver.get("http://localhost:8000/logout")
facebook()
driver.get("http://localhost:8000/logout")
twitter()

driver.get("http://localhost:8000/")
driver.execute_script("editor.setValue(arguments[0])", testFancyPML)
driver.find_element_by_partial_link_text("Analyse").click()
sleep(1)
driver.find_element_by_partial_link_text('View').click()

input("You can view the various Action Colours and Flow Lines here, press enter to continue with tests.")
driver.execute_script("window.onbeforeunload = function () {};")
driver.get("http://localhost:8000/logout")
#test load
if "Editor" in driver.title:
    print("Successful: Title Loaded")
else:
    Failurerint("Successful: Title Loaded")

#test autocomplete
driver.find_element_by_class_name("ace_text-input").send_keys("proc")
driver.find_element_by_class_name("ace_text-input").send_keys(Keys.TAB)
sleep(1)

if "process" == driver.execute_script("return editor.getValue()"):
    print("Successful: autocomplete")
else:
    Failurerint("Successful: autocomplete")

driver.execute_script("editor.setValue(arguments[0])", testInvalidPML)
driver.find_element_by_partial_link_text("Analyse").click()
sleep(2)

annotations = driver.execute_script("return editor.getSession().getAnnotations()")
sleep(1)
if annotations[0]["type"] == "error":
    print("Successful: Error highlighted")
else:
    print("Failure: Error highlighted")

testValidPML = "process c {\n\
    action d {\n\
        requires {r}\n\
        provides {r}\n\
    }\n\
}"

driver.execute_script("editor.setValue(arguments[0])", testValidPML)
driver.find_element_by_partial_link_text("Analyse").click()
sleep(1)

outputBeforeView = driver.find_element_by_id("output").get_attribute("value")
annotations = driver.execute_script("return editor.getSession().getAnnotations()")

if annotations == []:
    print("Successful: Error removed on valid input")
else:
    print("Failure: Error removed on valid input")

driver.find_element_by_partial_link_text('View').click()
sleep(5)
driver.find_element_by_partial_link_text("Analyse").click()
outputAfterView = driver.find_element_by_id("outputPanel").get_attribute("value")

if driver.execute_script("return program.actions.length") == 1 and outputBeforeView == outputAfterView:
    print("Successful: Program diagram loaded")
else:
    print("Failure: Program diagram loaded")

canvas = driver.find_element_by_id("canvas")
canvas.click()
actions = ActionChains(driver)
actions.move_to_element(canvas)
actions.click()
actions.perform()

sleep(1)

driver.find_element_by_id("remove_action").click()
driver.switch_to_alert().accept()
if driver.execute_script("return program.actions.length") == 0:
    print("Successful: Action deleted")
else:
    print("Failure: Action deleted")

sleep(1)

actions.move_to_element(canvas).perform()
sleep(1)

actions = ActionChains(driver)
actions.move_by_offset(0, -16)
actions.click()
actions.perform()

sleep(1)

actions = ActionChains(driver)
actions.move_to_element(canvas)
actions.click()
actions.perform()

sleep(1)

driver.find_element_by_id("name").send_keys("b")
driver.find_element_by_id("script").send_keys("print('hello world')")
driver.find_element_by_id("agent-edit").click()
driver.find_element_by_class_name("base").send_keys("a")
driver.find_element_by_id("base_addDot").click()
driver.find_element_by_class_name("postDotBase").send_keys("b")
driver.find_element_by_id("finished").click()
driver.find_element_by_id("done_action").click()

if "b" in driver.execute_script("return program.actions[0].name"):
    print("Successful: Action name edited")
else:
    print("Failure: Action name edited")
if "a.b" == driver.execute_script("return predicate_to_string(program.actions[0].agent)"):
    print("Successful: Action enhanced predicate edited")
else:
    print("Successful: Action enhanced predicate edited")
if "print('hello world')" == driver.execute_script("return program.actions[0].script"):
    print("Successful: Action script edited")
else:
    print("Failureccessful: Action script edited")

driver.find_element_by_partial_link_text("Analyse").click()
sleep(1)
outputBeforeGenerate = driver.find_element_by_id("outputPanel").get_attribute("value")
driver.find_element_by_partial_link_text("Generate PML").click()
sleep(1)
driver.find_element_by_partial_link_text("Analyse").click()
sleep(1)
outputAfterGenerate = driver.find_element_by_id("outputPanel").get_attribute("value")
if outputBeforeGenerate == outputAfterGenerate:
    print("Successful: PML generated")
else:
    print("Failure: PML generated")

def signup(email):
    driver.get("http://localhost:8000/signup");
    driver.find_element_by_name("email").send_keys(email);
    driver.find_element_by_name("password").send_keys("testpassword");
    driver.find_element_by_name("verify").send_keys("testpassword");
    driver.find_element_by_name("submit").click();
    if driver.current_url == "http://localhost:8000/":
        print("Successful: Signup");
    else:
        print("Failure: Signup");

def file_upload():
    driver.get("http://localhost:8000/upload");
    driver.findElement(By.id("upload")).sendKeys("<absolutePathToMyFile>");
    driver.execute_script("return upload_hook()");

def facebook():
    driver.get("http://localhost:8000/login")
    driver.find_element_by_name("facebook").click();
    if "Log into Facebook" in driver.title:
        print("Successful: Facebook login reached")
    else:
        print("Failure: Facebook login reached")

def twitter():
    driver.get("http://localhost:8000/login")
    driver.find_element_by_name("twitter").click();
    print(driver.title)
    if "Twitter/Authorise" in driver.title:
        print("Successful: Twitter login reached")
    else:
        print("Failure: Twitter login reached")

input("Press Enter to continue...")
driver.quit()
