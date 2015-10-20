/*

Schemas of the underlying relations;
a. Sailors(sid:integer, sname:string, rating:integer, age:real)
b. Boats(bid:integer, bname:string, color:string)
c. Reserves(sid:integer, bid:integer, day:date)

SELECT S.sname
FROM Sailors AS S, Reserves AS R
WHERE S.sid=R.sid AND R.bid=103

SELECT S.sname
FROM Sailors AS S, Reserves AS R, Boats AS B
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color='red'

SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color='red'
UNION
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color='green'

SELECT S.sname
FROM Sailors AS S, Reserves AS R
WHERE R.sid = S.sid AND R.bid = 100 AND S.rating > 5 AND R.day = '8/9/09'

SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color='red'
INTERSECT
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color='green'

SELECT S.sid
FROM Sailors AS S, Reserves AS R, Boats AS B
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color='red'
EXCEPT
SELECT S2.sid
FROM Sailors AS S2, Reserves AS R2, Boats AS B2
WHERE S2.sid=R2.sid AND R2.bid=B2.bid AND B.2color='green'

SELECT S.sid
FROM Sailors AS S, Reserves AS R, Boats AS B
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color='red'
EXCEPT
SELECT S2.sid
FROM Sailors AS S2, Reserves AS R2, Boats AS B2
WHERE S2.sid=R2.sid AND R2.bid=B2.bid AND B2.color='green'

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ( SELECT R.sid
                 FROM Reserve AS R
                 WHERE R.bid = 103)

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ((SELECT R.sid
		FROM Reserve AS R, Boats AS B
		WHERE R.bid = B.bid AND B.color = 'red')
		INTERSECT
		(SELECT R2.sid
		FROM Reserve AS R2, Boats AS B2
		WHERE R2.bid = B2.bid AND B2.color = 'green'))


CREATE TABLE Persons
(
PersonID int,
LastName varchar(255),
FirstName varchar(255),
Address varchar(255),
City varchar(255)
);

SELECT CustomerName,City 
FROM Customers;

SELECT * FROM Customers;

UPDATE Customers
SET ContactName='Alfred Schmidt', City='Hamburg'
WHERE CustomerName='Alfreds Futterkiste';

CREATE VIEW [Current Product List] AS
SELECT ProductID,ProductName
FROM Products
WHERE Discontinued='No'


SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND
Boats.color='red'
UNION
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND
Boats.color='green'

SELECT S.sname
FROM Sailors AS S, Reserves AS R
WHERE R.sid = S.sid AND R.bid = 100 AND R.rating > 5 AND R.day =
'8/9/09'

SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND
Boats.color='red'
INTERSECT
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND
Boats.color='green'

SELECT S.sid
FROM Sailors AS S, Reserves AS R, Boats AS B
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color='red'
EXCEPT
SELECT S2.sid
FROM Sailors AS S2, Reserves AS R2, Boats AS B2
WHERE S2.sid=R2.sid AND R2.bid=B2.bid AND B.2color='green'

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ( SELECT R.sid
 FROM Reserve AS R
 WHERE R.bid = 103)

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ((SELECT R.sid
 FROM Reserve AS R, Boats AS B
 WHERE R.bid = B.bid AND B.color = 'red')
 INTERSECT
 (SELECT R2.sid
 FROM Reserve AS R2, Boats AS B2
 WHERE R2.bid = B2.bid AND B2.color = 'green'))

SELECT S.sname
FROM Sailors AS S
WHERE S.age > (SELECT MAX (S2.age)
 FROM Sailors S2
 WHERE R.sid = S2.rating = 10)

SELECT B.bid, Count (*) AS reservationcount
FROM Boats B, Reserves R
WHERE R.bid=B.bid AND B.color = 'red'
GROUP BY B.bid

SELECT B.bid, Count (*) AS reservationcount
FROM Boats B, Reserves R
WHERE R.bid=B.bid AND B.color = 'red'
GROUP BY B.bid
HAVING B.color = 'red'

SELECT Sname
FROM Sailors
WHERE Sailor.sid IN (SELECT Reserves.bid, Reserves.sid
 FROM Reserves
 CONTAINS
 (SLECT Boats.bid
 FROM Boats
 WHERE Boats.name = 'interlake') )


SELECT S.rating, Ave (S.age) As average
FROM Sailors S
WHERE S.age > 18
GROUP BY S.rating
HAVING Count (*) > 1 


'project':{ 'symbol': '&Pi;', conditions: []},
'select': { 'symbol': '&sigma;', conditions: null},
'from':   { 'symbol': 'X', conditions: []}

*/

var relations = [
			{
				table: "Sailors",
				columns: [
                    {
				    name: 'sid',
				    type: 'integer'
    			    }, 
                    { 
                        name: 'sname',
                        type: 'string'
                    }, 
                    { 
                        name: 'rating',
                        type: 'integer'
                    }, 
                    { 
                        name: 'age',
                        type: 'real'
                    }
				]
			},
            {
                table: "Boats",
                columns: [
                    {
                        name: 'bid',
                        type: 'integer'
                    }, 
                    { 
                        name: 'bname',
                        type: 'string'
                    }, 
                    { 
                        name: 'color',
                        type: 'string'
                    }
                ]
            },
            {
                table: "Reserves",
                columns: [
                    {
                        name: 'sid',
                        type: 'integer'
                    }, 
                    { 
                        name: 'bid',
                        type: 'integer'
                    }, 
                    { 
                        name: 'day',
                        type: 'date'
                    }
                ]
            }
		    ];
		    
var views = [];

var checkTables = function (table) {
}

var checkTablesAttributes = function (table, attriCheck) {
}

var checkIfAttriExistsWithoutRenamedTable = function (attribute, relationList) {
}

var checkIfRenamed = function (possibleRenamedItems, nameToCheck) {
}

var parseSQL = function (string) {
    re = null;
    sqliteParser(string, function (error, results) {
        if (error) {
            re = error;
            $("#sqlResults").html(JSON.stringify(re));
        }
        else {
            re = results;
        }
    });
    return re;
}


var parseQuery = function (query) {
    parseSQL(query);
}

var startParse = function(){ 
    var query = $("#sqlText").val();
    // remove whitespace before and after input
    query = query.trim();
    parseQuery(query);
}