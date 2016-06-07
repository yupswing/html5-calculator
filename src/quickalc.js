/*

QuickCalc by Simone Cingano
A simple calculator written in pure HTML5
Licence: MIT
Version: 1.0
Repository: https://github.com/yupswing/quickalc

*/

var DOT = '.'; // DO NOT CHANGE
var CLEAR_ALL = 'AC';
var CLEAR = 'C';

var buffer_input = '0'; // text input buffer
var registry_main = null; // main result
var registry_memory = null; // memory
var registry_input = null; // last parsed input buffer
var registry_operator = null; // current operator
var has_to_show_registry_main = false; // Renderer status
var has_to_all_clear = true; // AC/C status flag
var is_last_operator_equal = false; // last action was EQUAL
var is_error = false; // There was an error (only way is to CLEAR)

function _update() {
    if (is_error) {
        $('#display').html({
            'NAN': 'Not a number',
            'DIV/0': 'Division by zero'
        }[is_error]);
        $('#clear').html(CLEAR_ALL);
        return;
    }
    // console.log('BUFFER: ' + buffer_input + ' | REGISTRY_MAIN: ' + registry_main + ' | OPERATOR: ' + registry_operator + ' | REGISTRY_INPUT: ' + registry_input);
    if (has_to_show_registry_main) {
        $('#display').html(parseFloat(registry_main).toFixed(15).replace(/\.?0+$/, ''));
    } else {
        $('#display').html(buffer_input || 0);
    }
    // if (registry_operator) {
    //     if (registry_input) {
    //         $('#buffer').html(parseFloat(registry_main).toFixed(15).replace(/\.?0+$/, '') + ' ' + registry_operator + ' ' + registry_input);
    //     } else {
    //         $('#buffer').html(parseFloat(registry_main).toFixed(15).replace(/\.?0+$/, '') + ' ' + registry_operator);
    //     }
    // } else {
    //     $('#buffer').html('');
    // }
    if (registry_memory) {
        $('#memory').html('MEM');
        // $('#memory').html(parseFloat(registry_memory).toFixed(15).replace(/\.?0+$/, ''));
    } else {
        $('#memory').html('');
    }

    if (has_to_all_clear) {
        $('#clear').html(CLEAR_ALL);
    } else {
        $('#clear').html(CLEAR);
    }
}

function operator(op, opequal) {
    has_to_all_clear = true;
    if (is_error) return;
    if (!opequal && !is_last_operator_equal && has_to_show_registry_main) {
        // avoid multi operator (example: x+*...)
        return;
    }

    if (isNull(registry_main) && isNull(buffer_input)) {
        buffer_input = 0;
    }
    if (opequal && isNull(buffer_input) && isNull(registry_input)) {
        // avoid EQUAL without an input (example: x+y=z => z+=)
        return;
    }

    has_to_show_registry_main = true;

    var _input_number = parseFloat(buffer_input);
    if (isNaN(_input_number)) _input_number = 0;
    buffer_input = null;

    if (!opequal && is_last_operator_equal) {
        // remove OPERATOR if executing an OP after an EQUAL
        registry_operator = null;
    }

    if (!isNull(registry_main)) {
        // if it was already performed an operation
        if (opequal && registry_input) {
            // it is a actionEqual with already an input from before (use it as it was input manually)
            _input_number = registry_input;
        } else {
            // save the input value for a possible multiple equal press
            registry_input = _input_number;
        }
        switch (registry_operator) {
            case '+':
                registry_main += _input_number;
                _highlight('button_sum');
                break;
            case '-':
                registry_main -= _input_number;
                _highlight('button_sub');
                break;
            case '*':
                registry_main *= _input_number;
                _highlight('button_mul');
                break;
            case '/':
                if (_input_number === 0) {
                    _error("DIV/0");
                    return;
                }
                registry_main /= _input_number;
                _highlight('button_div');
                break;
        }
    } else {
        // never performed an operation
        registry_main = _input_number;
    }
    is_last_operator_equal = opequal; // remember if it was an actionEqual
    if (!opequal) {
        // if it was an operation (!equal) remove the old registry_input (no need to execute it again)
        registry_input = null;
        _highlight('button_' + {
            '+': 'sum',
            '-': 'sub',
            '*': 'mul',
            '/': 'div'
        }[op]);
    } else {
        _highlight('button_equal');
    }
    _highlightDisplay();
    registry_operator = op; // save the input operator to perform it next round
    _update();
}

function actionEqual() {
    if (is_error) return;
    operator(registry_operator, true);
}

