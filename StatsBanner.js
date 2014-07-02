(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * Allows user to see stats for a timebox in a horizontal bar format
     */
    Ext.define('Rally.apps.iterationtrackingboard.StatsBanner', {
        extend: 'Ext.Container',
        alias:'widget.statsbanner',
        requires: [
            'Rally.apps.iterationtrackingboard.statsbanner.PlannedVelocity',
            'Rally.apps.iterationtrackingboard.statsbanner.TimeboxEnd',
            'Rally.apps.iterationtrackingboard.statsbanner.Defects',
            'Rally.apps.iterationtrackingboard.statsbanner.Accepted',
            'Rally.apps.iterationtrackingboard.statsbanner.Tasks',
            'Rally.apps.iterationtrackingboard.statsbanner.IterationProgress',
            'Rally.apps.iterationtrackingboard.statsbanner.CollapseExpand'
        ],
        mixins: [
            'Rally.Messageable',
            'Rally.clientmetrics.ClientMetricsRecordable'
        ],
        cls: 'stats-banner',
        layout: 'hbox',
        border: 0,
        width: '100%',
        stateful: true,
        stateEvents: ['expand', 'collapse'],

        config: {
            context: null,
            expanded: true
        },

        items: [
            {xtype: 'statsbannerplannedvelocity'},
            {xtype: 'statsbannertimeboxend'},
            {xtype: 'statsbanneraccepted'},
            {xtype: 'statsbannerdefects'},
            {xtype: 'statsbannertasks'},
            {xtype: 'statsbanneriterationprogress', flex: 2},
            {xtype: 'statsbannercollapseexpand', flex: 0}
        ],

        constructor: function() {
            this.stateId = Rally.environment.getContext().getScopedStateId('stats-banner');
            this.callParent(arguments);
        },

        initComponent: function() {
            this.addEvents(
                /**
                 * @event
                 * Fires when expand is clicked
                 */
                'expand',
                /**
                 * @event
                 * Fires when collapse is clicked
                 */
                'collapse'
            );

            this.subscribe(this, Rally.Message.objectDestroy, this._update, this);
            this.subscribe(this, Rally.Message.objectCreate, this._update, this);
            this.subscribe(this, Rally.Message.objectUpdate, this._update, this);
            this.subscribe(this, Rally.Message.bulkUpdate, this._update, this);

            this.store = Ext.create('Rally.data.wsapi.artifact.Store', {
                models: ['User Story', 'Defect', 'Defect Suite', 'Test Set'],
                fetch: ['Defects:summary[State;ScheduleState+Blocked]', 'PlanEstimate', 'Requirement', 'FormattedID', 'Name', 'Blocked', 'BlockedReason',
                    'ScheduleState', 'State', 'Tasks:summary[State+Blocked]', 'TestCases'],
                useShallowFetch: true,
                filters: [this.context.getTimeboxScope().getQueryFilter()],
                context: this.context.getDataContext(),
                limit: Infinity,
                requester: this
            });

            //need to configure the items at the instance level, not the class level (i.e. don't use the 'defaults' config)
            this.items = this._configureItems(this.items);

            this.on('expand', this._onExpand, this);
            this.on('collapse', this._onCollapse, this);
            this.callParent(arguments);

            this._update();
        },

        onRender: function() {
            if (this.expanded) {
                this.removeCls('collapsed');
            } else {
                this.addCls('collapsed');
            }
            this._setExpandedOnChildItems();
            this.callParent(arguments);
        },

        applyState: function (state) {
            if (Ext.isDefined(state.expanded)) {
                this.setExpanded(state.expanded);
            }
            this._setExpandedOnChildItems();
        },

        getState: function(){
            return {
                expanded: this.expanded
            };
        },

        _setExpandedOnChildItems: function() {
            _.each(this.items.getRange(), function(item) {
                item.setExpanded(this.expanded);
            }, this);
        },

        _getItemDefaults: function() {
            return {
                flex: 1,
                context: this.context,
                store: this.store,
                listeners: {
                    ready: this._onReady,
                    scope: this
                }
            };
        },

        _onReady: function() {
            this._readyCount = (this._readyCount || 0) + 1;
            if(this._readyCount === this.items.getCount()) {
                this.recordComponentReady();
                delete this._readyCount;
            }
        },

        _onCollapse: function() {
            this.addCls('collapsed');
            this.setExpanded(false);

            _.invoke(this.items.getRange(), 'collapse');
        },

        _onExpand: function() {
            this.removeCls('collapsed');
            this.setExpanded(true);

            _.invoke(this.items.getRange(), 'expand');
        },

        _hasTimebox: function() {
            return !!this.context.getTimeboxScope().getRecord();
        },

        _configureItems: function(items) {
            var defaults = this._getItemDefaults();

            return _.map(items, function(item) {
                return _.defaults(_.cloneDeep(item), defaults);
            });
        },

        _update: function () {
            if(this._hasTimebox()) {
                this.store.load();
            }
        }
    });
})();
