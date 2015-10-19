var getSubQueries = function (whereSql) {
    var leftSide = {
        extraConditionsBeforeSubQuery: [],
        attriForSub: null
        };
    $.each(whereSql.value, function (index, condition) {
        if(condition.nodeType == 'BinaryCondition') {
            leftSide.attriForSub = whereSql.value[0].left
        }else
                leftSide.extraConditionsBeforeSubQuery.push(condition)
    })

    var operator = {
        state: whereSql.value[0].right.nodeType,
        op: whereSql.value[0].right.op
    }

    var parseThis = whereSql.value[0].right.value

    return {
        left: leftSide,
        action : operator,
        right: parseThis
    }
}

var getFromJSON = function (from) {
    console.log('got grom: ', from)
    switch (from.nodeType) {
        case 'TableExpr':
            var result = {
                alias: from.value[0].alias == null ? null: from.value[0].alias.value,
                tableName: from.value[0].exprName
            }
            return result;
        default:
            console.log('Forgot (getFromJSON): ', from)
    }
}

var getSelectJson = function (select) {
    console.log('got sel: ', select)
    return {
        alias: select.alias == null ? null : select.alias.value,
        name: select.value.value[0].value.value
    }
}

var getSelAndProj = function (columns, sqlFrom) {
    var from = [];
    var project = [];
    $.each(columns, function (index, statement) {
        project.push(getSelectJson(statement));
    })

    $.each(sqlFrom, function (index, statement) {
        from.push(getFromJSON(statement));
    })
    return {
        sel: project,
        fro: from
    }
/*   
    console.log("from: ", from);
    console.log("project: ", project);
*/
}

var findType = function (attri, tableData) {
    var table = null;
    var type = null;

    if (typeof(tableData) == 'object') {
        table = tableData.tableName;
    } else {
        table = tableData
    }

    attribute = attri.slice(attri.indexOf('.') + 1)
    $.each(relations, function (index, relation) {
        if (relation.table == table) {
            $.each(relation.columns, function (index, attrib) {
                if (attrib.name == attribute) {
                    type = attrib.type;
                }
            })
        }
    })
    return type;
}

var checkForSubCompatiability = function (leftAttri, leftAttriTable, subQueryAttri, subQueryTable) {
    lType = findType(leftAttri, leftAttriTable[0]);
    if (lType == null) {
        throw('Error ' + leftAttri + ' has no type!')
    }
    rType = findType(subQueryAttri[0].selCondition, subQueryTable.conditions[0])
    return lType == rType;
}

var getExtraFrom = function (term, possibleTables) {
    var results = {
        alias: null,
        tableName: null
    }
    $.each(possibleTables, function (index, tables) {
        $.each(relations, function (index, relation) {
            if (tables.tableName == relation.table) {
                $.each(relation.columns, function (index, column) {
                    if (term == column.name) {
                        results.tableName = relation.table;
                        results.alias = tables.alias;
                    }
                })
            }
        })
    })
    return results
}

var getProjectList = function (table) {
    list = null;
    $.each(relations, function (index, relation) {
        if (table == relation.table) {
            list = relation.columns;
        }
    })
    if (list == null)
        throw 'Relation '+ table + ' not found!'
    return list
}

var sortExpression = function (preNest, nestedStuff) {
    console.log('preNest: ', preNest);
    console.log('nested: ', nestedStuff)
    var innerSelect = nestedStuff.rightParsed.relationJson.project.conditions

    switch (nestedStuff.action.state) {
        case 'RhsInSelect':
            //console.log('outer stuff to match: ', nestedStuff.left)
            //console.log('inner stuff to match: ', innerSelect)
            if (checkForSubCompatiability(nestedStuff.left.attriForSub.value, preNest.fro, nestedStuff.rightParsed.relationJson.project.conditions, nestedStuff.rightParsed.relationJson.from) == false)
                throw ('The attribute types between the outer and inner query don\'t match!')
            var extraFromItem = getExtraFrom(nestedStuff.left.attriForSub.value.slice(nestedStuff.left.attriForSub.value.indexOf('.') + 1), preNest.fro)
            // add extra items to inner loop as per the process of converting the nested query into a 'single query'

            var projectExtraList = getProjectList(extraFromItem.tableName)

            $.each(projectExtraList, function(index, column){
                var addThis = extraFromItem.alias != null ? extraFromItem.alias + '.' :'';
                nestedStuff.rightParsed.relationJson.project.conditions.push(
                    {
                        selCondition: addThis+column.name
                    }
                    )
            })
           
            nestedStuff.rightParsed.relationJson.from.conditions.push(extraFromItem)
            nestedStuff.rightParsed.relationJson.select.conditions.conditions['nodeType'] = 'AndCondition';
            nestedStuff.rightParsed.relationJson.select.conditions.conditions.push(
                {
                    left: { selCondition: nestedStuff.left.attriForSub.value },
                    operator: '=',
                    right: {
                        conditions: {
                            selCondition: nestedStuff.left.attriForSub.value
                        }
                    }
                }
            )
            break;
        default:
            console.log('Forgot: ', nestedStuff)
    }
    return nestedStuff.rightParsed;
}




var printNestedQuery = function (relation) {
    var pro = relation.project;
    var from = relation.from;
    var sel = relation.select;

    if (relation.type != null) {
        return ' ' + relation.symbol + ' ';
    } else {

        var proSection = pro.symbol + '<sub> ';
        $.each(pro.conditions, function (index, attr) {
            proSection = proSection + attr.selCondition;
            if (index + 1 != pro.conditions.length)
                proSection = proSection + ', ';
        })
        proSection = proSection + '</sub> '

        var fromSection = '(';

        $.each(from.conditions, function (index, rel) {
            if (rel.alias != null) {
                fromSection = fromSection + rel.aliasSymbol + '<sub>' + rel.alias + '</sub>' + '(' + rel.tableName + ') ';
            } else {
                fromSection = fromSection + rel.tableName + ' ';
            }
            if (index + 1 != from.conditions.length)
                fromSection = fromSection + from.symbol + ' ';
        })

        fromSection = fromSection + ')'

        var selSection = goThroughSelect(sel.conditions);
    }
    return proSection + sel.symbol + '<sub> ' + selSection + '</sub> ' + fromSection;
}