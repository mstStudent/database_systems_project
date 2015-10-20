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
                var tempCheck = relat['project'].conditions[index]
                if(checkIfRenamed(tempCheck.selCondition, tempCheck.selCondition.slice(tempCheck.selCondition.indexOf('.')+1)).found == false)
                    throw 'Error ' + tempCheck.selCondition +' doesn\'t exist' 
            });
            $.each(sqlJson.from, function (index, fromStatement) {
                relat['from'].conditions[index] = simpleConvert(fromStatement);
                var tempCheck = relat['from'].conditions[index].tableName
                if (checkTables(tempCheck)== false)
                    throw 'Error ' + tempCheck + ' doesn\'t exist'
            });
            relat.select.conditions = simpleConvert(sqlJson.where, 1);
            return relat;
            break;
        case 'Column':
            if (sqlJson.alias != null) {
                return {
                    alias: sqlJson.alias.value,
                    column: simpleConvert(sqlJson.value)
                }
            } else
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
            break;
        case 'FunctionCall':
            return sqlJson
            break;
        default:
            if (typeof (sqlJson) == 'object') {
                if (sqlJson.length > 1) {
                    console.log('Unexpected error (simple parse)')
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
        if (select.length > 1) {
            $.each(select, function (index, item) {
                message = message + goThroughSelect(item);
            })
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
            if (attr.nodeType == 'FunctionCall') {
                proSection = proSection + '(' + attr.name + ' (';
                $.each(attr.args, function (index, arg) {
                    proSection = proSection + arg;
                })
                proSection = proSection +') ';
            } else if (attr.alias != null) {
                proSection = proSection + "&rho;" + attr.alias + '(' + attr.column.name + ' (';
                $.each(attr.column.args, function (index, arg) {
                    proSection = proSection + arg;
                })
                proSection = proSection + ')) ';
            }else {
                proSection = proSection + attr.selCondition;
                if (index + 1 != pro.conditions.length)
                    proSection = proSection + ', ';
            }
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


var margin = { top: 20, right: 120, bottom: 20, left: 120 },
width = 960 - margin.right - margin.left,
height = 500 - margin.top - margin.bottom;

var i = 0;

var tree = d3.layout.tree()
 .size([height, width]);

var diagonal = d3.svg.diagonal()
 .projection(function (d) { return [d.y, d.x]; });

var svg = d3.select("#tree").append("svg")
 .attr("width", width + margin.right + margin.left)
 .attr("height", height + margin.top + margin.bottom)
  .append("g")
 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var updateTree = function (source) {    

    root = source;

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
     links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) { d.y = d.depth * 180; });

    // Declare the nodes
    var node = svg.selectAll("g.node")
     .data(nodes, function (d) { return d.id || (d.id = ++i); });

    // Enter the nodes.
    var nodeEnter = node.enter().append("g")
     .attr("class", "node")
     .attr("transform", function (d) {
         return "translate(" + d.y + "," + d.x + ")";
     });

    nodeEnter.append("circle")
     .attr("r", 10)
     .style("fill", "#fff");

    nodeEnter.append("text")
     .attr("x", function (d) {
         return d.children || d._children ? -13 : 13;
     })
     .attr("dy", ".35em")
     .attr("text-anchor", function (d) {
         return d.children || d._children ? "end" : "start";
     })
     .html(function (d) { return d.symbol; })
     .style("fill-opacity", 1);

    nodeEnter.append("text")
     .attr("x", function (d) {
         return d.children || d._children ? -13 : 13;
     })
     .attr("dy", "2em")
     .attr("text-anchor", function (d) {
         return d.children || d._children ? "end" : "start";
     })
     .html(function (d) { return d.details; })
     .style("fill-opacity", 1);

    // Declare the links
    var link = svg.selectAll("path.link")
     .data(links, function (d) { return d.target.id; });

    // Enter the links.
    link.enter().insert("path", "g")
     .attr("class", "link")
     .attr("d", diagonal);

}

var treeNode = function(details){
    return {
        'name': details.name || '',
        'symbol': details.symbol || null,
        'details': details.details || '',
        'parent': details.parent || null,
        'children': details.children || []
    
    }
}

var createSimpleTree = function(jsonItem){
    console.log(jsonItem);
    var main = treeNode({
        'name': 'root',
        "symbol": jsonItem.project.symbol,
        "details": '',
        "parent": null,
        "children": []
    })

    $.each(jsonItem.project.conditions, function (index, item) {
        main.details = main.details + item.selCondition;
        if (index + 1 != jsonItem.project.conditions.length) {
            main.details = main.details + ', '
        }
    })

    var selectNode = treeNode({
        'name': 'select',
        "symbol": jsonItem.select.symbol,
        "details": '',
        "parent": 'root',
        "children": []
    })
    $.each(jsonItem.select.conditions.conditions, function (index, item) {
        selectNode.details = selectNode.details + item.left.selCondition + ' ' + item.operator + ' ' + item.right.conditions.selCondition;
        if (index + 1 != jsonItem.select.conditions.conditions.length) {
            selectNode.details = selectNode.details + ' ' + jsonItem.select.conditions.symbol + ' '
        }
    })

    main.children.push(selectNode)

    var treeLayout = [main]

 

    updateTree(treeLayout[0]);
}