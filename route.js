Router.configure({
  // the default layout
  layoutTemplate: 'mainNav'
});
 
Router.route('/', function () {
  this.render('homepage');
  this.layout('mainNav');
});

Router.route('/chatrooms', function () {
  this.render('roompage');
  this.layout('mainNav');
});

Router.route('/chatroomscreate', function () {
  this.render('roomcreatepage');
  this.layout('mainNav');
});

Router.route('/dashboard', function () {
  this.render('dashboardpage');
  this.layout('mainNav');
});

Router.route('/invites', function () {
  this.render('invitespage');
  this.layout('mainNav');
});
