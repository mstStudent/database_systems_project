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
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color=’red’

SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color=’red’
UNION
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color=’green’

SELECT S.sname
FROM Sailors AS S, Reserves AS R
WHERE R.sid = S.sid AND R.bid = 100 AND S.rating > 5 AND R.day = ‘8/9/09’

SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color=’red’
INTERSECT
SELECT sname
FROM Sailors, Boats, Reserves
WHERE Sailors.sid=Reserves.sid AND Reserves.bid=Boats.bid AND Boats.color=’green’

SELECT S.sid
FROM Sailors AS S, Reserves AS R, Boats AS B
WHERE S.sid=R.sid AND R.bid=B.bid AND B.color=‘red’
EXCEPT
SELECT S2.sid
FROM Sailors AS S2, Reserves AS R2, Boats AS B2
WHERE S2.sid=R2.sid AND R2.bid=B2.bid AND B.2color=‘green’

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ( SELECT R.sid
                 FROM Reserve AS R
                 WHERE R.bid = 103)

SELECT S.sname
FROM Sailors AS S
WHERE S.sid IN ((SELECT R.sid
		FROM Reserve AS R, Boats AS B
		WHERE R.bid = B.bid AND B.color = ‘red’)
		INTERSECT
		(SELECT R2.sid
		FROM Reserve AS R2, Boats AS B2
		WHERE R2.bid = B2.bid AND B2.color = ‘green’))

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

SELECT CustomerName,City FROM Customers;
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

// ONLY FOR LEFT & RIGHT LIST or ( Relations and Views List )
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

var startParse = function(){ 
    var re = parseSQL($("#sqlText").val());
    $.each(re.statement, function(index, statement){
	console.log("ble: ", statement);
	switch(statement.variant){
		case 'create':
			if(statement.format == 'table'){
				handleCreateTable(statement);
				update(0);
			}
			else{
				handleCreateView(statement);
				update(1);
			}
			break;
		case 'select':
			handleSelect(statement);
		default:
			console.log(statement.variant);
	};
    }) 
    
    //console.log(re);
    //$("#sqlResults").val(JSON.stringify(re));
}

var parseSQL = function (string){
   re = null;
   sqliteParser(string, function(error, results){
      if(error){
      	re = error;
      	$("#sqlResults").val(JSON.stringify(re));
      }
      else{
       re = results;
      }
    });
   return re;
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
//  $("#sqlResults").val(JSON.stringify(re));
var handleSelect = function(statement){
	var select = statement.result;
	var from = statement.from;
	var where = statement.where;
	
	var project = '&Pi; ';
	var sel = '&sigma;';
	var overall = '';
	
	
	$.each(select, function(index, item){
		project = project + item.name.sub();
	});
	
	$.each(where, function(index, item){
	   $.each(item.left, function(index, leftside){
	   
	   }
	   sel = sel + ' AND '
	   $.each(item.right, function(index, leftside){
	   
	   }
	}
	
	
	$("#sqlResults").html(where);
	
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

