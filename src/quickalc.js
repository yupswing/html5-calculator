/*

QuickCalc by Simone Cingano
A simple calculator written in pure HTML5
Licence: MIT
Version: 1.2.0
Repository: https://github.com/yupswing/quickalc

*/

var DOT = '.'; // DO NOT CHANGE
var CLEAR_ALL = 'AC';
var CLEAR = 'C';
var NULL_BUFFER_INPUT = '0';
BigNumber.config({
    DECIMAL_PLACES: 15,
    ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    EXPONENTIAL_AT: [-7, 20], // same as js
    RANGE: [-324, 308], // same as js
    ERRORS: false,
    CRYPTO: true,
    MODULO_MODE: BigNumber.ROUND_DOWN,
    POW_PRECISION: 15,
    FORMAT: {
        groupSize: 3,
        groupSeparator: ',',
        decimalSeparator: '.'
    }
});

var buffer_input = NULL_BUFFER_INPUT; // text input buffer
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
        $('#display').html(registry_main.toFormat());
    } else {
        $('#display').html(buffer_input || 0);
    }
    if (registry_operator) {
        if (!isNull(buffer_input) && buffer_input !== NULL_BUFFER_INPUT) {
            $('#buffer').html(registry_main.toFormat() + ' ' + _operatorFormat(registry_operator));
        } else if (!isNull(registry_input)) {
            $('#buffer').html(_operatorFormat(registry_operator) + ' ' + registry_input.toFormat());
        } else {
            $('#buffer').html(_operatorFormat(registry_operator));
        }
    } else {
        $('#buffer').html('');
    }
    if (registry_memory && !registry_memory.equals(0)) {
        $('.button_memoryrecall').addClass('has_memory');
        // $('#memory').html(parseFloat(registry_memory).toFixed(15).replace(/\.?0+$/, ''));
    } else {
        $('.button_memoryrecall').removeClass('has_memory');
    }

    if (has_to_all_clear) {
        $('#clear').html(CLEAR_ALL);
    } else {
        $('#clear').html(CLEAR);
    }
}

function _operatorFormat(op) {
    return '<strong>' + {
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '+'
    }[op] + '</strong>';
}

