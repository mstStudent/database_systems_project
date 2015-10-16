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
‘8/9/09'

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
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color=‘red'
EXCEPT
SELECT S2.sid
FROM Sailors AS S2, Reserves AS R2, Boats AS B2
WHERE S2.sid=R2.sid AND R2.bid=B2.bid AND B.2color=‘green'

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ( SELECT R.sid
 FROM Reserve AS R
 WHERE R.bid = 103)

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ((SELECT R.sid
 FROM Reserve AS R, Boats AS B
 WHERE R.bid = B.bid AND B.color = ‘red')
 INTERSECT
 (SELECT R2.sid
 FROM Reserve AS R2, Boats AS B2
 WHERE R2.bid = B2.bid AND B2.color = ‘green'))

SELECT S.sname
FROM Sailors AS S
WHERE S.age > (SELECT MAX (S2.age)
 FROM Sailors S2
 WHERE R.sid = S2.rating = 10)

SELECT B.bid, Count (*) AS reservationcount
FROM Boats B, Reserves R
WHERE R.bid=B.bid AND B.color = ‘red'
GROUP BY B.bid

SELECT B.bid, Count (*) AS reservationcount
FROM Boats B, Reserves R
WHERE R.bid=B.bid AND B.color = ‘red'
GROUP BY B.bid
HAVING B.color = ‘red'

SELECT Sname
FROM Sailors
WHERE Sailor.sid IN (SELECT Reserves.bid, Reserves.sid
 FROM Reserves
 CONTAINS
 (SLECT Boats.bid
 FROM Boats
 WHERE Boats.name = ‘interlake') )


SELECT S.rating, Ave (S.age) As average
FROM Sailors S
WHERE S.age > 18
GROUP BY S.rating
HAVING Count (*) > 1 




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

var convertToRelationalAlgebra = function (sqlJson, where) {
    switch (sqlJson.nodeType) {
        case 'Main':
            var message = {};
            $.each(sqlJson.value, function(index, query){
               message[index] = convertToRelationalAlgebra(query)
            })
            return message;
            break;
        case 'Select':
            var relat = {
            	'project':{ 'symbol': '&Pi;', conditions: []},
            	'select': { 'symbol': '&sigma;', conditions: null},
            	'from':   { 'symbol': 'X', conditions: []}
            };
            $.each(sqlJson.columns, function (index, column) {
                relat['project'].conditions[index] = convertToRelationalAlgebra(column);
            });
            $.each(sqlJson.from, function (index, fromStatement) {
              relat['from'].conditions[index] = convertToRelationalAlgebra(fromStatement);
            });
            relat.select.conditions = convertToRelationalAlgebra(sqlJson.where,1);
            return relat;
            break;
        case 'Column':
            return convertToRelationalAlgebra(sqlJson.value);
            break;
        case 'AndCondition':
            if(where == 1){
              var elem = {
                operator: 'and',
                symbol: '&Lambda;',
                conditions: []
              };
              $.each(sqlJson.value, function(index, obj){
                elem.conditions.push(convertToRelationalAlgebra(obj))
              })
              return elem;
            }else{
             return convertToRelationalAlgebra(sqlJson.value[0])
            }
            break;
        case 'OrCondition':
            var elem = {
                operator: 'or',
                symbol: 'V',
                left: null,
                right: null
              };
              elem.left = convertToRelationalAlgebra(sqlJson.left, 1);
              elem.right = convertToRelationalAlgebra(sqlJson.right[0], 1);
            return elem;
            break;
        case 'Condition':
            return convertToRelationalAlgebra(sqlJson.value);
            break;
        case 'Term':
            return {selCondition: sqlJson.value}
            break;
        case 'TableExpr':
            var expression = {
                'alias': null,
                'aliasSymbol': '&rho;',
                'tableName': null
            }
            if(sqlJson.value[0].alias != null)
                 expression.alias = sqlJson.value[0].alias.value;
            expression.tableName = sqlJson.value[0].exprName;
            return expression;
            break;
        case 'BinaryCondition':
            var expression = {
            left: null,
            operator: null,
            right: null
            };
            expression.left = convertToRelationalAlgebra(sqlJson.left);
            expression.operator = sqlJson.right.op;
            expression.right =convertToRelationalAlgebra(sqlJson.right.value);
            
            /*console.log('expression: ', expression);*/
            return expression;
        default:
            console.log("Forgot: ", sqlJson);
    }

}



var checkWithParser = function (sql) {
    var sqlJson = parser.parse(sql);
    console.log('start: ' , sqlJson)
    var relationJson = convertToRelationalAlgebra(sqlJson);
    return relationJson;
}

/* The main validator for all queries, the main reason is that sqliteParser doesn't reconize intersect but sqlparser does */
var checkWithSqlParser = function (query) {

return {
            action: 'parsed',
            message: 'Command Yays!',
            type: 'table',
            results: checkWithParser(query)
        }
    try {
        return {
            action: 'parsed',
            message: 'Command Yays!',
            type: 'table',
            results: checkWithParser(query)
        }
    } catch (error) {
	console.log("Error: " , error);
        return {
            action: 'error',
            type: 'Syntax Issue',
            message: "There is a syntax issue"
        };
        
    }
}

/*

BELOW IS THE PORTION OF CODE FOR HANDLING SEVERAL QUERIES AT ONCE AND THE TABLE / VIEW MANIPULATION
	It's only a future feature so it's not the main focus now.

var checkWithSqliteParser = function(query){
    var sqlToJson = null;
    try{
      sqlToJson = checkWithSqlParser(query);
    }
    catch(error){
       console.log(error);
    }
    return sqlToJson;

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

}*/

var goThroughSelect = function(select){
    var message = '';
    switch (select.operator){
      case 'and':
          $.each(select.conditions, function(index, condition){
              message = message + goThroughSelect(condition);
              if(index + 1 != select.conditions.length){
                 message = message + ' ' + select.symbol + ' ';
              }
          });
          break;
      case 'or':
          message = message + goThroughSelect(select.left);
          message = message + ' ' + select.symbol + ' ';
          message = message + goThroughSelect(select.right);
          break;
      case '=':
      case '>':
      case '<':
      case '!=':
          message = message + goThroughSelect(select.left);
          message = message + select.operator;
          message = message + goThroughSelect(select.right);
          break;
      default:
          if(select.selCondition != null){
            return select.selCondition;
          }
          console.log("Forgot this ( where ) : " , select);
    }

    return message;
}

var createMessage = function(relation){
    var pro = relation.project;
    var from = relation.from;
    var sel = relation.select;
    
    var proSection = pro.symbol + '<sub> ';
    $.each(pro.conditions, function(index, attr){
        proSection = proSection + attr.selCondition;
        if( index + 1 != pro.conditions.length )
           proSection = proSection + ', ';
    })
    proSection = proSection + '</sub> '
    
    var fromSection = '(';
    
    $.each(from.conditions, function(index, rel){
       if(rel.alias != null){
         fromSection = fromSection + rel.aliasSymbol + '<sub>' + rel.alias + '</sub>' + '(' + rel.tableName + ') ';
       }else{
         fromSection = fromSection + rel.tableName + ' ';
       }
       if( index + 1 != from.conditions.length)
         fromSection = fromSection + from.symbol + ' '; 
    })
 
    fromSection = fromSection + ')' 
 
    var selSection = sel.symbol + '<sub> ';
    selSection = selSection + goThroughSelect(sel.conditions);
    selSection = selSection + '</sub> ';
    return proSection + selSection + fromSection;

}

var startParse = function(){ 
    var query = $("#sqlText").val();
    
    // Remove the last ; from the sql statement, if the user enters several commands and separates them with a ; then we'll handle it shortly.
    if(query.slice(-1) == ';'){
    	query = query.slice(0,-1)
    }
    action = checkWithSqlParser(query);
    console.log("Before Switch Case: " , action);
    switch (action.action){
        case 'error':
            $("#sqlResults").text(action.message);
            break;
        case 'parsed':
            var htmlMessage = '';
            $.each(action.results, function(index, result){
                htmlMessage = htmlMessage + createMessage(result)
            })
            $("#sqlResults").html(htmlMessage);
            break;
        default:
            console.log('Bad things happened', action);
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

/* init */

update(0);
update(1);

