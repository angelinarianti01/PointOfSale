let http = require('http');
let https = require('https');
let fs = require('fs');
let express = require('express');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/jproj.xyz/privkey.pem', 'utf8');
// x509 certificate
const certificate = fs.readFileSync('/etc/letsencrypt/live/jproj.xyz/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/jproj.xyz/chain.pem', 'utf8');

const options = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

let app = express();

let cors = require('cors')

app.use(express.json());


// if they ever use port 80 then tell them the permanent redirect location
http.createServer(function (req, res) {
	                                    // e.g.   website.com:8080      /about
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

let httpsServer = https.createServer(options,app);
httpsServer.listen(443);

var admin = require("firebase-admin");

var serviceAccount = require("./gotogro-bc075-firebase-adminsdk-ncvuc-925de8260e.json");

let firebaseApp = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});


console.log("this is proof that the server is running")

let { JSQL } = require('./jsql.js');
let db = new JSQL({
	host: "127.0.0.1",
	user: "gotogro",
	password: "gotogro",
	database: 'GotoGro'
})

// ---------------------ANYTHING IN THE PUBLIC FOLDER----------------

let path = __dirname + '/public';
// Use global wilcard route / used to serve static content, html assumed as default unless explicitly specified otherwise in the url
app.use('/',express.static(path,{extensions:['html']}));


// ----------------------CUSTOM ENDPOINTS--------------------------------


async function userHasPermission(firebaseUserObject, permissionAsString) {
	if (firebaseUserObject && permissionAsString) {
		let userData = await db.query(`SELECT *
		FROM UserRole ur
		JOIN RolePermission rp ON rp.RoleID = ur.RoleID
		JOIN Permission p ON p.PermissionID = rp.PermissionID
		WHERE ur.UserID = '${firebaseUserObject.user_id}' AND p.PermissionName = '${permissionAsString}';`);
		if (userData.length > 0) {
			return true;
		}
	}
	return false;
}

