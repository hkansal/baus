Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: {
        html: '<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'
    },

    // This is the first thing that happens when the app loads
    launch: function() {
        this.iterationCombobox = this.add({
            xtype: 'rallyiterationcombobox'
        });
    },
    
    // When the iteration selection dropdown has finished loading, load all cards
    _onIterationComboboxLoad: function() {
        
        var cardBoardConfig = {
            xtype: 'rallycardboard',
            types: ['Defect', 'User Story'],
            attribute: 'ScheduleState',
            storeConfig: {
                filters: [this.iterationCombobox.getQueryFromSelected()]
            }
        };
        
        this.cardBoard = this.add(cardBoardConfig);
    }

});
