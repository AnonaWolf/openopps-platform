
var _ = require('underscore');
var Backbone = require('backbone');

var Bootstrap = require('bootstrap');
var TasksCollection = require('../../../../entities/tasks/tasks_collection');
var TaskModel = require('../../../../entities/tasks/task_model');
var TaskListView = require('../views/task_list_view');

TaskController = Backbone.View.extend({
  events: {
    'click .add-opportunity' : 'add',
    'click .search-people'   : 'search',
  },

  initialize: function (options) {
    var self = this;
    self.options = options;
    new TaskListView({
      collection: new TasksCollection(),
      el: self.el,
      queryParams: self.options.queryParams,
    }).render();
  },

  add: function (e) {
    Backbone.history.navigate('/tasks/new', { trigger: true });
  },

  search: function (e) {
    Backbone.history.navigate('/profiles', { trigger: true });
  },

  show: function (e) {
    if (e.preventDefault) e.preventDefault();
    var projectId = $(e.currentTarget).data('projectid'),
        taskId    = $(e.currentTarget).data('id');

    if (taskId == 'null') { return; }

    Backbone.history.navigate('tasks/' + taskId, { trigger: true }, taskId);
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = TaskController;
