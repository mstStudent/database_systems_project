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
    if (typeof (possibleRenamedItems) == 'string') {
        $.each(relations, function (index, nameCheck) {
            $.each(nameCheck.columns, function (index, attri) {
                if (attri.name == nameToCheck)
                    found = { found: true, realTableName: nameCheck.relationName };
            })
        })
    } else {
        $.each(possibleRenamedItems, function (index, nameCheck) {
            if (nameCheck.rename.to == nameToCheck)
                found = { found: true, realTableName: nameCheck.relationName };
        })
    }
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

    var useThis= null;
    if (quickCount == 1) {
     if(sqlJson.value!=null){
       useThis = sqlJson.value[0]
     }else{
       useThis = sqlJson
     }
        if (useThis.groupBy == null && useThis.having == null) {
            result.type = 'simple'
            result.relationJson = simpleConvert(sqlJson);
        } else {
            result.type = 'havingGroup'
            result.relationJson = sortGroupExpression(sqlJson);
        }

    } else if (sqlJson.value.length > 1) {
 
        var transFirst = startParsingJSON(sqlJson.value[0]);
        var op = sqlJson.value[1];
        var transSecond = startParsingJSON(sqlJson.value[2]);
        result = {
            first: transFirst,
            op: op,
            second: transSecond,
            type: 'complex'
        }
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
            type: 'error',
            message: test
    };
    return relationJson;
    }
    try {
        return  startParsingJSON(sqlJson);
    } catch (error) {
        return {
            type: 'error',
            message: error
        };
        
    }
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
            createSimpleTree(action.relationJson[0]);
            break;
        case 'nested':
            var firstPart = printNestedQuery(action.relationJson);
            var secondPart = printSimpleQuery(action.relationJson.right.relationJson)
            //console.log(secondPart)
            $('#sqlResults').html(firstPart + ' ' + secondPart);
            break;
        case 'complex':
            $('#sqlResults').html(printComplexQuery(action))
            break;
        case 'havingGroup':
            $('#sqlResults').html(printGroupQuery(action.relationJson))
            break;
        case 'error':
            $('#sqlResults').html(action.message)
            break;
        default:
            console.log("forgot (end): ", action)
    }

}
