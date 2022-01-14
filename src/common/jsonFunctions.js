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
                } else if (core.isInstanceOf(node, META.NullElement)) {
                    result[key] = null;
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
                } else if (core.isInstanceOf(node, META.NullElement)) {
                    result.push(null);
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

    const _clearSubElementsFromDictionary = function(dictionary, jsonPath) {
        const elementsToRemove = [];
        Object.keys(dictionary).forEach(path => {
            if(path.indexOf(jsonPath + '/') === 0) {
                elementsToRemove.push(path);
            }
        });

        elementsToRemove.forEach(path => {
            delete dictionary[path];
        });
    }

    const JSONToModel = function(jsonPathToNodeDictionary, jsonValue, jsonPath, name, parent, core, META, logger) {
        let node = jsonPathToNodeDictionary[jsonPath] || null;
        if (typeof jsonValue === 'string') {
            if (node) {
                if (!core.isInstanceOf(node, META['StringElement'])) {
                    core.setBase(node, META['StringElement']);
                }
                core.setAttribute(node, 'value', jsonValue);
            } else {
                node = core.createNode({parent:parent, base:META['StringElement']});
                core.setAttribute(node,'name', name);
                core.setAttribute(node,'value', jsonValue);
                jsonPathToNodeDictionary[jsonPath] = node;
            }
        } else if (typeof jsonValue === 'number') {
            if (node) {
                if (!core.isInstanceOf(node, META['NumberElement'])) {
                    core.setBase(node, META['NumberElement']);
                }
                core.setAttribute(node, 'value', jsonValue);
            } else {
                node = core.createNode({parent:parent, base:META['NumberElement']});
                core.setAttribute(node, 'name', name);
                core.setAttribute(node, 'value', jsonValue);
                jsonPathToNodeDictionary[jsonPath] = node;
            }
        } else if (typeof jsonValue === 'boolean') {
            if (node) {
                if (!core.isInstanceOf(node, META['BooleanElement'])) {
                    core.setBase(node, META['BooleanElement']);
                }
                core.setAttribute(node, 'value', jsonValue);
            } else {
                node = core.createNode({parent:parent, base:META['BooleanElement']});
                core.setAttribute(node, 'name', name);
                core.setAttribute(node, 'value', jsonValue);
                jsonPathToNodeDictionary[jsonPath] = node;
            }
        } else if (jsonValue === null) {
            if (node) {
                if (!core.isInstanceOf(node, META['NullElement'])) {
                    core.setBase(node, META['NullElement']);
                }
            } else {
                node = core.createNode({parent:parent, base:META['NullElement']});
                core.setAttribute(node,'name', name);
                jsonPathToNodeDictionary[jsonPath] = node;
            }
        } else if (Array.isArray(jsonValue)) {
            if (node) {
                if(!core.isInstanceOf(node, META['ArrayElement'])) {
                    if(core.isInstanceOf(node, META['ObjectElement'])) {
                        const relids = core.getChildrenRelids(node);
                        relids.forEach(childRelid => {
                            const child = core.getChild(node, childRelid);
                            const path = jsonPath + '/' + core.getAttribute(child, 'name');
                            core.deleteNode(child);
                            delete jsonPathToNodeDictionary[path];
                            _clearSubElementsFromDictionary(jsonPathToNodeDictionary, path);
                        });
                    }
                    core.setBase(node, META['ArrayElement']);
                } 
            } else {
                node = core.createNode({parent:parent, base:META['ArrayElement']});
                core.setAttribute(node, 'name', name);
            }
            jsonValue.forEach((value, index) => {
                JSONToModel(jsonPathToNodeDictionary, value, jsonPath + '/' + index, index, node, core, META, logger);
            });
        } else if(typeof jsonValue === 'object') {
            if (node) {
                if(!core.isInstanceOf(node, META['ObjectElement'])) {
                    if(core.isInstanceOf(node, META['ArrayElement'])) {
                        const relids = core.getChildrenRelids(node);
                        relids.forEach(childRelid => {
                            const child = core.getChild(node, childRelid);
                            const path = jsonPath + '/' + core.getAttribute(child, 'name');
                            core.deleteNode(child);
                            delete jsonPathToNodeDictionary[path];
                            _clearSubElementsFromDictionary(jsonPathToNodeDictionary, path);
                        });
                    }
                    core.setBase(node, META['ObjectElement']);
                } 
            } else {
                node = core.createNode({parent:parent, base:META['ObjectElement']});
                core.setAttribute(node, 'name', name);
            }
            Object.keys(jsonValue).forEach(key => {
                JSONToModel(jsonPathToNodeDictionary, jsonValue[key], jsonPath + '/' + key, key, node, core, META, logger);
            });
        } else {
            throw new Error('Unkown json element cannot be processed!');
        }
    }

    const buidJSONDictionary = function(mainNode, core, META, Q, logger) {
        const deferred = Q.defer();
        const pathToNode = {};
        const JSONPathToNode = {'': mainNode};
        const processElement = function(node, pathSoFar) {
            core.getChildrenPaths(node).forEach(childPath => {
                const child = pathToNode[childPath];
                const newPath = pathSoFar + '/' + core.getAttribute(child, 'name');
                JSONPathToNode[newPath] = child;
                if (core.isInstanceOf(child, META['ObjectElement']) || core.isInstanceOf(child, META['ArrayElement'])) {
                    processElement(child, newPath);
                }
            });
        };

        core.loadSubTree(mainNode)
        .then(nodes => {
            nodes.forEach(node => {
                pathToNode[core.getPath(node)] = node;
            });

            processElement(mainNode, '');
            deferred.resolve(JSONPathToNode);
        })
        .catch(deferred.reject);

        return deferred.promise;
    }
    return {
        appendJSON: appendJSON,
        JSONHierarchyToString: JSONHierarchyToString,
        JSONToModel: JSONToModel,
        buidJSONDictionary: buidJSONDictionary
    }
});