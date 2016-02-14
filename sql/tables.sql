create database PML_IDE;

create table PML_IDE.Users
	(
		id integer null auto_increment,
		name VARCHAR(30),
		username VARCHAR(30),
		email VARCHAR(30),
		password VARCHAR(30) -- lol
	);