function actionPercent() {
    if (is_error) return;
    if (!isNull(registry_main)) {
        buffer_input = _parseBufferInput(parseFloat(buffer_input) / 100 * registry_main);
    } else if (!isNull(buffer_input)) {
        buffer_input = _parseBufferInput(parseFloat(buffer_input) / 100);
    } else {
        return;
    }
    _update();
    _highlight('button_percent');
    _highlightDisplay();
}

function _error(kind) {
    is_error = kind;
    _update();
}

function actionInverse() {
    if (is_error) return;
    if (!isNull(buffer_input)) {
        buffer_input = _parseBufferInput(-parseFloat(buffer_input));
    } else if (!isNull(registry_main)) {
        registry_main = -registry_main;
    } else {
        return;
    }
    _update();
    _highlight('button_inverse');
    _highlightDisplay();
}

function actionReciprocal() {
    if (is_error) return;
    if (!isNull(buffer_input)) {
        if (parseFloat(buffer_input) === 0) {
            _error("NAN");
            return;
        }
        buffer_input = _parseBufferInput(1 / parseFloat(buffer_input));
    } else if (!isNull(registry_main)) {
        if (registry_main === 0) {
            _error("NAN");
            return;
        }
        registry_main = 1 / registry_main;
    } else {
        return;
    }
    _update();
    _highlight('button_reciprocal');
    _highlightDisplay();
}

function actionSquare() {
    if (is_error) return;
    if (!isNull(buffer_input)) {
        buffer_input = _parseBufferInput(parseFloat(buffer_input) * parseFloat(buffer_input));
    } else if (!isNull(registry_main)) {
        registry_main *= registry_main;
    } else {
        return;
    }
    _update();
    _highlight('button_square');
    _highlightDisplay();
}

function actionSquareroot() {
    if (is_error) return;
    if (!isNull(buffer_input)) {
        if (parseFloat(buffer_input) < 0) {
            _error("NAN");
            return;
        }
        buffer_input = _parseBufferInput(Math.sqrt(parseFloat(buffer_input)));
    } else if (!isNull(registry_main)) {
        if (registry_main < 0) {
            _error("NAN");
            return;
        }
        registry_main = Math.sqrt(registry_main);
    } else {
        return;
    }
    _update();
    _highlight('button_squareroot');
    _highlightDisplay();
}

function memorySum() {
    if (is_error) return;
    if (isNull(registry_memory)) registry_memory = 0;
    if (has_to_show_registry_main) {
        registry_memory += registry_main;
    } else {
        registry_memory += parseFloat(buffer_input || 0);
    }
    _highlightMemory();
    _highlight('button_memorysum');
    _update();
}

function memorySub() {
    if (is_error) return;
    if (isNull(registry_memory)) registry_memory = 0;
    if (has_to_show_registry_main) {
        registry_memory -= registry_main;
    } else {
        registry_memory -= parseFloat(buffer_input || 0);
    }
    _highlightMemory();
    _highlight('button_memorysub');
    _update();
}

function memoryClear() {
    if (is_error) return;
    if (!registry_memory) return;
    registry_memory = null;
    _highlightMemory();
    _highlight('button_memoryclear');
    _update();
}

function memoryRecall() {
    if (is_error) return;
    if (!registry_memory) return;
    buffer_input = '' + registry_memory.toFixed(15).replace(/\.?0+$/, '');
    _highlightDisplay();
    _highlight('button_memoryrecall');
    _input();
}

function _input() {
    // Do this every time there is an input
    has_to_show_registry_main = false; // render the input and not the result
    has_to_all_clear = false; // allow clear
    if (is_last_operator_equal) {
        // if last input was an EQUAL clear the state as this will be a NEW OPERATION
        _clearRegistries();
    }
    _update();
}

function _parseBufferInput(new_buffer_input) {
    if (isNaN(new_buffer_input) || new_buffer_input === 0) {
        return '0';
    }
    return new_buffer_input.toFixed(15).replace(/\.?0+$/, '');
}

function _clearRegistries() {
    registry_main = null;
    registry_input = null;
    registry_operator = null;
}

function actionClear() {
    if (has_to_all_clear || is_error) {
        buffer_input = '0'; //#XXX
        _clearRegistries();
    } else {
        buffer_input = '0';
    }
    is_error = false;
    has_to_show_registry_main = false;
    has_to_all_clear = true;
    _highlight('button_clear');
    _highlightDisplay();
    _update();
}

