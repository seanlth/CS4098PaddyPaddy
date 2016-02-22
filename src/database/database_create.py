import os
import sys
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine

Base = declarative_base()

class User(Base):
    __tablename__ = 'User'
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    email = Column(String(250), nullable=False)
    password = Column(String(250), nullable=False)

engine = create_engine('sqlite:///pml.db')

Base.metadata.create_all(engine)
