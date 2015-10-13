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

*/

/*
Schemas of the underlying relations;
	a. Sailors(sid:integer, sname:string, rating:integer, age:real)
	b. Boats(bid:integer, bname:string, color:string)
	c. Reserves(sid:integer, bid:integer, day:date)







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

*/

var relations = [
			{
				table: "Sailors",
				columns: ['sid:integer', 'sname:string', 'rating:integer', 'age:real']
			},
			{
				table: "Boats",
				columns: ['bid:integer', 'bname:string', 'color:string']
			},
			{
				table: "Reserves",
				columns: ['sid:integer', 'bid:integer', 'day:date']
			}
		    ];
		    
var views = [];

var relationalAlgebra = null;

/*   Help make there errors more friendly for printing    */
var parseSQL = function (string) {
    re = null;
    sqliteParser(string, function (error, results) {
        if (error) {
            re = error;
            $("#sqlResults").val(JSON.stringify(re));
        }
        else {
            re = results;
        }
    });
    return re;
}


// ONLY FOR LEFT & RIGHT LIST ( Relations and Views List )
var putInHTMLList = function(relation){
	var dt = $('<dt/>')
		.text(relation.table);
	$.each(relation.columns, function(index, column){
		var dd = $('<dd/>').text(column);
		dt.append(dd);
	});
	return dt
}	

var update = function(side){
	var htmlToUpdate = side == 0 ? $('#relationsList') : $('#viewsList');
	var whichArray = side == 0 ? relations : views;
	htmlResult = '';
	$.each(whichArray, function(index, elementOArray) { 	
		tempItem = putInHTMLList(elementOArray);
		htmlResult == '' ? htmlResult = tempItem : htmlResult.append(tempItem);
	});
	htmlToUpdate.html(htmlResult);
}

var purgeViews = function(){
    console.log("Views Gone");
    views = [];
    update(1);
    //updateRight();
}

var purgeRelations = function(){
    console.log("Relations Gone");
    purgeViews();
    relations = [];
    update(0);
    //updateLeft();
}

var convertToRelationalAlgebra = function (sqlJson) {
    console.log(sqlJson);
    switch (sqlJson.nodeType) {
        case 'Main':
            return convertToRelationalAlgebra(sqlJson.value[0])
            break;
        case 'Select':
            var columns = {};
            $.each(sqlJson.columns, function (index, column) {
                columns[index] = convertToRelationalAlgebra(column)
            })
            return columns;
            break;
        case 'Column':
            return convertToRelationalAlgebra(sqlJson.value);
            break;
        case 'AndCondition':
            return convertToRelationalAlgebra(sqlJson.value[0]);
            break;
        case 'Condition':
            return convertToRelationalAlgebra(sqlJson.value[0]);
            break;
        case 'Term':
            return {selCondition: sqlJsonvalue}
            break;
        default:
            console.log("Forgot: ", sqlJson);
    }

}


var checkWithParser = function (sql) {
    var sqlJson = parser.parse(sql);
    var relationJson = convertToRelationalAlgebra(sqlJson);
    return relationJson;
}

/* The main validator for all queries, the main reason is that sqliteParser doesn't reconize intersect but sqlparser does */
var checkWithSqlParser = function (query) {
    try {
        return {
            action: 'parsed',
            message: 'Command Yays!',
            type: 'table',
            results: checkWithParser(query)
        }
    } catch (error) {
        return {
            action: 'error',
            type: 'Syntax Issue',
            message: "There is a syntax issue."
        };
    }
}


