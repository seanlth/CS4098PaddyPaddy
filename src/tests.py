import runServer

import os
import os.path
import unittest
import tempfile
import base64

class FlaskrTestCase(unittest.TestCase):

    def setUp(self):
        self.db_fd, runServer.app.config['DATABASE'] = tempfile.mkstemp()
        runServer.app.config['TESTING'] = True
        self.app = runServer.app.test_client()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(runServer.app.config['DATABASE'])

    def register(self, email, password):
        return self.app.post('/signup', data=dict(
            email=email,
            password=password
        ), follow_redirects=True) 
    
    def login(self, email, password):
        return self.app.post('/login', data=dict(
            email=email,
            password=password
        ), follow_redirects=True)

    def logout(self):
        return self.app.get('/logout', follow_redirects=True) 
    
    def editor(self):
        return self.app.get('/', follow_redirects=True)  

    def filesave(self, name):
        return self.app.post('/saveAs', data=dict(
            filename=name 
        ), follow_redirects=True)  
    
    def tmp(self, contents):
        return self.app.post('/tmp', data=dict(
            content=contents 
        ), follow_redirects=True)  

    def test_editor(self):
        print('testing editor')
        rv = self.editor()
        assert rv.status == '200 OK'

    def test_register(self):
        print('testing register')
        rv = self.register('test', 'test')
        assert rv.status == '200 OK'

    def test_email_auth(self):
        print('testing login/logout')
        rv = self.login('test', 'test')
        assert b'Incorrect/Invalid e-mail and/or password<br/>' != rv.data

    def test_email_auth_failure(self):
        print('testing login/logout failure')
        rv = self.login('none', 'none')
        assert b'Incorrect/Invalid e-mail and/or password<br/>' == rv.data
   
    def test_auto_complete(self):
        print('testing authcomplete')
        rv = self.editor()
        response = rv.data.decode()
        liveautocomplete = "enableLiveAutocompletion: true"
        basicautocomplete = "enableBasicAutocompletion: true"
        assert response.find(liveautocomplete) != -1
        assert response.find(basicautocomplete) != -1
            
    def test_filesave(self):
        print('testing file save')
        self.login('test', 'test')
        pml_code = b'some pml'
        self.tmp(base64.b64encode(pml_code))
        self.filesave('test.pml')
        assert os.path.isfile('userFiles/test/test.pml') == True


if __name__ == '__main__':
    unittest.main()
