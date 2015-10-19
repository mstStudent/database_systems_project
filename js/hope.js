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

var relationalAlgebra = null;


var checkTables = function (table) {
    var exists = false;
    $.each(relations, function (index, relation) {
        if (table == relation.table) {
            exists = true
        }
    });
    return exists;
}

var checkTablesAttributes = function (table, attriCheck) {
    var exists = false;
    $.each(relations, function (index, relation) {
        if (table == relation.table) {
            $.each(relation.columns, function (index, attr) {
                if (attriCheck == attr.name)
                    exists = true;
            })
        }
    });
    return exists;
}

var checkIfAttriExistsWithoutRenamedTable = function (attribute, relationList) {
    if (attribute == '*')
        return true
    found = false;
    $.each(relationList, function (index, relation) {
        if (checkTablesAttributes(relation, attribute) == true) {
            found = true;
        }
    });
    return found;
}

var checkIfRenamed = function (possibleRenamedItems, nameToCheck) {
    var found = { found: false, realTableName: null };
    $.each(possibleRenamedItems, function (index, nameCheck) {
        if (nameCheck.rename.to == nameToCheck)
            found = { found: true, realTableName: nameCheck.relationName };
    })
    return found
}

// It's assumed that there is at least 1 valid select statement
var numSelects = 0;

var countSelects = function (sql) {
    if (sql.nodeType != undefined) {
        if (sql.nodeType == 'Select') {
            numSelects = numSelects + 1;
            countSelects(sql.where);
        }
        else if (sql.nodeType == 'BinaryCondition' || sql.nodeType == 'OrCondition') {
            countSelects(sql.left);
            countSelects(sql.right);
        }
        else if (sql.nodeType == 'Term' || sql.nodeType == 'SetOperator')
            if (typeof (sql.value) == 'object')
                countSelects(sql.value)
            else
              return
        else
            countSelects(sql.value);
    } else {
       $.each(sql, function (index, check) {
           countSelects(check)
       })        
    }
}

var startParsingJSON = function (sqlJson) {
    countSelects(sqlJson);

    var quickCount = numSelects;
    numSelects = 0;

    console.log("quickCount: ", quickCount);

    var result = {
        type: null,
        relationJson: null
    }

    if (quickCount == 1) {
        if (sqlJson.groupBy == null && sqlJson.having == null) {
            result.type = 'simple'
            result.relationJson = simpleConvert(sqlJson);
        } else {
            console.log('Write simple select with group by and/or having')
        }

    } else if (sqlJson.value.length > 1) {
        console.log('Add union, intersect, ect. code')
    } else {
        result.type = 'nested'
        var preRec = getSelAndProj(sqlJson.value[0].columns, sqlJson.value[0].from);
        var inner = getSubQueries(sqlJson.value[0].where);
        inner['rightParsed'] = null;
  //      console.log("preRec: ", preRec)
  //      console.log('inner: ', inner)
        inner.rightParsed = startParsingJSON(inner.right)
        //console.log('inner: ', inner)
        var update = sortExpression(preRec, inner);
        console.log('update', update)
        result.relationJson = {
            left: preRec,
            right: update
        }
    }

    return result;

}

var checkWithParser = function (sql) {
    var relationJson = null;
    try{
        var sqlJson = parser.parse(sql);
        console.log('start: ' , sqlJson)
    }catch(error){
    errorString = String(error);
    
    console.log("ERROR! :"  , error );
    errorString = errorString.slice(errorString.indexOf('...') + 4);
    dashes = errorString.indexOf('-');
    carror = errorString.indexOf('^') - 5;
    tim = carror - dashes + 1
    er = errorString.slice(0,dashes) + '<br></br>' + '-----' + errorString.slice(dashes)
    test = errorString.slice(0,tim) + '<span style = "color:red">' + errorString.slice(tim,tim+1) + '</span>' + errorString.slice(tim+1,dashes-1);
    test = test + '<br></br> The start of the problem is highlighted in red.'
    
    relationJson =  {
            action: 'error',
            type: 'Syntax Issue',
            message: test
        };
    }

    return startParsingJSON(sqlJson);
}



var startParse = function(){ 
    var query = $("#sqlText").val();
    
    // Remove the last ; from the sql statement, if the user enters several commands and separates them with a ; then we'll handle it shortly.
    if(query.slice(-1) == ';'){
        query = query.slice(0,-1)
    }

    action = checkWithParser(query);
    console.log("Before Switch Case: ", action);
    switch (action.type) {
        case 'simple':
            $('#sqlResults').html(printSimpleQuery(action.relationJson[0]));
            break;
        case 'nested':
            $('#sqlResults').html(printNestedQuery(action.relationJson));
            break;
        default:
            console.log("forgot (end): ", action)
    }
    

}