/* jQuery tabs plugin by greg.sidelnikov@gmail.com
   www.authenticsociety.com

   How to use: http://www.authenticsociety.com/blog/jQueryTabsPlugin
*/

$.Tabs = function() { /*main object*/ }

            $.Tabs.initialize = function()
            {
                var tabCount = 3, p, str;
                var previousTab = 0; /*0=default*/
                $.Tabs.parameters = p = [];
                for (var i = 0; i < arguments.length; i++)
                    p[i] = arguments[i];
                // construct tabbed view
                for (var str = "<div class = 'view' style = 'position:absolute; top:26px; left:2px; width:" + (parseInt(p[1])-6) + "; height:" + (parseInt(p[2])-4-26) + ";'></div><div style = 'width:" + p[1] + "; height:32px;'>", i = 0; i < p[ tabCount ]; i++)
                    str += "<div class = 'tab' style = 'float:left;' id = '" + i + "'>" + ( p[4][i] ) + "</div>"
                str += "</div>";
                // adjust view
                $("#" + p[0]).css({ width:p[1], height:p[2] });
                $("#" + p[0]).html(str);

                // load default view and highlight default tab
                $("#" + p[0] + " .view").html( $("#" + p[5][0]).html() );
                $("#" + p[0] + " #0").addClass("ON");



                // attach onclick events to all tabs! ~and take care of tab highlighting
                $("#" + p[0] + " .tab").click( function() {
                    var id = this.id;
                    if (id != previousTab) {
                        $("#" + p[0] + " #" + previousTab).removeClass("ON");
                        $("#" + p[0] + " #" + id).addClass("ON");
                        $("#" + p[0] + " .view").html( $("#" + p[5][id]).html() );
                        previousTab = id;
                    }
                });
            }