create database PdyPdy;

create table PdyPdy.Users
	(
		id integer null auto_increment,
		name VARCHAR(30),
		username VARCHAR(30),
		email VARCHAR(30),
		password VARCHAR(30), -- lol
		primary key(id)
	);
