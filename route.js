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