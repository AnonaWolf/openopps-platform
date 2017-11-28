module.exports = { 
  subject: '<%- task.title %> is due soon',
  to: '<%- volunteers %>',
  cc: '<%- owner.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      owner: model.owner,
      volunteers: model.volunteers,
    };
    done(null, data);
  },
};