function _highlight(cls) {
    var obj = $('.' + cls);
    obj.finish();
    var color = obj.css('color');
    var backgroundColor = obj.css('backgroundColor');
    obj.css({
        'backgroundColor': '#fff',
        'color': '#ddd'
    }).animate({
        'backgroundColor': backgroundColor,
        'color': color,
    }, 400, 'easeOutExpo');
}

function _highlightDisplay() {
    $('#display').hide();
    setTimeout(function() {
        $('#display').show();
    }, 100);
}

function _highlightMemory() {
    $('#memory').hide();
    setTimeout(function() {
        $('#memory').show();
    }, 30);
}

function inputNumber(n) {
    if (is_error) return;
    if (isNull(buffer_input) || buffer_input === '0') {
        buffer_input = '';
    }
    buffer_input += '' + n;
    _highlight('button_' + n);
    _input();
}

function inputPi() {
    if (is_error) return;
    buffer_input = '' + Math.PI;
    _highlight('button_pi');
    _input();
}

function inputBack() {
    if (is_error) return;
    if (isNull(buffer_input)) return;
    buffer_input = buffer_input.slice(0, buffer_input.length - 1);
    if (buffer_input === '') {
        buffer_input = '0';
    }
    if (buffer_input.slice(-1) === DOT) {
        buffer_input = buffer_input.slice(0, buffer_input.length - 1);
    }
    _input();
}

function inputDecimal() {
    if (is_error)
        return;
    if (isNull(buffer_input)) {
        buffer_input = '0';
    }
    if (buffer_input.indexOf(DOT) >= 0) {
        return;
    }
    buffer_input += DOT;
    _highlight('button_decimal');
    _input();
}

var isNull = function(obj) {
    return obj === null;
};

$(function() {
    _update();

    //LISTENERS
    $(document).on("keyup", function(e) {
        if (e.which == 8) {
            inputBack();
        }
    });

    $(document).on("keypress", function(e) {
        if (e.which >= 48 && e.which <= 58) {
            inputNumber(e.which - 48);
            return;
        }
        switch (e.which) {
            case 13:
            case 32:
            case 61: // space or return or =
                actionEqual();
                break;
            case 99: // c
                actionClear();
                break;
            case 46:
            case 44: // . or ,
                inputDecimal();
                break;
            case 43: // +
                operator('+');
                break;
            case 45: // -
                operator('-');
                break;
            case 42: // *
                operator('*');
                break;
            case 47: // /
                operator('/');
                break;
            case 100: // d
                inputBack();
                break;
            case 37: // %
                actionPercent();
                break;
            case 112: // P
                inputPi();
                break;
        }
    });
    $('.button_0').on('click', function() {
        inputNumber(0);
    });
    $('.button_1').on('click', function() {
        inputNumber(1);
    });
    $('.button_2').on('click', function() {
        inputNumber(2);
    });
    $('.button_3').on('click', function() {
        inputNumber(3);
    });
    $('.button_4').on('click', function() {
        inputNumber(4);
    });
    $('.button_5').on('click', function() {
        inputNumber(5);
    });
    $('.button_6').on('click', function() {
        inputNumber(6);
    });
    $('.button_7').on('click', function() {
        inputNumber(7);
    });
    $('.button_8').on('click', function() {
        inputNumber(8);
    });
    $('.button_9').on('click', function() {
        inputNumber(9);
    });
    $('.button_decimal').on('click', function() {
        inputDecimal();
    });
    $('.button_pi').on('click', function() {
        inputPi();
    });
    $('.button_clear').on('click', function() {
        actionClear();
    });
    $('.button_percent').on('click', function() {
        actionPercent();
    });
    $('.button_sum').on('click', function() {
        operator('+');
    });
    $('.button_sub').on('click', function() {
        operator('-');
    });
    $('.button_mul').on('click', function() {
        operator('*');
    });
    $('.button_div').on('click', function() {
        operator('/');
    });
    $('.button_equal').on('click', function() {
        actionEqual();
    });
    $('.button_inverse').on('click', function() {
        actionInverse();
    });
    $('.button_reciprocal').on('click', function() {
        actionReciprocal();
    });
    $('.button_square').on('click', function() {
        actionSquare();
    });
    $('.button_squareroot').on('click', function() {
        actionSquareroot();
    });
    $('.button_memoryclear').on('click', function() {
        memoryClear();
    });
    $('.button_memoryrecall').on('click', function() {
        memoryRecall();
    });
    $('.button_memorysum').on('click', function() {
        memorySum();
    });
    $('.button_memorysub').on('click', function() {
        memorySub();
    });
});
