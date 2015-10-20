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

/// sqlite can't do this

SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color='red'
INTERSECT
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color='green'

/// WRONG!

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
    var found = {found: false, realTableName: null};
    $.each(possibleRenamedItems, function (index, nameCheck) {
        if(nameCheck.rename.to == nameToCheck)
            found = { found: true, realTableName: nameCheck.relationName };
    })
    return found
}

var parseSelect = function (statement, possibleRenamedItems) {
    var projectTempList = statement.slice(7).split(',');

    // Basic syntax check
    $.each(projectTempList, function (index, attribute) {
        if (attribute.indexOf('.') > -1) {
            var renamedItemCheck = attribute.trim().split('.');
            var renameCheck = checkIfRenamed(possibleRenamedItems, renamedItemCheck[0]);
            if (renameCheck.found == false) {
                if (checkTables(renamedItemCheck[0]) == false) {
                    throw 'Can\'t find relation ' + renamedItemCheck[0];
                }
            }else{
             console.log("Found: ", renamedItemCheck);
             if (checkTablesAttributes(renameCheck.realTableName, renamedItemCheck[1]) == false) {
                 throw 'Can\'t find attribute ' + renamedItemCheck[1] + ' in ' + renameCheck.realTableName;
             }
            }
        } else {
            console.log("does not have a .")
            if (checkIfAttriExistsWithoutRenamedTable(attribute, possibleRenamedItems) == false) {
                throw 'Can\'t find attribute ' + attribute;
            }
        }
    })
/*
    console.log('projectTempList: ', projectTempList)
    console.log('project: ', statement)
    console.log('possibleRenamedItems: ', possibleRenamedItems)
*/
    var project = {
        conditions: projectTempList,
        symbol: '&Pi;'
    }
    return project;
}

var parseFrom = function(statement){
    var relationTempList = statement.slice(5).split(',');
    var relationArray = [];
    $.each(relationTempList, function (index, relationString) {
        var relation = {
            rename: {
                rename: false,
                to: null
            },
            relationName: null
        }
        var splitUp = relationString.trim().split(' ');
        if (checkTables(splitUp[0]) == false)
            throw 'Error relation ' + relationCheck.relationName + ' does not exist!'
        relation.relationName = splitUp[0];
        if(splitUp.length > 1){
            relation.rename.rename = true;
            relation.rename.to = splitUp[splitUp.length - 1];
        }
        relationArray.push(relation)
    })
    /*
    console.log('relationTempList: ', relationTempList);
    console.log('relationList: ', relationArray);
    */
    return relationArray
    
}

var parseWhere = function (statement) {
    whereStatement = statement.slice(6).split(' ');
    
    console.log('Got (where) : ', statement);
    console.log('Sliced result: ', whereStatement);

    simpleOperators = ['=', '>', '<', '!=', '<>']
    $.each(whereStatement, function (super_index, section) {
        $.each(simpleOperators, function (index, oper) {
            if (section.indexOf(oper) > -1) {
                var splitUp = section.split(oper);
                whereStatement[super_index] = {
                    left: splitUp[0],
                    op: oper,
                    right: splitUp[1]
                }
            }
        })
    })

}

var parseQuery = function (query) {
    var selectSection = query.slice(0, query.toLowerCase().indexOf('from'));
    var fromSection = query.slice(selectSection.length, query.toLowerCase().indexOf('where'));
    var whereSection = query.slice(selectSection.length + fromSection.length);

    selectSection = selectSection.trim();
    fromSection = fromSection.trim();
    whereSection = whereSection.trim();


    console.log("start: ", query);
    console.log("select: ", selectSection);
    console.log("from: ", fromSection);
    console.log('where: ', whereSection);

    //try {
        // To help me track where I got the relations from I'm just labeling the variables after the part of the query they came from
        var from = parseFrom(fromSection);
        var select = parseSelect(selectSection, from);
        var where = parseWhere(whereSection);
        console.log(select)
        console.log(from)
        return {
            'select': select,
            'from': from,
            'where': where
        }
    //} catch (error) {
     //   $("#sqlResults").html(error);
    //}
}

var startParse = function(){ 
    var query = $("#sqlText").val();
    // remove whitespace before and after input
    query = query.trim();
    parseQuery(query);
}