/*  The first sql validator and the vaildator that allows to handle relations and views */
var checkWithSqliteParser = function(query){
    var checkSQL = parseSQL(query);

    // There are two possible reasons for the SyntaxError either it's really an error or intersect is in the query somewhere.
    if (checkSQL.name == 'SyntaxError') {
        if (query.toLowerCase().indexOf("intersect") >= 0) {
            // the word intersect was found...we'll need to have the other validater check it
            return checkWithSqlParser(query);
        } else {
            return {
                action: 'error',
                type: 'Syntax Issue',
                parseSQLResults: checkSQL,
                message: "Please check SQL command, one possible issue is you have intersect included."
            };
        }
    }
    else if (checkSQL.statement.length > 1) {
        // Everything is valid BUT there are several queries.
        return {
            action: 'error',
            type: 'tooMany',
            message: "Please enter only one query/command at a time."
        }
        //$("#sqlResults").html('<h3>Sorry, but please enter only one query/command at a time.</h3>')
        return;
    }
    else {
        queryCheck = checkSQL.statement[0];
        // Check if we are dealing with a query or command
        if (queryCheck.variant != 'select') {
            // parseSQL can correctly parse all non-select commands, unless there is an intersect found
            if (queryCheck.format == 'table') {
                handleCreateTable(queryCheck);
                update(0);
                return {
                    action: 'parsed',
                    message: 'Command executed',
                    type: 'table'
                }
            }
            else {
                handleCreateView(queryCheck);
                update(1);
                return {
                    action: 'parsed',
                    message: 'Command executed',
                    type: 'view'
                }
            }
        }
        else {
            // parseSQL can't handle intersect so we need to have another validater to check.
            return checkWithSqlParser(query);
        }
    }
}

var startParse = function(){ 
    var query = $("#sqlText").val();
    
    // Remove the last ; from the sql statement, if the user enters several commands and separates them with a ; then we'll handle it shortly.
    if(query.slice(-1) == ';'){
    	query = query.slice(0,-1)
    }
    action = checkWithSqliteParser(query);

    switch (action.action){
        case 'error':
            $("#sqlResults").text(action.message);
            break;
        case 'parsed':
            $("#sqlResults").text(action.message);
            break;
        default:
            console.log(action);
        }

}

var handleCreateTable = function (statement) {
	template = {table: statement.name.name, columns: []};
	$.each(statement.definition, function(index, attriDef){
		var column = null;
		switch(attriDef.variant){
			case 'column':
				if(attriDef.datatype.affinity == 'text'){
					column = attriDef.name+':string';
				}
				else{
					column = attriDef.name;
				}
				break;
			default:
				console.log('def : ', attriDef);
		}
		if(column != null){
			template.columns.push(column);
		}
		
		
	})
	relations.push(template);
}

var handleCreateView = function (statement) {
	template = {
		table: statement.target.name,
		columns: [],
		sql: statement.result};
	$.each(statement.result.result, function(index, attriDef){
		var column = null;
		switch(attriDef.variant){
			case 'column':
				column = attriDef.name;
				break;
			default:
				console.log('def : ', attriDef);
		}
		if(column != null){
			template.columns.push(column);
		}
		
		
	})
	views.push(template);

}

var parseLeft = function(left){
	console.log("Left: ", left);
}

var parseRight = function(right){
	console.log("Right: ", right);
}


var parseSelect = function(select){
	curProject = {action: 'project', symbol: '&Pi;'};

	$.each(select, function(index, item){
		project["column "+index] = item.name.sub();
	});
	
	return project;

}

var parseFrom = function(from){
	var relationSelect = {action: 'select', symbol: '&sigma;'};
}


var handleQuery = function(statement){
	var select = parseSelect(statement.result);
	var from = parseFrom(statement.from);
	var where = statement.where;
	
	var sel = '&sigma;';
	var overall = '';
/*
	$.each(where, function(index, item){
	   $.each(item.left, function(index, leftside){
	   	parseLeft(leftside)
	   })
	   sel = sel + ' AND '
	   $.each(item.right, function(index, rightside){
	   	parseRight(rightside);
	   })
	})
	
	*/
	
	$.each(select, function(index, item){
		index=='action'? null: overall += item;
	});
	$("#sqlResults").html(overall);
	
	console.log(statement);
}

/*
SELECT S.sname
FROM Sailors AS S, Reserves AS R
WHERE S.sid=R.sid AND R.bid=103

*/






/* init */

update(0);
update(1);