// demonstration server endpoint at https://jrproj.xyz/loginEndpoint
app.post('/demontrationEndpoint', async function (req, res) {
	try {
		// verify that the token sent in the body of the HTTP request is valid, if it is then userData will contain user information
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);

		// create a table in the db if it doesn't already exist, the results of the creation will be provided in createConfirmation
		let createConfirmation = await db.query(`CREATE TABLE IF NOT EXISTS User (
			uID VARCHAR(128) NOT NULL PRIMARY KEY
			);`)

		// perform a select request on the database using the uid property from the userData gathered earlier
		// selectConfirmation should be an array of all values that matched the condition
		let selectConfirmation = await db.query(`SELECT * FROM User WHERE uID = '${userData.uid}';`)

		// if there were no results to the select statement...
		if (selectConfirmation.length == 0) {
			// perform an insert query on the database
			// details about the success of the insert will be stored in insertConfirmation
			let insertConfirmation = await db.query(`INSERT INTO User (uID) VALUES ('${userData.uid}');`)
		}

		// send the userData back to the client in json format
		res.json(userData);
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/getRoles', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`SELECT RoleName
				FROM UserRole ur
				JOIN Role r ON r.RoleID = ur.RoleID
				WHERE ur.UserID = '${userData.user_id}';`);
			res.json(results);
		} else {
			res.json('can only get roles if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/products_list', async function (req, res) {
	try {
		//let results = await db.query(`SELECT * FROM Product;`);

		const userData = await firebaseApp.auth().verifyIdToken(req.body.token); //not working

		if (userData) {
			let query = ``
			if (req.body.category == "All") {
				query = `SELECT * FROM Product WHERE isDeleted = 0;`;
			}
			else {
				query = `SELECT * FROM Product WHERE Category = '${req.body.category}' AND isDeleted = 0;`;
			}	
			let results = await db.query(query);		
			res.json(results);
		} else {
			res.json('can only save to the database if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/getPrice', async function (req, res) {
	try {
			let query = await db.query(`SELECT UnitPrice FROM Product WHERE ProductID = ${parseInt(req.body.productID)};`);
			let price = query[0].UnitPrice;
			res.json(price);

	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/proccessSales', async function (req, res) {
	try {

		// check for user permissions
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData && await userHasPermission(userData,'MakeSales')) {


			let enoughQuantityOnHand = true;

			// calculate the total of the sale
			let total = 0;

			for (var i = 0; i < req.body.products.length; i++) {
				product = req.body.products[i];
				let [productCheck] = await db.query(`SELECT UnitPrice, QuantityOnHand FROM Product WHERE ProductID = '${product.ProductID}';`);

				//check if there is the stock on hand to perform the sale
				if (productCheck.QuantityOnHand < product.Quantity)	{
					console.log(`${productCheck.QuantityOnHand} < ${product.Quantity}`)
					enoughQuantityOnHand = false;
				} else {
					total += productCheck.UnitPrice*product.Quantity
				}
			}

			console.log(enoughQuantityOnHand)
			if (enoughQuantityOnHand) {
				// create new sale in Sale table
				let newSale = await db.query(`INSERT INTO Sales (UserID, TotalPrice) VALUES ('${userData.uid}', ${total});`);



				// get the SaleID of the newly inserted Sale
				// for each item in the sale, insert a new entry into ProductSale, update the stock
				for (var i = 0; i < req.body.products.length; i++) {
					let product = req.body.products[i];
					let newProductSale = await db.query(`INSERT INTO ProductSales VALUES ('${product.ProductID}', ${newSale.insertId}, ${product.Quantity});`);

					//udpate stock
					let query = await db.query(`SELECT QuantityOnHand FROM Product WHERE ProductID = ${product.ProductID};`);
					let quantity = query[0].QuantityOnHand - parseInt(product.Quantity);

					let newStockUpdate = await db.query(`UPDATE Product SET QuantityOnHand = ${quantity} WHERE ProductID = ${product.ProductID};`);
				}

				// if everything is all good, send back the total as a confirmation to the server
				res.json(total);
			} else {
				res.json('not enough quantity on hand to perform sale')
			}

		} else {
			res.json('can only save to the database if logged in and you have permission to make sales');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/displayProductSales', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`Select Sales.SalesID, Users.Name, Product.Name, ProductSales.Quantity from ProductSales left join (Sales, Users, Product) on (ProductSales.SalesID = Sales.SalesID AND Sales.UserID = Users.UserID AND ProductSales.ProductID = Product.ProductID) ORDER BY Sales.SalesID DESC;`);
			res.json(results);
		} else {
			res.json('you can only view members when you are logged in')
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/displayProductSalesByID', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`Select Sales.SalesID, Users.Name, Product.Name, ProductSales.Quantity from ProductSales left join (Sales, Users, Product) on (ProductSales.SalesID = Sales.SalesID AND Sales.UserID = Users.UserID AND ProductSales.ProductID = Product.ProductID) WHERE Sales.SalesID = ${req.body.salesID}`);
			res.json(results);
		} else {
			res.json('you can only view members when you are logged in')
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.get('/displayProducts', async function (req, res) {
	try {
		let results = await db.query(`SELECT ProductID, Name, QuantityOnHand, UnitPrice, Category, LastUpdated,	ProductAdded FROM Product WHERE isDeleted = 0;`);
		res.json(results);

		// const userData = await firebaseApp.auth().verifyIdToken(req.body.token); //not working
		// console.log(userData);

		// if (userData) {
		// 	let results = await db.query(`SELECT * FROM Product;`);
		// 	res.json(results);
		// } else {
		// 	res.json('can only save to the database if logged in');
		// }
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/getMemberSales', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`SELECT SalesID, TotalPrice, Time FROM Sales WHERE UserID = '${userData.user_id}'; `);
			res.json(results);
		} else {
			res.json('you can only view members when you are logged in')
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/welcomeNote', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`SELECT Name FROM Users WHERE UserID = '${userData.user_id}'; `);
			res.json(results);
		} else {
			res.json('you can only view members when you are logged in')
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});



app.post('/displayMembers', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`SELECT UserID, Name, Email, MobileNo, LastUpdated FROM Users WHERE isDeleted = 0;`);
			res.json(results);
		} else {
			res.json('you can only view members when you are logged in')
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/bestSellingProducts', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData){
			let results = await db.query(`SELECT ps.ProductID, p.Name, COUNT(Quantity) AS QuantitySold FROM ProductSales ps JOIN Product p ON p.ProductID = ps.ProductID JOIN Sales s ON ps.SalesID = s.SalesID WHERE s.Time BETWEEN '${req.body.startDate} 00:00:00' AND '${req.body.endDate} 00:00:00' GROUP BY ProductID ORDER BY QuantitySold DESC;`);
			res.json(results);
		} else {
			res.json('can only look at best selling products if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/updateMember', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData && await userHasPermission(userData,'UpdateUsers')){
			let results = await db.query(`UPDATE Users SET UserID = '${req.body.UserID}', Name = '${req.body.Name}', Email = '${req.body.Email}', 	MobileNo = '${req.body.MobileNo}', LastUpdated = CURRENT_TIMESTAMP WHERE UserID = '${req.body.UserID}';`);
			res.json(results);
		} else {
			res.json('can only save to the database if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/deleteMember', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData && await userHasPermission(userData,'DeleteUsers')) {
			let results = await db.query(`UPDATE Users SET isDeleted = 1 WHERE ProductID = ${req.body.UserID};`);
			res.json(results);
		} else {
			res.json('can only delete users if you have the DeleteUsers permission and are logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/addNewProduct', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		// only allow the user to add to the database if they 1) exist and 2) have the CreateProducts permission
		if (userData && await userHasPermission(userData,'CreateProducts')) {
			// let varName = 'something';
			// let compositeString = 'this string begins here' + varName + 'and ends here';
			// let jsCompositeString = `this string begins here ${varName} and ends here`;
			let results = await db.query(`INSERT INTO Product (Name,QuantityOnHand,UnitPrice,Category) VALUES ('${req.body.name}','${req.body.quantityOnHand}','${req.body.unitPrice}','${req.body.productCategory}');`);
			res.json(results);
		} else {
			res.json('can only save to the database if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/updateProduct', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData && await userHasPermission(userData,'UpdateProducts')) {
			// let varName = 'something';
			// let compositeString = 'this string begins here' + varName + 'and ends here';
			// let jsCompositeString = `this string begins here ${varName} and ends here`;
			//let results = await db.query(`UPDATE Product SET ${req.body.updateColumn} = ${req.body.value} WHERE ProductID = ${req.body.productID};`);
			let results = await db.query(`UPDATE Product SET Name = '${req.body.Name}', QuantityOnHand = ${req.body.QuantityOnHand}, UnitPrice = ${req.body.UnitPrice}, Category = '${req.body.Category}', LastUpdated = CURRENT_TIMESTAMP WHERE ProductID = ${req.body.ProductID};`);
			res.json(results);
			console.log(results);
		} else {
			res.json('can only save to the database if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/deleteProduct', async function (req, res) {
	try {
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);
		if (userData && await userHasPermission(userData,'DeleteProducts')) {
			let results = await db.query(`UPDATE Product SET isDeleted = 1 WHERE ProductID = ${req.body.ProductID};`);
			res.json(results);
		} else {
			res.json('can only save to the database if logged in');
		}
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/loginEndpoint', async function (req, res) {
	try {
		// verify that the token sent in the body of the HTTP request is valid, if it is then userData will contain user information
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);

		let selectConfirmation = await db.query(`SELECT * FROM Users WHERE UserID = '${userData.uid}';`)

		if (selectConfirmation.length == 0) {
			let insertConfirmation = await db.query(`INSERT INTO Users (UserID, Name, Email) VALUES ('${userData.uid}', '${userData.name}', '${userData.email}');`)
		}

		res.json(userData);
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

app.post('/getCurrentUserRoles', async function (req, res) {
	try {
		// verify that the token sent in the body of the HTTP request is valid, if it is then userData will contain user information
		const userData = await firebaseApp.auth().verifyIdToken(req.body.token);

		let roles = await db.query(`SELECT RoleName FROM UserRole ur JOIN Role r ON r.RoleID = ur.RoleID WHERE ur.UserID = '${userData.uid}';`)

		res.json(roles);
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});

// demonstration server endpoint at https://jrproj.xyz/loginEndpoint
app.post('/databaseTest', async function (req, res) {
	try {
		// verify that the token sent in the body of the HTTP request is valid, if it is then userData will contain user information
		// const userData = await firebaseApp.auth().verifyIdToken(req.body.token);

		let resultsArray = [];

		let insertArray = [];

		resultsArray.push(await db.query(`
		show tables;`))

		resultsArray.push(await db.query(`
		describe Product;`))

		// creating the database tables
		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS Product (
			ProductID INT(4) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			Name VARCHAR(50) NOT NULL,
			QuantityOnHand INT(3) NOT NULL,
			UnitPrice DECIMAL(4,1) NOT NULL
		);`))

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS Permission (
			PermissionID INT(3) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			PermissionName VARCHAR(20) NOT NULL
		);`))

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS Role (
			RoleID INT(3) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			RoleName VARCHAR(20) NOT NULL
		);`))

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS RolePermission (
			RolePermissionID INT(4) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			Name VARCHAR(20) NOT NULL,
			RoleID INT(3) NOT NULL,
			PermissionID INT(3) NOT NULL,
			FOREIGN KEY (RoleID) REFERENCES Role (RoleID),
			FOREIGN KEY (PermissionID) REFERENCES Permission (PermissionID)
		);`))

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS Users (
			UserID VARCHAR(60) NOT NULL PRIMARY KEY,
			Name VARCHAR(70) NOT NULL,
			DOB DATE,
			Email VARCHAR(30) NOT NULL,
			MobileNo CHAR(10),
			RolePermissionID INT(4)
			FOREIGN KEY (RolePermissionID) REFERENCES RolePermission (RolePermissionID)
		);`))
		// FOREIGN KEY (RolePermissionID) REFERENCES RolePermission (RolePermissionID)) ---> fixed (ALTER TABLE Sales MODIFY SalesID INT UNSIGNED AUTO_INCREMENT)

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS Requests (
			ProductID INT(4) UNSIGNED NOT NULL,
			UserID VARCHAR(60) NOT NULL,
			QuantityNeeded INT (3) UNSIGNED NOT NULL,
			PRIMARY KEY (ProductID, UserID),
			FOREIGN KEY (ProductID) REFERENCES Product (ProductID),
			FOREIGN KEY (UserID) REFERENCES Users (UserID)
		);`))

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS Sales (
			SalesID INT(7) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			UserID VARCHAR(60) NOT NULL,
			TotalPrice DECIMAL (4, 1) NOT NULL,
			FOREIGN KEY (UserID) REFERENCES Users (UserID)
		);
		`))

		resultsArray.push(await db.query(`
		CREATE TABLE IF NOT EXISTS ProductSales (
			ProductID INT(4) UNSIGNED NOT NULL,
			SalesID INT(5) UNSIGNED NOT NULL,
			Qauntity INT(3) UNSIGNED NOT NULL,
			PRIMARY KEY (ProductID, SalesID),
			FOREIGN KEY (ProductID) REFERENCES Product (ProductID),
			FOREIGN KEY (SalesID) REFERENCES Sales (SalesID)
		);
		`))

		//

		// // inserting User records
		// insertArray.push(await db.query(`
		// 	INSERT INTO Users (UserID, Name, DOB, Email, MobileNo) VALUES
		// 		('abcde', 'Test Data', '09/08/1997', 'testdatauser@gmail.com', '0418971231');
		// `))

		// insertArray.push(await db.query(`
		// 	INSERT INTO Users (UserID, Name, Email) VALUES
		// 		('lmnop', 'Test Data1', 'testdatauser1@gmail.com');
		// `))


		// // perform a select request on the database using the uid property from the userData gathered earlier
		// // selectConfirmation should be an array of all values that matched the condition
		// let selectConfirmation = await db.query(`SELECT * FROM User WHERE uID = '${userData.uid}';`)

		// // if there were no results to the select statement...
		// if (selectConfirmation.length == 0) {
		// 	// perform an insert query on the database
		// 	// details about the success of the insert will be stored in insertConfirmation
		// 	let insertConfirmation = await db.query(`
			// INSERT INTO Product (ProductID, Name, QuantityOnHand, UnitPrice) VALUES
			// 	(0001, 'Shampoo', 5, 25),
			// 	(0002, 'Soap', 10, 5);

		// 	INSERT INTO Permission (PermissionID, PermissionName) VALUES
		// 		(101, 'Read-Only'),
		// 		(102, 'Update');

		// 	INSERT INTO Role (RoleID, RoleName) VALUES
		// 		(111, 'Member'),
		// 		(112, 'Management');

		// 	INSERT INTO RolePermission (RolePermissionID, Name, RoleID, PermissionID) VALUES
		// 		(1001, 'MemberPermission', 111, 101),
		// 		(1002, 'ManagementPermission', 112, 102);

		// 	INSERT INTO Users (UserID, Name, DOB, Email, MobileNo) VALUES
		// 		('abcde', 'Test Data', '09/08/1997', 'testdatauser@gmail.com', '0418971231');

		// 	INSERT INTO Requests (ProductID, UserID, QuantityNeeded) VALUES
		// 		(0001, 'abcdefg123', 10),
		// 		(0002, 'lmnopqw123', 20);

		// 	INSERT INTO Sales (SalesID, UserID, TotalPrice) VALUES
		// 		(1000001, 'abcdefg123', 50),
		// 		(1000002, 'lmnopqw123', 60);

		// 	INSERT INTO ProductSales (ProductID, SalesID, Quantity) VALUES
		// 		(0001, 1000001, 2),
		// 		(0002, 1000002, 12);

		// 	`)
		// }

		res.json(resultsArray);
	} catch (error) {
		// if anything went wrong at any step of the way then send the error data back to the client instead
		res.json(error);
	}
});





// -----------------------RESPOND TO 404 ERRORS----------------------

app.use((req,res)=>{
	res.send(`<h1>it's the 404</h1>`)
});




// -----------------------RESPOND TO 404 ERRORS----------------------

app.use((req,res)=>{
	res.send(`<h1>it's the 404</h1>`)
});