function operator(op, opequal) {
    has_to_all_clear = true;
    if (is_error) return;
    if (!opequal && !is_last_operator_equal && has_to_show_registry_main) {
        // avoid multi operator (example: x+*...)
        return;
    }

    if (isNull(registry_main) && isNull(buffer_input)) {
        buffer_input = NULL_BUFFER_INPUT;
    }
    if (opequal && isNull(buffer_input) && isNull(registry_input)) {
        // avoid EQUAL without an input (example: x+y=z => z+=)
        return;
    }

    has_to_show_registry_main = true;

    var _input_number = new BigNumber(buffer_input || 0);
    if (_input_number.isNaN()) _input_number = new BigNumber(0);
    buffer_input = null;

    if (!opequal && is_last_operator_equal) {
        // remove OPERATOR if executing an OP after an EQUAL
        registry_operator = null;
    }

    if (!isNull(registry_main)) {
        // if it was already performed an operation
        if (opequal && !isNull(registry_input)) {
            // it is a actionEqual with already an input from before (use it as it was input manually)
            _input_number = registry_input;
        } else {
            // save the input value for a possible multiple equal press
            registry_input = _input_number;
        }
        switch (registry_operator) {
            case '+':
                registry_main = registry_main.plus(_input_number);
                _highlight('button_sum');
                break;
            case '-':
                registry_main = registry_main.minus(_input_number);
                _highlight('button_sub');
                break;
            case '*':
                registry_main = registry_main.times(_input_number);
                _highlight('button_mul');
                break;
            case '/':
                if (_input_number.equals(0)) {
                    _error("DIV/0");
                    return;
                }
                registry_main = registry_main.dividedBy(_input_number);
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
        buffer_input = _parseBufferInput((new BigNumber(buffer_input)).dividedBy(100).times(registry_main));
    } else if (!isNull(buffer_input)) {
        buffer_input = _parseBufferInput((new BigNumber(buffer_input)).dividedBy(100));
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
        buffer_input = _parseBufferInput((new BigNumber(buffer_input)).times(-1));
    } else if (!isNull(registry_main)) {
        registry_main = registry_main.times(-1);
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
        if ((new BigNumber(buffer_input)).equals(0)) { // COMPARISON OK
            _error("NAN");
            return;
        }
        buffer_input = _parseBufferInput((new BigNumber(-1)).dividedBy((new BigNumber(buffer_input))));
    } else if (!isNull(registry_main)) {
        if (registry_main.equals(0)) { // COMPARISON OK
            _error("NAN");
            return;
        }
        registry_main = (new BigNumber(-1)).dividedBy(registry_main);
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
        buffer_input = _parseBufferInput((new BigNumber(buffer_input)).toPower(2));
    } else if (!isNull(registry_main)) {
        registry_main = registry_main.toPower(2);
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
        if ((new BigNumber(buffer_input)).lessThan(0)) {
            _error("NAN");
            return;
        }
        buffer_input = _parseBufferInput((new BigNumber(buffer_input)).sqrt());
    } else if (!isNull(registry_main)) {
        if (registry_main.lessThan(0)) {
            _error("NAN");
            return;
        }
        registry_main = registry_main.sqrt();
    } else {
        return;
    }
    _update();
    _highlight('button_squareroot');
    _highlightDisplay();
}

function memorySum() {
    if (is_error) return;
    if (isNull(registry_memory)) registry_memory = new BigNumber(0);
    if (has_to_show_registry_main) {
        if (isNull(registry_main) || registry_main.equals(0)) return;
        registry_memory = registry_memory.plus(registry_main);
    } else {
        if (buffer_input === NULL_BUFFER_INPUT) return;
        registry_memory = registry_memory.plus(new BigNumber(buffer_input || 0));
    }
    _highlightMemory();
    _highlight('button_memorysum');
    _update();
}

function memorySub() {
    if (is_error) return;
    if (isNull(registry_memory)) registry_memory = new BigNumber(0);
    if (has_to_show_registry_main) {
        if (isNull(registry_main) || registry_main.equals(0)) return;
        registry_memory = registry_memory.minus(registry_main);
    } else {
        if (buffer_input === NULL_BUFFER_INPUT) return;
        registry_memory = registry_memory.minus(new BigNumber(buffer_input || 0));
    }
    _highlightMemory();
    _highlight('button_memorysub');
    _update();
}

function memoryClear() {
    if (is_error) return;
    if (isNull(registry_memory) || registry_memory.equals(0)) return;
    registry_memory = null;
    _highlightMemory();
    _highlight('button_memoryclear');
    _update();
}

function memoryRecall() {
    if (is_error) return;
    if (isNull(registry_memory) || registry_memory.equals(0)) return;
    buffer_input = registry_memory.toString();
    _highlightDisplay();
    _highlight('button_memoryrecall');
    _input();
}

function actionInfo() {
    setTimeout(function() {
        window.open('http://simonecingano.it/apps/quickalc/');
    }, 100);
    _highlight('button_info');
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
    new_buffer_input = new BigNumber(new_buffer_input);
    if (new_buffer_input.isNaN() || new_buffer_input.equals(0)) {
        return NULL_BUFFER_INPUT;
    }
    return new_buffer_input.toString();
}

function _clearRegistries() {
    registry_main = null;
    registry_input = null;
    registry_operator = null;
}

function actionClear() {
    if (has_to_all_clear || is_error) {
        _clearRegistries();
    }
    buffer_input = NULL_BUFFER_INPUT;
    is_error = false;
    has_to_show_registry_main = false;
    has_to_all_clear = true;
    _highlight('button_clear');
    _highlightDisplay();
    _update();
}

var timeouts = {};

function _highlight(cls) {
    var obj = $('.' + cls);
    if (timeouts.hasOwnProperty(cls)) {
        if (timeouts[cls]) clearTimeout(timeouts[cls]);
    }
    obj.removeClass('pressed').addClass('pressed');
    timeouts[cls] = setTimeout(function() {
        obj.removeClass('pressed');
    }, 100);
}

function _highlightDisplay() {
    $('#display,#buffer').addClass('flash');
    setTimeout(function() {
        $('#display,#buffer').removeClass('flash');
    }, 100);
}

function _highlightMemory() {
    $('.button_memoryrecall').addClass('flash');
    setTimeout(function() {
        $('.button_memoryrecall').removeClass('flash');
    }, 100);
}

function inputNumber(n) {
    if (is_error) return;
    if (isNull(buffer_input) || buffer_input === NULL_BUFFER_INPUT) {
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
        buffer_input = NULL_BUFFER_INPUT;
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
        buffer_input = NULL_BUFFER_INPUT;
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
var is_copying = false;


$(function() {
    _update();

    //LISTENERS
    $(document).on('copy', function(e) {
        if (is_error) return;
        e.preventDefault();
        var output = 0;
        if (has_to_show_registry_main) {
            output = registry_main.toString();
        } else {
            output = buffer_input || 0;
        }
        (e.originalEvent || e).clipboardData.setData('text/plain', output);
        _highlightDisplay();
        is_copying = false;
    });

    $(document).on('paste', function(e) {
        if (is_error) return;
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain') || '';
        if (text) {
            var input = new BigNumber(text);
            if (!input.isNaN()) {
                buffer_input = '' + input.toString();
                _input();
            }
        }
    });

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
            case 94: // ^
                actionSquare();
                break;
                actionSquareroot();
                break;
            case 109: // M
                memoryRecall();
                break;
            case 110: // N
                memoryClear();
                break;
            case 106: // J
                memorySub();
                break;
            case 107: // K
                memorySum();
                break;
            case 114: // R
            case 120: // X
                actionReciprocal();
                break;
            case 105: // I
                actionInverse();
                break;
        }
    });
    $('.button_0').on('mousedown', function() {
        inputNumber(0);
    });
    $('.button_1').on('mousedown', function() {
        inputNumber(1);
    });
    $('.button_2').on('mousedown', function() {
        inputNumber(2);
    });
    $('.button_3').on('mousedown', function() {
        inputNumber(3);
    });
    $('.button_4').on('mousedown', function() {
        inputNumber(4);
    });
    $('.button_5').on('mousedown', function() {
        inputNumber(5);
    });
    $('.button_6').on('mousedown', function() {
        inputNumber(6);
    });
    $('.button_7').on('mousedown', function() {
        inputNumber(7);
    });
    $('.button_8').on('mousedown', function() {
        inputNumber(8);
    });
    $('.button_9').on('mousedown', function() {
        inputNumber(9);
    });
    $('.button_decimal').on('mousedown', function() {
        inputDecimal();
    });
    $('.button_pi').on('mousedown', function() {
        inputPi();
    });
    $('.button_clear').on('mousedown', function() {
        actionClear();
    });
    $('.button_percent').on('mousedown', function() {
        actionPercent();
    });
    $('.button_sum').on('mousedown', function() {
        operator('+');
    });
    $('.button_sub').on('mousedown', function() {
        operator('-');
    });
    $('.button_mul').on('mousedown', function() {
        operator('*');
    });
    $('.button_div').on('mousedown', function() {
        operator('/');
    });
    $('.button_equal').on('mousedown', function() {
        actionEqual();
    });
    $('.button_inverse').on('mousedown', function() {
        actionInverse();
    });
    $('.button_reciprocal').on('mousedown', function() {
        actionReciprocal();
    });
    $('.button_square').on('mousedown', function() {
        actionSquare();
    });
    $('.button_squareroot').on('mousedown', function() {
        actionSquareroot();
    });
    $('.button_memoryclear').on('mousedown', function() {
        memoryClear();
    });
    $('.button_memoryrecall').on('mousedown', function() {
        memoryRecall();
    });
    $('.button_memorysum').on('mousedown', function() {
        memorySum();
    });
    $('.button_memorysub').on('mousedown', function() {
        memorySub();
    });
    $('.button_info').on('mousedown', function() {
        actionInfo();
    });

});
