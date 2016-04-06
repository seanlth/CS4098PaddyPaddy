from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver import ActionChains

import string
import random

testInvalidPML = "process a {\n\
    action b {\n\
        requires {r}\n\
        provides {}\n\
    }\n\
}"

driver = webdriver.Firefox()
driver.get("http://0.0.0.0:8000")

#test load
assert "Editor" in driver.title
print("Successful: Title Loaded")

#test autocomplete
driver.find_element_by_class_name("ace_text-input").send_keys("proc")
driver.find_element_by_class_name("ace_text-input").send_keys(Keys.TAB)
driver.implicitly_wait(10)

assert "process" == driver.execute_script("return editor.getValue()")
print("Successful: autocomplete")

driver.execute_script("editor.setValue(arguments[0])", testInvalidPML)
driver.find_element_by_partial_link_text("Analyse").click()
driver.implicitly_wait(10)

annotations = driver.execute_script("return editor.getSession().getAnnotations()")

assert annotations[0]["type"] == "error"
print("Successful: Error highlighted")

testValidPML = "process c {\n\
    action d {\n\
        requires {r}\n\
        provides {r}\n\
    }\n\
}"

driver.execute_script("editor.setValue(arguments[0])", testValidPML)
driver.find_element_by_partial_link_text("Analyse").click()
driver.implicitly_wait(10)

outputBeforeView = driver.find_element_by_id("output").get_attribute("value")
annotations = driver.execute_script("return editor.getSession().getAnnotations()")

assert annotations == []
print("Successful: Error removed on valid input")

driver.find_element_by_partial_link_text('View').click()
driver.find_element_by_partial_link_text("Analyse").click()
driver.implicitly_wait(10)
outputAfterView = driver.find_element_by_id("outputPanel").get_attribute("value")

assert driver.execute_script("return program.actions.length") == 1
assert driver.execute_script("return program.actions[0].name") == "d"
assert outputBeforeView == outputAfterView
print("Successful: Program diagram loaded")

canvas = driver.find_element_by_id("canvas")
canvas.click()
actions = ActionChains(driver)
actions.move_to_element(canvas)
actions.click()
actions.perform()

driver.implicitly_wait(10)

driver.find_element_by_id("remove_action").click()
driver.switch_to_alert().accept()
assert driver.execute_script("return program.actions.length") == 0
print("Successful: Action deleted")

driver.implicitly_wait(10)

actions.move_to_element(canvas).perform()
driver.implicitly_wait(10)

actions = ActionChains(driver)
actions.move_by_offset(0, -16)
actions.click()
actions.perform()

driver.implicitly_wait(10)

actions = ActionChains(driver)
actions.move_to_element(canvas)
actions.click()
actions.perform()

driver.implicitly_wait(10)

driver.find_element_by_id("name").send_keys("b")
driver.find_element_by_id("script").send_keys("print('hello world')")
driver.find_element_by_id("requires").send_keys("r2")
driver.find_element_by_id("provides").send_keys("r3")
driver.find_element_by_id("done_action").click()

assert "b" in driver.execute_script("return program.actions[0].name")
print("Successful: Action name edited")
assert "print('hello world')" == driver.execute_script("return program.actions[0].script")
print("Successful: Action script edited")

assert "r2" == driver.execute_script("return program.actions[0].requires")
assert "r3" == driver.execute_script("return program.actions[0].provides")
print("Successful: Action resources edited")

driver.find_element_by_partial_link_text("Analyse").click()
driver.implicitly_wait(10)
outputBeforeGenerate = driver.find_element_by_id("outputPanel").get_attribute("value")
driver.find_element_by_partial_link_text("Generate").click()

driver.find_element_by_partial_link_text("Analyse").click()
driver.implicitly_wait(10)
outputAfterGenerate = driver.find_element_by_id("output").get_attribute("value")
assert outputBeforeGenerate == outputAfterGenerate
# print("Successful: PML generated")

def signup(): 
    driver.get("http://0.0.0.0:8000/signup"); 
    driver.find_element_by_name("email").send_keys("test@test.test");
    driver.find_element_by_name("password").send_keys("testpassword");
    driver.find_element_by_name("verify").send_keys("testpassword");
    driver.find_element_by_name("submit").click();
    assert driver.current_url == "http://0.0.0.0:8000/";
    print("Successful: Signup");

def file_upload():
    driver.get("http://0.0.0.0:8000/upload");
    driver.findElement(By.id("upload")).sendKeys("<absolutePathToMyFile>");
    driver.execute_script("return upload_hook()");
    

signup();

def file_upload():
    driver.get 

input("Press Enter to continue...")
driver.quit()
