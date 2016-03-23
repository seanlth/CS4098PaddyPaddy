from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.database_create import Base, User



def insert_user(email, password_hash):
	engine = create_engine('sqlite:///pml.db')
	Base.metadata.bind = engine
	DBSession = sessionmaker(bind=engine)
	session = DBSession()
	new_user = User(email=email, password=password_hash)
	session.add(new_user)
	session.commit()
def insert_social_user(social):
    engine = create_engine('sqlite:///pml.db')
    Base.metadata.bind = engine
    DBSession = sessionmaker(bind=engine)
    session = DBSession()
    new_user = User(social = social)
    session.add(new_user)
    session.commit()
def insert_g_user(email):
    engine = create_engine('sqlite:///pml.db')
    Base.metadata.bind = engine
    DBSession = sessionmaker(bind=engine)
    session = DBSession()
    new_user = User(email = email)
    session.add(new_user)
    session.commit()
