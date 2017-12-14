module.exports = function() {
    
    const CLICKABLE_TAGS = ['submit','reset'];
    // import { select } from 'optimal-select';
    // var select = require('optimal-select');

    
    return {
        selectorsA: grabSelectorA(),
        // checkbox: grabCheckbox(),
        inputText: grabInputText(),
        inputPassword: grabInputPassword(),
        inputToClick: grabInputToClick(),
        textarea: grabTextarea(),
        selectOption: grabSelectOptions(),
    };

    function grabSelectorA() {
        var selectors = [];
        var sels = document.getElementsByTagName('a'); 
        for (var i = 0; i < sels.length; i++) {
            if (sels[i].href)
                selectors.push({
                    kind: "click",
                    selector: computeSelector(sels[i]),
                });
        }

        return selectors;
    }

    // function grabCheckbox() {
    //     var selectors = [];
    //     var sels = document.getElementsByTagName('input');
    //     for (var i = 0; i < sels.length; i++) {
    //         if (sels[i].type == 'checkbox')
    //             selectors.push({
    //                 kind: "check",
    //                 selector: computeSelector(sels[i]),
    //             });
    //     }

    //     return selectors;
    // }

    function grabInputText() {
        var selectors = [];
        var sels = document.getElementsByTagName('input');
        for (var i = 0; i < sels.length; i++) {
            if (sels[i].type == 'text')
                selectors.push({
                    kind: "type",
                    selector: computeSelector(sels[i]),
                });
        }

        return selectors;
    }

    function grabInputToClick() {
        var selectors = [];
        var sels = document.getElementsByTagName('input');
        for (var i = 0; i < sels.length; i++) {
            if (CLICKABLE_TAGS.indexOf(sels[i].type) !== -1){
                selectors.push({
                    kind: "click",
                    selector: computeSelector(sels[i]),
                });
            }

        }

        return selectors;
    }

    function grabInputPassword() {
        var selectors = [];
        var sels = document.getElementsByTagName('input');
        for (var i = 0; i < sels.length; i++) {
            if (sels[i].type == 'password')
                selectors.push({
                    kind: "type",
                    selector: computeSelector(sels[i]),
                });
        }

        return selectors;
    }

    function grabTextarea() {
        var selectors = [];
        var sels = document.getElementsByTagName('textarea');
        for (var i = 0; i < sels.length; i++) {
            if (sels[i])
                selectors.push({
                    kind: "type",
                    selector: computeSelector(sels[i]),
                });
        }

        return selectors;
    }
    
    function grabSelectOptions() {
        var selectors = [];
        var sels = document.getElementsByTagName('option'); //options
        for (var i = 0; i < sels.length; i++) {
            selectors.push({
                kind: "select",
                selector: computeSelector(sels[i].parentNode),
                value: sels[i].value,
            });

        }

        return selectors;
    }

    // function computeSelector(el) {
    //     var names = [];
    //     while (el.parentNode) {
    //         if (el.id) {
    //             names.unshift(`#${el.id}`);
    //             break;
    //         } else {
    //             if (el == el.ownerDocument.documentElement)
    //                 names.unshift(el.tagName);
    //             else {
    //                 for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
    //                     names.unshift(`${el.tagName}:nth-child(${c})`);
    //             }
    //             el = el.parentNode;
    //         }
    //     }
    //     return names.join(' > ');
    // }

    function computeSelector(el) {
        return {
            watId: computeSelectorWithID(el),
            watPath: computeSelectorWithPath(el),
            optimal: computeSelectorOptimal(el)
        };
    }

    function computeSelectorWithID(el) {
        var names = [];
        while (el.parentNode) {
            if (el.id) {
                names.unshift(`#${el.id}`);
                break;
            } else {
                if (el == el.ownerDocument.documentElement)
                    names.unshift(el.tagName);
                else {
                    for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
                        names.unshift(`${el.tagName}:nth-child(${c})`);
                }
            }
            return names.join(' > ');
        }
        return names.join(' > ');
    }

    function computeSelectorWithPath(el) {
        // return null;
        var names = [];
        while (el.parentNode) {
            if (el == el.ownerDocument.documentElement)
                names.unshift(el.tagName);
            else {
                for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
                    names.unshift(`${el.tagName}:nth-child(${c})`);
            }
            el = el.parentNode;
        }
        return names.join(' > ');
    }

    function computeSelectorOptimal(el) {
        return null;
        // return select(el);
    }


};
