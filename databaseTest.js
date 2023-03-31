
// demonstration server endpoint at https://jrproj.xyz/loginEndpoint
app.post('/databaseTest', async function (req, res) {
	try {
		// verify that the token sent in the body of the HTTP request is valid, if it is then userData will contain user information
		// const userData = await firebaseApp.auth().verifyIdToken(req.body.token);

		// create a table in the db if it doesn't already exist, the results of the creation will be provided in createConfirmation
		let createConfirmation = await db.query(`
		CREATE TABLE IF NOT EXISTS Product (
			ProductID INT(4) UNSIGNED NOT NULL PRIMARY KEY, 
			Name VARCHAR(50) NOT NULL, 
			QuantityOnHand INT(3) NOT NULL,
			UnitPrice DECIMAL(4,1) NOT NULL
		);
		
		CREATE TABLE IF NOT EXISTS Permission (
			PermissionID INT(3) UNSIGNED NOT NULL PRIMARY KEY, 
			PermissionName VARCHAR(20) NOT NULL
		);
		
		CREATE TABLE IF NOT EXISTS Role (
			RoleID INT(3) UNSIGNED NOT NULL PRIMARY KEY, 
			RoleName VARCHAR(20) NOT NULL
		);
		
		// CREATE TABLE IF NOT EXISTS RolePermission (
		// 	RolePermissionID INT(4) UNSIGNED NOT NULL PRIMARY KEY,
		// 	Name VARCHAR(20) NOT NULL, 
		// 	RoleID INT(3) NOT NULL,
		// 	PermissionID INT(3) NOT NULL,
		// 	FOREIGN KEY (RoleID) REFERENCES Role (RoleID),
		// 	FOREIGN KEY (PermissionID) REFERENCES Permission (PermissionID) 
		// );
		
		Create table if not exists UserRole (UserID VARCHAR(60) NOT NULL NOT NULL, RoleID INT(3) UNSIGNED NOT NULL, Foreign Key (UserID) References Users(UserID), Foreign key (RoleID) references Role(RoleID), Primary Key (UserID, RoleID));
		

		Create table if not exists RolePermission (PermissionID INT(3) UNSIGNED NOT NULL, RoleID INT(3) UNSIGNED NOT NULL, Foreign Key (PermissionID) References Permission(PermissionID), Foreign key (RoleID) references Role(RoleID), Primary Key (PermissionID, RoleID));


		CREATE TABLE IF NOT EXISTS Users (
			UserID VARCHAR(60) NOT NULL PRIMARY KEY,
			FirstName VARCHAR(20) NOT NULL, 
			LastName VARCHAR(20) NOT NULL,
			DOB DATE NOT NULL,
			Email VARCHAR(30) NOT NULL,
			MobileNo CHAR(10) NOT NULL,
			RolePermissionID INT(4) NOT NULL,
			FOREIGN KEY (RolePermissionID) REFERENCES RolePermission (RolePermissionID) 
		);
		
		CREATE TABLE IF NOT EXISTS Requests (
			ProductID INT(4) UNSIGNED NOT NULL, 
			UserID VARCHAR(60) NOT NULL, 
			QuantityNeeded INT (3) UNSIGNED NOT NULL,
			PRIMARY KEY (ProductID, UserID),
			FOREIGN KEY (ProductID) REFERENCES Product (ProductID),
			FOREIGN KEY (UserID) REFERENCES Users (UserID)
		);
		
		CREATE TABLE IF NOT EXISTS Sales (
			SalesID INT(7) UNSIGNED NOT NULL PRIMARY KEY, 
			UserID VARCHAR(60) UNSIGNED NOT NULL,
			TotalPrice DECIMAL (4, 1) NOT NULL,
			FOREIGN KEY (UserID) REFERENCES Users (UserID)
		);
		
		CREATE TABLE IF NOT EXISTS ProductSales (
			ProductID INT(4) UNSIGNED NOT NULL,
			SalesID INT(5) UNSIGNED NOT NULL,
			Qauntity INT(3) UNSIGNED NOT NULL,
			PRIMARY KEY (ProductID, SalesID),
			FOREIGN KEY (ProductID) REFERENCES Product (ProductID),
			FOREIGN KEY (SalesID) REFERENCES Sales (SalesID)
		);
		`)

		// perform a select request on the database using the uid property from the userData gathered earlier
		// selectConfirmation should be an array of all values that matched the condition
		let selectConfirmation = await db.query(`SELECT * FROM User WHERE uID = '${userData.uid}';`)
		
		// if there were no results to the select statement...
		if (selectConfirmation.length == 0) {
			// perform an insert query on the database 
			// details about the success of the insert will be stored in insertConfirmation
			let insertConfirmation = await db.query(`
			INSERT INTO Product (Name, QauntityOnHand, UnitPrice) VALUES 
				('Shampoo', 5, 25),
				('Soap', 10, 5);
				
			INSERT INTO Permission (PermissionName) VALUES ('CreateUsers'), ('UpdateUsers'), ('Deleteusers'), ('CreateProducts'), ('UpdateProducts'), ('DeleteProducts');
				
			INSERT INTO Role (RoleName) VALUES ('StoreManager'), ('OfficeAdmin');
				
			INSERT INTO RolePermission (RoleID, PermissionID) VALUES (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6);

			INSERT INTO UserRole (UserID, RoleID) VALUES ('GObd99MvPFMAIwHU2yfNv04SU8C3', 1);

SELECT * 
FROM UserRole ur
JOIN RolePermission rp ON rp.RoleID = ur.RoleID
JOIN Permission p ON p.PermissionID = rp.PermissionID
WHERE ur.UserID = 'QYdFgvfvZQWees00f8zzwb7aqgF2' AND p.PermissionName = 'CreateProducts';

			// INSERT INTO Users (UserID, Name, Email) VALUES ('abcdefg123', 'John', 'John@gmail.com')
			// 	('lmnopqw123', 'Rob', 'White', '09/08/1997', '0418971231', 1001);
				
			INSERT INTO Requests (ProductID, UserID, QuantityNeeded) VALUES
				(0001, 'abcdefg123', 10),
				(0002, 'lmnopqw123', 20);
				
INSERT INTO Sales (UserID, TotalPrice) VALUES
('P1G6BJ7UI8gFfN3Nch6Ddl6brO42', 50)
				
INSERT INTO ProductSales (ProductID, SalesID, Quantity) VALUES
(18, 118, 2), 
(25, 118, 4)
			
			`)
		}




	

		// send the userData back to the client in json format
		res.json(userData);
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});



// -----------------------RESPOND TO 404 ERRORS----------------------

app.use((req,res)=>{
	res.send(`<h1>it's the 404</h1>`)
});
