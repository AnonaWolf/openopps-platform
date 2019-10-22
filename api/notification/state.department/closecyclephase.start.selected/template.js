module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid)—You have been selected for an internship.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,         
      bureau_office: model.bureau_office,
      location: model.location,
      suggested_security_clearance: model.suggested_security_clearance,
      session: model.session,
      jobLink: model.jobLink,
      contact_email: model.contact_email,
      contact_name: model.contact_name,
      title: model.title,
    };
    done(null, data);
  },
};
