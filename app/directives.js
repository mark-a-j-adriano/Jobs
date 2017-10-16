app.directive('eventFocus', function (focus) {
    return function (scope, elem, attr) {
        elem.on(attr.eventFocus, function () {
            focus(attr.eventFocusId);
        });

        // Removes bound events in the element itself
        // when the scope is destroyed
        scope.$on('$destroy', function () {
            element.off(attr.eventFocus);
        });
    };
});
app.directive('formElement', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            label: "@",
            model: "="
        },
        link: function (scope, element, attrs) {
            scope.disabled = attrs.hasOwnProperty('disabled');
            scope.required = attrs.hasOwnProperty('required');
            scope.pattern = attrs.pattern || '.*';
        },
        template: '<div class="form-group"><label class="col-sm-3 control-label no-padding-right" >  {{label}}</label><div class="col-sm-7"><span class="block input-icon input-icon-right" ng-transclude></span></div></div>'
    };

});

app.directive('onlyNumbers', function () {
    return function (scope, element, attrs) {
        var keyCode = [8, 9, 13, 37, 39, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 110, 190];
        element.bind("keydown", function (event) {
            if ($.inArray(event.which, keyCode) == -1) {
                scope.$apply(function () {
                    scope.$eval(attrs.onlyNum);
                    event.preventDefault();
                });
                event.preventDefault();
            }

        });
    };
});
app.directive('focus', function () {
    return function (scope, element) {
        element[0].focus();
    }
});

app.directive('customAutofocus', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            //console.log('[customAutofocus ]');
            scope.$watch(function () {
                return scope.$eval(attrs.customAutofocus);
            }, function (newValue) {
                //console.log('[customAutofocus ] newValue:' + newValue);
                if (newValue === true) {
                    element[0].focus();//use focus function instead of autofocus attribute to avoid cross browser problem. And autofocus should only be used to mark an element to be focused when page loads.
                }
            });
        }
    };
})
app.directive('animateOnChange', function ($animate) {
    return function (scope, elem, attr) {
        scope.$watch(attr.animateOnChange, function (nv, ov) {
            if (nv != ov) {
                var c = 'change-up';
                $animate.addClass(elem, c, function () {
                    $animate.removeClass(elem, c);
                });
            }
        });
    }
});
app.directive('throttle', function ($window) {
    var WAIT_TIME = 750;
    return {
        scope: true,
        link: function (scope, element, attrs) {
            var name = attrs.throttle;

            function setValue(value) {
                // Shadow the value in the child scope
                scope[name] = value;

                // The leading edge of the _.throttle callback
                // is called within a digest, but later ones are not
                scope.$$phase || scope.$apply();
            }

            scope.$parent.$watch(name, $window._.throttle(setValue, WAIT_TIME));
        }
    };
});
