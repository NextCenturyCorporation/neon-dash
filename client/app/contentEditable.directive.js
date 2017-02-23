angular.module('neonDemo.directives', [])
.directive('contenteditable', function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {
            if(!ngModel) return;

            ngModel.$render = function() {
                element.html(ngModel.$viewValue || '');
            };

            element.on('blur keyup change', function() {
                scope.$apply(read);
            });
            read();

            function read() {
                var html = element.html();
                // When we clear the content editable the browser leaves a <br> behind
                // If strip-br attribute is provided then we strip this out
                if( attrs.stripBr && html == '<br>' ) {
                    html = '';
                }
                ngModel.$setViewValue(html);
            }
        }
    };
});