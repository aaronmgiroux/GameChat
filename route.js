/**
 Copyright (c) <2015> <copyright Martin Agents, David Chong, Aaron Giroux, Geoffrey Scofield, Daniel Sullivan, >


 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:


 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.


 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */
Router.configure({
  // the default layout
  layoutTemplate: 'mainNav'
});
 
Router.route('/', function () {
  this.render('homepage');
  this.layout('mainNav');
});

Router.route('/games', function () {
  this.render('gamespage');
  this.layout('mainNav');
});

Router.route('/gamescreate', function () {
  this.render('gamescreatepage');
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

Router.route('/chatroomsadmin', function () {
  this.render('roomadminpage');
  this.layout('mainNav');
});

Router.route('/friends', function () {
  this.render('friendspage');
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
