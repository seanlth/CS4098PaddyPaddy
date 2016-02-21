from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.database_create import Base, User


def query_user(id):
	engine = create_engine('sqlite:///pml.db')
	Base.metadata.bind = engine
	DBSession = sessionmaker(bind=engine)
	session = DBSession()
	return session.query(User).filter(User.id==id).first()

def number_of_users():
	engine = create_engine('sqlite:///pml.db')
	Base.metadata.bind = engine
	DBSession = sessionmaker(bind=engine)
	session = DBSession()
	return session.query(User).count()
