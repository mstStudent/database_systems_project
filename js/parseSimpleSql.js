var simpleConvert = function (sqlJson, where) {
    switch (sqlJson.nodeType) {
        case 'Main':
            var message = {};
            $.each(sqlJson.value, function (index, query) {
                message[index] = simpleConvert(query)
            })
            return message;
            break;
        case 'Select':
            var relat = {
                'project': { 'symbol': '&Pi;', conditions: [] },
                'select': { 'symbol': '&sigma;', conditions: null },
                'from': { 'symbol': 'X', conditions: [] }
            };
            $.each(sqlJson.columns, function (index, column) {
                relat['project'].conditions[index] = simpleConvert(column);
            });
            $.each(sqlJson.from, function (index, fromStatement) {
                relat['from'].conditions[index] = simpleConvert(fromStatement);
            });
            relat.select.conditions = simpleConvert(sqlJson.where, 1);
            return relat;
            break;
        case 'Column':
            return simpleConvert(sqlJson.value);
            break;
        case 'AndCondition':
            if (where == 1) {
                var elem = {
                    operator: 'and',
                    symbol: '&Lambda;',
                    conditions: []
                };
                $.each(sqlJson.value, function (index, obj) {
                    elem.conditions.push(simpleConvert(obj))
                })
                return elem;
            } else {
                return simpleConvert(sqlJson.value[0])
            }
            break;
        case 'OrCondition':
            var elem = {
                operator: 'or',
                symbol: 'V',
                left: null,
                right: []
            };
            elem.left = simpleConvert(sqlJson.left, 1);
            $.each(sqlJson.right, function (index, right) {
                elem.right.push(simpleConvert(right, 1))
            })
            return elem;
            break;
        case 'Condition':
            return simpleConvert(sqlJson.value);
            break;
        case 'Term':
            return { selCondition: sqlJson.value }
            break;
        case 'TableExpr':
            var expression = {
                'alias': null,
                'aliasSymbol': '&rho;',
                'tableName': null
            }
            if (checkTables(sqlJson.value[0].exprName) == true) {
                if (sqlJson.value[0].alias != null)
                    expression.alias = sqlJson.value[0].alias.value;
                expression.tableName = sqlJson.value[0].exprName;
                return expression;
            } else {
                throw 'Table ' + sqlJson.value[0].exprName + ' does not exist';
            }
            break;
        case 'BinaryCondition':
            var expression = {
                left: null,
                operator: null,
                right: null
            };
            expression.left = simpleConvert(sqlJson.left);
            expression.operator = sqlJson.right.op;
            if (expression.operator == null || expression.operator == undefined) {
                switch (sqlJson.right.nodeType) {
                    case 'RhsInSelect':
                        expression.operator = '&cap;';
                        break;
                    default:
                        console.log('Binary Cond Forgot: ', sqlJson);
                }
            }

            expression.right = simpleConvert(sqlJson.right);

            /*console.log('expression: ', expression);*/
            return expression;
        case 'RhsInSelect':
            var thing = {
                'conditions': {}
            }
            $.each(sqlJson.value, function (index, part) {
                thing.conditions[index] = simpleConvert(part)
            })
            return thing
            break;
        case 'RhsCompare':
            return {
                'operator': sqlJson.op,
                'conditions': simpleConvert(sqlJson.value)
            }
        default:
            if (typeof (sqlJson) == 'object') {
                if (sqlJson.length > 1) {
                    console.log('rewrite a little (simple parse)')
                } else {
                    return simpleConvert(sqlJson[0])
                }

            }
            console.log("Forgot: ", sqlJson);
    }
}

var goThroughSelect = function (select) {
    var message = ''
    if (select.operator == undefined) {
        if (select.selCondition != null) {
            message = message + select.selCondition;
        }
        if (select.left != null) {
            message = message + goThroughSelect(select.left)
        }
        if (select.right != null) {
            message = message + goThroughSelect(select.right)
        }
    } else {
        switch (select.operator) {
            case 'and':
                $.each(select.conditions, function (index, condition) {
                    message = message + goThroughSelect(condition);
                    if (index + 1 != select.conditions.length) {
                        message = message + ' ' + select.symbol + ' ';
                    }
                });
                break;
            case 'or':
                message = message + goThroughSelect(select.left);
                message = message + ' ' + select.symbol + ' ';
                $.each(select.right, function (index, condition) {
                    message = message + goThroughSelect(condition);
                })
                break;
            case '=':
            case '>':
            case '<':
            case '!=':
                if (select.left == undefined) {
                    message = message + goThroughSelect(select.conditions);
                }
                else {
                    message = message + goThroughSelect(select.left);
                    message = message + ' ' + select.operator + ' ';
                    message = message + goThroughSelect(select.right);
                }
                break;
            /*case '&cap;':
                message = message + goThroughSelect(select.left);
                selectResults.messageAppend = goThroughSelect(select.right)
                break;*/
            default:
                console.log("Forgot this ( where ) : ", select);
        }
    }
    return message;
}

var printSimpleQuery = function (relation) {
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