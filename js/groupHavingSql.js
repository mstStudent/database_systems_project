var sortGroupExpression = function (sqlJson, have, groupby) {
    console.log("GROUP : ", sqlJson);

    var proandFro = getSelAndProj(sqlJson.value[0].columns, sqlJson.value[0].from);

    var from = proandFro.fro;

    var having = {
        symbol: '&sigma;',
        condition: simpleConvert(sqlJson.value[0].having)
    }
    
    if(having.condition == null){
      having = null;
    }

    var grouping = {
        symbol: '&gamma;',
        condition: simpleConvert(sqlJson.value[0].groupBy)
    }

if(grouping.condition == null){
      grouping = null;
    }

    var aggrigated = [];

    var project = [];


    $.each(proandFro.sel, function (index, check) {
        if(check.args == null)
            project.push(check)
        else
            aggrigated.push(check)
    })

    var where = simpleConvert(sqlJson.value[0].where, 1);

    return {
        project: project,
        from: from,
        having: having,
        grouping: grouping,
        aggrigated: aggrigated,
        where: where
    }
}

var printGroupQuery = function (relation) {
    console.log(relation);

    var proj = '&Pi; <sub>'
    $.each(relation.project, function (index, projectAttr) {
        if (projectAttr.alias == null)
            proj = proj + ' ' + projectAttr.name
        else
            proj = proj + ' ' + projectAttr.alias + '.' + projectAttr.name
        if (index + 1 != relation.project.length) {
            proj = proj + ','
        }
    })
    proj = proj + '</sub> '

    var having = '';
    if (relation.having != null) {
        having = '&sigma; <sub>'
        if (relation.having.condition.selCondition != null) {
            $.each(relation.having.condition.selCondition.value, function (index, have) {
                having = having + have.left.value + have.right.op + have.right.value.value;
                if (index + 1 != relation.having.length) {
                    having = having + ', '
                }
            })
        }else
            having = having + relation.having.condition.left.selCondition + ' ' + relation.having.condition.right.operator + ' ' + relation.having.condition.right.conditions.selCondition;
        having = having + '</sub> '
    }

    var grouping = ''

    if (relation.grouping != null) {
        grouping = '&gamma; <sub>'
        if(relation.grouping.condition.selCondition != null)
        {
            grouping = grouping + relation.grouping.condition.selCondition
        }
        if (relation.aggrigated.length == 0)
          grouping = grouping + '</sub> '
    }

    if (relation.aggrigated.length > 0) {
        if (grouping == '') {
            grouping = '&gamma; <sub>'
        } else {
            grouping = grouping + ', ' 
        }
        $.each(relation.aggrigated, function (index, aggre) {
            if (aggre.alias != null) {
                grouping = grouping + "&rho; " + aggre.alias + '(' + aggre.name + '( '
                $.each(aggre.args, function (index, arg) {
                    grouping = grouping + arg
                    if (index + 1 != aggre.args.length) {
                        grouping = grouping + ', '
                    }
                })
                grouping = grouping + '))'
            }
            else {
                grouping = grouping + aggre.name + '(';
                $.each(aggre.args, function (index, arg) {
                    grouping = grouping + arg
                    if (index + 1 != aggre.args.length) {
                        grouping = grouping + ', '
                    }
                })
                grouping = grouping + ')'
            }
            if (index + 1 != relation.aggrigated.length) {
                grouping = grouping + ','
            }
        })
        grouping = grouping + '</sub> '
    }
    
    var where = ''

    if (relation.where != null) {
        where = '&sigma; <sub>'
        $.each(relation.where.conditions, function (index, cond) {
            where = where + goThroughSelect(cond)
            if (index + 1 != relation.where.conditions)
                where = where + ' ' + relation.where.symbol;
        })
    }

    var fromSection = '(';

    $.each(relation.from, function (index, rel) {
        if (rel.alias != null) {
            fromSection = fromSection + "&rho;" + '<sub>' + rel.alias + '</sub>' + '(' + rel.tableName + ') ';
        } else {
            fromSection = fromSection + rel.tableName + ' ';
        }
        if (index + 1 != relation.from.length)
            fromSection = fromSection + 'X ';
    })

    fromSection = fromSection + ')'

    return proj + having + grouping + where + fromSection;
}
