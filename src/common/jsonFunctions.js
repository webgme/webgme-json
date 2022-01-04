define([], function () {

    /* Merge addition over base.
       In case of any discrepancy, addition will have precedence.
       This means that worst case is that only addition will be given back.
       Other important factor is that there is no appending of Arrays. If the addition is an array,
       it simply replaces the array in the base (or whatever was there before).
    */
    const appendJSON = function(base, addition) {
        const result = JSON.parse(JSON.stringify(base));

        if(Array.isArray(addition)) {
            return JSON.parse(JSON.stringify(addition));
        }

        if(Array.isArray(result)) {
            return JSON.parse(JSON.stringify(addition));
        }
        
        if(typeof result === 'object' && typeof addition === 'object') {
            Object.keys(addition).forEach(key => {
                if(result.hasOwnProperty(key)) {
                    if( typeof result[key] !== typeof addition[key]){
                        result[key] = JSON.parse(JSON.stringify(addition[key]));    
                    } else if(typeof result[key] === 'number' ||
                                typeof result[key] === 'string' ||
                                typeof result[key] === 'boolean') {
                        result[key] = addition[key]
                    } else if(Array.isArray(result[key])) {
                        result[key] = JSON.parse(JSON.stringify(addition[key]));    
                    } else {
                        //TODO we can assume that both are objects, so we can start the recursion
                        result[key] = appendJSON(result[key], addition[key]);
                    }
                } else {
                    result[key] = JSON.parse(JSON.stringify(addition[key]));
                }
            });
            return result;
        }

        return JSON.parse(JSON.stringify(addition));
    }
    
    const JSONHierarchyToString = function(nodes, mainNode, core, META, logger) {
        const exportObject = function(objectNode) {
            const result = {};
            const childrenPaths = core.getChildrenPaths(objectNode);
            childrenPaths.forEach(path => {
                const node = nodes[path];
                const key = core.getAttribute(node, 'name');
                if(core.isInstanceOf(node, META.BooleanElement) ||
                    core.isInstanceOf(node, META.NumberElement) ||
                    core.isInstanceOf(node, META.StringElement)) {
                    result[key] = core.getAttribute(node, 'value');
                } else if (core.isInstanceOf(node, META.ArrayElement)) {
                    result[key] = exportArray(node);
                } else if(core.isInstanceOf(node, META.ObjectElement)) {
                    result[key] = exportObject(node);
                } else {
                    logger.error('Unknown node type in the object!!! - ignore for now');
                }
            });
            return result;
        };

        const exportArray = function(arrayNode) {
            const result = [];
            const childrenPaths = core.getChildrenPaths(arrayNode);
            const orderedElementPaths = Array(childrenPaths.length).fill(null);

            //first, we put the paths in order
            childrenPaths.forEach(path => {
                index = Number(core.getAttribute(nodes[path], 'name'));
                orderedElementPaths.splice(index,1,path);
            });
            //second, we do the same evaluation on each node as in the object case
            orderedElementPaths.forEach(path => {
                const node = nodes[path];
                const key = core.getAttribute(node, 'name');
                if(core.isInstanceOf(node, META.BooleanElement) ||
                    core.isInstanceOf(node, META.NumberElement) ||
                    core.isInstanceOf(node, META.StringElement)) {
                    result.push(core.getAttribute(node, 'value'));
                } else if (core.isInstanceOf(node, META.ArrayElement)) {
                    result.push(exportArray(node));
                } else if(core.isInstanceOf(node, META.ObjectElement)) {
                    result.push(exportObject(node));
                } else {
                    logger.error('Unknown node type in the object!!! - ignore for now');
                }
            });
            return result;
        };

        if(!core.isInstanceOf(mainNode, META.ObjectElement) && !core.isInstanceOf(mainNode, META.ArrayElement)) {
            logger.error('Only arrays and objects can be exported!!');
            return new Error('Only array and object elements can be exported!');
        }

        let result = null;
        if(core.isInstanceOf(mainNode, META.ObjectElement)){
            result = JSON.stringify(exportObject(mainNode), null, 2);
        } else {
            result = JSON.stringify(exportArray(mainNode), null, 2);
        }

        return result;
    }

    return {
        appendJSON: appendJSON,
        JSONHierarchyToString: JSONHierarchyToString
    }
});