from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.database_create import Base, User


def query_user(email):
	engine = create_engine('sqlite:///pml.db')
	Base.metadata.bind = engine
	DBSession = sessionmaker(bind=engine)
	session = DBSession()
	return session.query(User).filter(User.email==email).first()

def number_of_users():
	engine = create_engine('sqlite:///pml.db')
	Base.metadata.bind = engine
	DBSession = sessionmaker(bind=engine)
	session = DBSession()
	return session.query(User).count()

# probably shouldn't have this hanging around
def clear_users():
	engine = create_engine('sqlite:///pml.db')
	Base.metadata.bind = engine
	DBSession = sessionmaker(bind=engine)
	session = DBSession()
	session.query(User).delete()
