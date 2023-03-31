// Write SQL scripts to extract member, product details from the database

SELECT * FROM Users;
SELECT * FROM Products;
SELECT * FROM Sales;

// Write SQL scripts to insert into sales table
INSERT INTO Sales (SalesID, UserID, TotalPrice) VALUES ('${sales.salesid}', '${sales.uid}', '${sales.TotalPrice}');


