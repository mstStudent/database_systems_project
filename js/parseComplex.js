var printComplexQuery = function (relation) {

    var first = printSimpleQuery(relation.first.relationJson);
    var operator = null;
    switch (relation.op.value) {
        case 'UNION':
            operator = ' &cup; '
            break;
        case 'EXCEPT':
            operator = ' &minus; '
            break;
        case 'INTERSECT':
            operator = ' &cap; '
            break;
        default:
            console.log("forgot (complex): " , relation.op)
    }
    var second = printSimpleQuery(relation.second.relationJson);

    return first + operator + second;
}